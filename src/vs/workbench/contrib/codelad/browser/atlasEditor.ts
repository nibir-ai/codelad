/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/atlas.css';
import { $, addDisposableListener, append, clearNode, Dimension, EventType } from '../../../../base/browser/dom.js';
import { getDefaultHoverDelegate } from '../../../../base/browser/ui/hover/hoverDelegateFactory.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { CancellationToken, CancellationTokenSource } from '../../../../base/common/cancellation.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { toErrorMessage } from '../../../../base/common/errorMessage.js';
import { isCancellationError } from '../../../../base/common/errors.js';
import { DisposableMap, DisposableStore, MutableDisposable } from '../../../../base/common/lifecycle.js';
import { basename } from '../../../../base/common/resources.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { URI } from '../../../../base/common/uri.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { IRange } from '../../../../editor/common/core/range.js';
import { SymbolKinds } from '../../../../editor/common/languages.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import { ITextModelService } from '../../../../editor/common/services/resolverService.js';
import { localize } from '../../../../nls.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext } from '../../../common/editor.js';
import { IEditorGroup, IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorService, SIDE_GROUP } from '../../../services/editor/common/editorService.js';
import { IExtensionService } from '../../../services/extensions/common/extensions.js';
import { CallHierarchyModel, CallHierarchyProviderRegistry } from '../../callHierarchy/common/callHierarchy.js';
import { ISCMRepository, ISCMService } from '../../scm/common/scm.js';
import { AtlasEditorInput } from './atlasEditorInput.js';
import { ATLAS_EDGE_LIMIT, ATLAS_NODE_LIMIT, AtlasGraph, filterAtlasGraph, IAtlasNode, IAtlasPlacement, layoutAtlasGraph } from './atlasGraph.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_WIDTH = 208;
const NODE_HEIGHT = 64;

/** A native workbench editor for bounded, provider-backed call relationships. */
export class AtlasEditor extends EditorPane {
	static readonly ID = 'workbench.editor.codeladAtlas';
	private container!: HTMLElement;
	private viewport!: HTMLElement;
	private stage!: HTMLElement;
	private world!: HTMLElement;
	private map!: SVGSVGElement;
	private inspector!: HTMLElement;
	private message!: HTMLElement;
	private count!: HTMLElement;
	private search!: HTMLInputElement;
	private refresh!: HTMLButtonElement;
	private cancel!: HTMLButtonElement;
	private callers!: HTMLInputElement;
	private callees!: HTMLInputElement;
	private changedOnly!: HTMLInputElement;
	private graph: AtlasGraph | undefined;
	private selected: string | undefined;
	private language = '';
	private busy = false;
	private focusPending = false;
	private stale = false;
	private zoom = 1;
	private size = { width: 1, height: 1 };
	private placements: IAtlasPlacement[] = [];
	private readonly nodeButtons = new Map<string, HTMLButtonElement>();
	private readonly edgeElements: { from: string; to: string; element: SVGPathElement }[] = [];
	private readonly arrowId = `atlas-arrow-${generateUuid()}`;
	private readonly inputStore = this._register(new DisposableStore());
	private readonly sessionStore = this._register(new DisposableStore());
	private readonly nodeStore = this._register(new DisposableStore());
	private readonly inspectorStore = this._register(new DisposableStore());
	private readonly modelListeners = this._register(new DisposableMap<string>());
	private readonly repositoryListeners = this._register(new DisposableMap<ISCMRepository>());
	private readonly request = this._register(new MutableDisposable<CancellationTokenSource>());
	private session: CallHierarchyModel | undefined;
	private sourceGroup: number | undefined;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@ITextModelService private readonly textModelService: ITextModelService,
		@IModelService private readonly modelService: IModelService,
		@IEditorService private readonly editorService: IEditorService,
		@IEditorGroupsService private readonly groupsService: IEditorGroupsService,
		@IExtensionService private readonly extensionService: IExtensionService,
		@IHoverService private readonly hoverService: IHoverService,
		@ISCMService private readonly scmService: ISCMService,
	) {
		super(AtlasEditor.ID, group, telemetryService, themeService, storageService);
		const observeRepository = (repository: ISCMRepository) => this.repositoryListeners.set(repository, repository.provider.onDidChangeResources(() => this.render()));
		for (const repository of scmService.repositories) {
			observeRepository(repository);
		}
		this._register(scmService.onDidAddRepository(observeRepository));
		this._register(scmService.onDidRemoveRepository(repository => { this.repositoryListeners.deleteAndDispose(repository); this.render(); }));
		this._register(modelService.onModelAdded(() => this.observeModels()));
	}

	protected override createEditor(parent: HTMLElement): void {
		this.container = append(parent, $('.codelad-atlas-editor'));
		const header = append(this.container, $('.atlas-header'));
		const heading = append(header, $('.atlas-heading'));
		append(heading, $('h2')).textContent = localize('atlas.title', "Atlas");
		this.count = append(heading, $('span.atlas-count'));
		const controls = append(header, $('.atlas-toolbar'));
		this.refresh = this.button(controls, localize('atlas.refresh', "Refresh from Anchor"), Codicon.refresh, () => this.load());
		this.cancel = this.button(controls, localize('atlas.cancel', "Cancel"), Codicon.close, () => {
			this.request.value?.cancel();
			this.busy = false;
			this.setMessage(localize('atlas.canceled', "Loading canceled. Refresh or expand a symbol to try again."));
			this.render();
		});
		this.button(controls, localize('atlas.zoomOut', "Zoom Out"), Codicon.remove, () => this.setZoom(this.zoom / 1.2));
		this.button(controls, localize('atlas.zoomIn', "Zoom In"), Codicon.add, () => this.setZoom(this.zoom * 1.2));
		this.button(controls, localize('atlas.fit', "Fit Map"), Codicon.screenFull, () => {
			this.setZoom(Math.min(1, (this.viewport.clientWidth - 24) / this.size.width, (this.viewport.clientHeight - 24) / this.size.height));
			this.viewport.scrollTo(0, 0);
		});
		this.button(controls, localize('atlas.focusMap', "Toggle Map Focus"), Codicon.layout, () => this.groupsService.toggleMaximizeGroup(this.group));
		const filters = append(this.container, $('.atlas-filters'));
		this.search = append(filters, $<HTMLInputElement>('input.atlas-search'));
		this.search.type = 'search';
		this.search.placeholder = localize('atlas.filter', "Filter Symbols or Files");
		this.search.setAttribute('aria-label', this.search.placeholder);
		this._register(addDisposableListener(this.search, EventType.INPUT, () => this.render()));
		this.callers = this.checkbox(filters, localize('atlas.callers', "Callers"), true);
		this.callees = this.checkbox(filters, localize('atlas.callees', "Callees"), true);
		this.changedOnly = this.checkbox(filters, localize('atlas.changed', "Changed Files"), false);
		const body = append(this.container, $('.atlas-body'));
		const mapArea = append(body, $('.atlas-map-area'));
		this.viewport = append(mapArea, $('.atlas-viewport'));
		this.viewport.setAttribute('aria-label', localize('atlas.map', "Code Call Map"));
		this.viewport.role = 'group';
		this.viewport.tabIndex = 0;
		this.world = append(this.viewport, $('.atlas-world'));
		this.stage = append(this.world, $('.atlas-stage'));
		this.map = this.container.ownerDocument.createElementNS(SVG_NS, 'svg');
		this.map.classList.add('atlas-minimap');
		this.map.setAttribute('aria-label', localize('atlas.minimap', "Map Overview. Click to move the viewport."));
		this.map.setAttribute('preserveAspectRatio', 'none');
		this.map.setAttribute('role', 'img');
		mapArea.appendChild(this.map);
		this._register(addDisposableListener(this.map, EventType.CLICK, (event: MouseEvent) => {
			const bounds = this.map.getBoundingClientRect();
			this.viewport.scrollTo((event.clientX - bounds.left) / bounds.width * this.size.width * this.zoom - this.viewport.clientWidth / 2, (event.clientY - bounds.top) / bounds.height * this.size.height * this.zoom - this.viewport.clientHeight / 2);
		}));
		this._register(addDisposableListener(this.viewport, EventType.SCROLL, () => this.renderMinimap()));
		this.inspector = append(body, $('.atlas-inspector'));
		this.inspector.setAttribute('aria-label', localize('atlas.inspector', "Selected Symbol"));
		this.message = append(this.container, $('p.atlas-message'));
		this.message.role = 'status';
		this.message.setAttribute('aria-live', 'polite');
		this.setMessage(localize('atlas.start', "Place the caret on a function or method in a source file, then open Atlas. No project is scanned in the background."));
		this.render();
	}

	private checkbox(parent: HTMLElement, label: string, checked: boolean): HTMLInputElement {
		const wrapper = append(parent, $('label.atlas-filter'));
		const input = append(wrapper, $<HTMLInputElement>('input'));
		input.type = 'checkbox';
		input.checked = checked;
		append(wrapper, $('span')).textContent = label;
		this._register(addDisposableListener(input, EventType.CHANGE, () => this.render()));
		return input;
	}

	private button(parent: HTMLElement, label: string, icon: ThemeIcon | undefined, action: () => void | Promise<void>, store?: DisposableStore): HTMLButtonElement {
		const button = append(parent, $<HTMLButtonElement>('button.atlas-button'));
		button.type = 'button';
		button.setAttribute('aria-label', label);
		if (icon) {
			const rendered = append(button, renderIcon(icon));
			rendered.setAttribute('aria-hidden', 'true');
		}
		append(button, $('span')).textContent = label;
		const hover = this.hoverService.setupManagedHover(getDefaultHoverDelegate('mouse'), button, label);
		const click = addDisposableListener(button, EventType.CLICK, () => { void Promise.resolve(action()).catch(error => this.setMessage(toErrorMessage(error), true)); });
		if (store) {
			store.add(hover); store.add(click);
		} else {
			this._register(hover); this._register(click);
		}
		return button;
	}

	override async setInput(input: AtlasEditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);
		this.inputStore.clear();
		this.inputStore.add(input.onDidChangeSeed(() => { void this.load(); }));
		if (input.loadRequested) {
			input.loadRequested = false;
			void this.load();
		} else if (!this.graph && !this.busy) {
			this.setMessage(localize('atlas.restored', "Atlas anchor restored. Refresh to load its call relationships."));
		}
		this.render();
	}

	private beginRequest(): CancellationTokenSource {
		this.request.value?.cancel();
		const request = new CancellationTokenSource();
		this.request.value = request;
		this.busy = true;
		return request;
	}

	private async load(): Promise<void> {
		const input = this.input;
		if (!(input instanceof AtlasEditorInput) || !input.seed || !this.container) {
			return;
		}
		input.loadRequested = false;
		const seed = input.seed;
		const request = this.beginRequest();
		this.sessionStore.clear();
		this.modelListeners.clearAndDisposeAll();
		this.session = undefined;
		this.graph = undefined;
		this.stale = false;
		this.setMessage(localize('atlas.loading', "Loading call relationships from the source language provider…"));
		this.render();
		try {
			const reference = await this.textModelService.createModelReference(seed.uri);
			if (request.token.isCancellationRequested) { reference.dispose(); return; }
			this.sessionStore.add(reference);
			const model = reference.object.textEditorModel;
			this.language = model.getLanguageId();
			await this.extensionService.activateByEvent(`onLanguage:${this.language}`);
			if (request.token.isCancellationRequested) { return; }
			if (!CallHierarchyProviderRegistry.has(model)) {
				this.setMessage(localize('atlas.unsupported', "No call hierarchy provider is available for {0}. Open a supported source file and place the caret on a function or method.", this.language));
				return;
			}
			const session = await CallHierarchyModel.create(model, model.validatePosition(seed.position), request.token);
			if (request.token.isCancellationRequested) { session?.dispose(); return; }
			if (!session?.root) {
				session?.dispose();
				this.setMessage(localize('atlas.noSymbol', "No callable symbol was found at the anchor. Place the caret on a function or method and reopen Atlas."));
				return;
			}
			this.session = this.sessionStore.add(session);
			this.graph = new AtlasGraph(session.root);
			this.selected = this.graph.rootId;
			this.search.value = '';
			this.zoom = 1;
			this.observeModels();
			await this.resolve(this.graph.nodes.get(this.graph.rootId)!, true, true, request.token);
			if (!request.token.isCancellationRequested) {
				this.snapshotMessage();
				this.render(true);
			}
		} catch (error) {
			if (!request.token.isCancellationRequested && !isCancellationError(error)) {
				this.setMessage(localize('atlas.loadError', "Atlas could not load this anchor: {0}. Refresh to try again.", toErrorMessage(error)), true);
			}
		} finally {
			if (this.request.value === request) {
				this.busy = false;
				this.render();
			}
		}
	}

	private async resolve(node: IAtlasNode, incoming: boolean, outgoing: boolean, token: CancellationToken): Promise<void> {
		const graph = this.graph;
		const session = this.session;
		if (!graph || !session) { return; }
		if (incoming && !node.incoming) {
			const calls = await session.provider.provideIncomingCalls(node.item, token);
			if (token.isCancellationRequested || this.stale) { return; }
			graph.addIncoming(node, calls ?? []);
		}
		if (outgoing && !node.outgoing) {
			const calls = await session.provider.provideOutgoingCalls(node.item, token);
			if (token.isCancellationRequested || this.stale) { return; }
			graph.addOutgoing(node, calls ?? []);
		}
		this.observeModels();
	}

	private async expand(incoming: boolean, outgoing: boolean): Promise<void> {
		const node = this.selected && this.graph?.nodes.get(this.selected);
		if (!node || this.busy || this.stale) { return; }
		const request = this.beginRequest();
		this.setMessage(localize('atlas.expanding', "Loading relationships for {0}…", node.item.name));
		this.render();
		try {
			await this.resolve(node, incoming, outgoing, request.token);
			if (!request.token.isCancellationRequested) {
				this.snapshotMessage();
				this.render(true);
			}
		} catch (error) {
			if (!request.token.isCancellationRequested && !isCancellationError(error)) {
				this.setMessage(localize('atlas.expandError', "Could not expand {0}: {1}. Try expanding again.", node.item.name, toErrorMessage(error)), true);
			}
		} finally {
			if (this.request.value === request) { this.busy = false; this.render(); }
		}
	}

	private observeModels(): void {
		if (!this.graph) { return; }
		for (const node of this.graph.nodes.values()) {
			const key = node.item.uri.toString();
			const model = this.modelService.getModel(node.item.uri);
			if (model && !this.modelListeners.has(key)) {
				const store = new DisposableStore();
				this.modelListeners.set(key, store);
				store.add(model.onDidChangeContent(() => {
					this.stale = true;
					this.request.value?.cancel();
					this.busy = false;
					this.setMessage(localize('atlas.stale', "An open source file changed. Refresh before expanding this snapshot."));
					this.render();
				}));
				store.add(model.onWillDispose(() => this.modelListeners.deleteAndDispose(key)));
			}
		}
	}

	private changedFiles(): Set<string> {
		const changed = new Set<string>();
		for (const repository of this.scmService.repositories) {
			for (const group of repository.provider.groups) {
				for (const resource of group.resources) {
					changed.add(resource.sourceUri.toString());
				}
			}
		}
		return changed;
	}

	private setMessage(message: string, error = false): void {
		if (this.message) {
			this.message.textContent = message;
			this.message.classList.toggle('error', error);
		}
	}

	private snapshotMessage(): void {
		if (this.stale) { return; }
		this.setMessage(this.graph?.truncated
			? localize('atlas.limited', "Graph limit reached ({0} symbols / {1} edges). Some provider results were omitted. Open another source anchor to explore further.", ATLAS_NODE_LIMIT, ATLAS_EDGE_LIMIT)
			: this.graph?.edges.size === 0
				? localize('atlas.noCalls', "The provider returned no callers or callees for this symbol. This does not establish that the symbol is unused.")
				: localize('atlas.snapshot', "{0} call hierarchy snapshot. Arrows point from caller to callee. Refresh after source changes; the anchor stays visible when filtering.", this.language));
	}

	private render(reveal = false): void {
		if (!this.container) { return; }
		const focused = this.container.ownerDocument.activeElement;
		const retainNodeFocus = !!focused && this.stage.contains(focused);
		this.cancel.disabled = !this.busy;
		this.refresh.disabled = this.busy || !(this.input instanceof AtlasEditorInput) || !this.input.seed;
		this.nodeStore.clear();
		this.nodeButtons.clear();
		this.edgeElements.length = 0;
		clearNode(this.stage);
		const changed = this.changedFiles();
		const filtered = this.graph ? filterAtlasGraph(this.graph, this.search.value, this.callers.checked, this.callees.checked, this.changedOnly.checked, changed) : { nodes: [], edges: [] };
		const layout = layoutAtlasGraph(filtered.nodes);
		this.placements = layout.placements;
		this.size = layout;
		if (!filtered.nodes.some(node => node.id === this.selected)) { this.selected = this.graph?.rootId; }
		this.count.textContent = this.graph ? localize('atlas.count', "{0} of {1} Symbols · {2} Calls", filtered.nodes.length, this.graph.nodes.size, filtered.edges.length) : localize('atlas.provider', "Language-Service Call Map");
		const svg = this.container.ownerDocument.createElementNS(SVG_NS, 'svg');
		svg.classList.add('atlas-edges');
		svg.setAttribute('width', String(layout.width));
		svg.setAttribute('height', String(layout.height));
		svg.setAttribute('aria-hidden', 'true');
		const defs = this.svg(svg, 'defs');
		const marker = this.svg(defs, 'marker', { id: this.arrowId, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
		this.svg(marker, 'path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'atlas-arrow' });
		const positions = new Map(layout.placements.map(placement => [placement.node.id, placement]));
		for (const edge of filtered.edges) {
			const from = positions.get(edge.from)!;
			const to = positions.get(edge.to)!;
			const x1 = from.x + NODE_WIDTH;
			const y1 = from.y + NODE_HEIGHT / 2;
			const x2 = to.x;
			const y2 = to.y + NODE_HEIGHT / 2;
			const bend = Math.max(36, Math.abs(x2 - x1) / 2);
			const path = edge.from === edge.to
				? `M ${from.x + 150} ${from.y} C ${from.x + 190} ${from.y - 36}, ${from.x + 18} ${from.y - 36}, ${from.x + 58} ${from.y}`
				: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
			const element = this.svg(svg, 'path', { d: path, class: edge.from === this.selected || edge.to === this.selected ? 'atlas-edge selected' : 'atlas-edge', 'marker-end': `url(#${this.arrowId})` });
			this.edgeElements.push({ from: edge.from, to: edge.to, element });
		}
		this.stage.appendChild(svg);
		for (const placement of layout.placements) {
			this.renderNode(placement, changed);
		}
		this.applyZoom();
		this.renderInspector();
		if (reveal) { this.revealSelected(); }
		if (retainNodeFocus) { this.focusSelected(); }
		if (this.focusPending && focused === this.viewport && this.selected && this.nodeButtons.has(this.selected)) {
			this.focusPending = false;
			this.focusSelected();
		}
	}

	private renderNode(placement: IAtlasPlacement, changed: ReadonlySet<string>): void {
		const { node, x, y } = placement;
		const selected = node.id === this.selected;
		const button = append(this.stage, $<HTMLButtonElement>('button.atlas-node'));
		button.type = 'button';
		button.style.left = `${x}px`;
		button.style.top = `${y}px`;
		button.tabIndex = selected ? 0 : -1;
		button.dataset.atlasNode = node.id;
		this.nodeButtons.set(node.id, button);
		button.classList.toggle('selected', selected);
		button.classList.toggle('anchor', node.id === this.graph?.rootId);
		button.setAttribute('aria-pressed', String(selected));
		const name = append(button, $('span.atlas-node-name'));
		const icon = append(name, renderIcon(SymbolKinds.toIcon(node.item.kind)));
		icon.classList.add('codicon-colored');
		icon.setAttribute('aria-hidden', 'true');
		append(name, $('span')).textContent = node.item.name;
		append(button, $('span.atlas-node-file')).textContent = localize('atlas.fileLine', "{0}:{1}", basename(node.item.uri), node.item.selectionRange.startLineNumber);
		const modified = changed.has(node.item.uri.toString());
		if (modified) {
			append(button, $('span.atlas-changed-mark')).textContent = localize('atlas.changedMark', "Changed");
		}
		const hint = localize('atlas.nodeHint', "{0}. {1}, line {2}. {3} Enter opens source; E expands calls; arrow keys navigate.", node.item.name, node.item.uri.path, node.item.selectionRange.startLineNumber, modified ? localize('atlas.scmChanged', "Source control reports changes in this file.") : '');
		button.setAttribute('aria-label', hint);
		this.nodeStore.add(this.hoverService.setupManagedHover(getDefaultHoverDelegate('mouse'), button, hint));
		this.nodeStore.add(addDisposableListener(button, EventType.CLICK, () => this.select(node.id, true)));
		this.nodeStore.add(addDisposableListener(button, EventType.DBLCLICK, () => { void this.openSource(node.item.uri, node.item.selectionRange); }));
		this.nodeStore.add(addDisposableListener(button, EventType.KEY_DOWN, (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault(); event.stopPropagation(); void this.openSource(node.item.uri, node.item.selectionRange);
			} else if (event.key.toLowerCase() === 'e' && !event.ctrlKey && !event.metaKey && !event.altKey) {
				event.preventDefault(); event.stopPropagation(); void this.expand(true, true);
			} else if (event.key === 'Home' || event.key.startsWith('Arrow')) {
				event.preventDefault(); event.stopPropagation(); this.navigate(placement, event.key);
			}
		}));
	}

	private select(id: string, focus: boolean): void {
		if (this.selected === id) {
			this.revealSelected();
			if (focus) { this.focusSelected(); }
			return;
		}
		this.selected = id;
		for (const [nodeId, button] of this.nodeButtons) {
			button.classList.toggle('selected', nodeId === id);
			button.setAttribute('aria-pressed', String(nodeId === id));
			button.tabIndex = nodeId === id ? 0 : -1;
		}
		for (const edge of this.edgeElements) { edge.element.classList.toggle('selected', edge.from === id || edge.to === id); }
		this.renderInspector();
		this.renderMinimap();
		this.revealSelected();
		if (focus) { this.focusSelected(); }
	}

	private navigate(origin: IAtlasPlacement, key: string): void {
		if (key === 'Home' && this.graph) { this.select(this.graph.rootId, true); return; }
		const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
		const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
		const candidates = this.placements.filter(item => horizontal ? (item.x - origin.x) * sign > 0 : item.x === origin.x && (item.y - origin.y) * sign > 0);
		candidates.sort((a, b) => (horizontal ? Math.abs(a.x - origin.x) * 10 + Math.abs(a.y - origin.y) : Math.abs(a.y - origin.y)) - (horizontal ? Math.abs(b.x - origin.x) * 10 + Math.abs(b.y - origin.y) : Math.abs(b.y - origin.y)));
		if (candidates[0]) { this.select(candidates[0].node.id, true); }
	}

	private focusSelected(): void {
		if (this.selected) { this.nodeButtons.get(this.selected)?.focus({ preventScroll: true }); }
	}

	private renderInspector(): void {
		this.inspectorStore.clear();
		clearNode(this.inspector);
		const node = this.selected && this.graph?.nodes.get(this.selected);
		if (!node) {
			append(this.inspector, $('p')).textContent = localize('atlas.select', "Select a symbol to inspect its source and expand relationships.");
			return;
		}
		append(this.inspector, $('h3')).textContent = node.item.name;
		append(this.inspector, $('p.atlas-source-path')).textContent = localize('atlas.sourcePosition', "{0}:{1}:{2}", node.item.uri.path, node.item.selectionRange.startLineNumber, node.item.selectionRange.startColumn);
		if (node.item.detail) { append(this.inspector, $('pre.atlas-symbol-detail')).textContent = node.item.detail.slice(0, 5000); }
		this.button(this.inspector, localize('atlas.openSource', "Open Source Alongside"), Codicon.goToFile, () => this.openSource(node.item.uri, node.item.selectionRange), this.inspectorStore);
		const incoming = this.button(this.inspector, node.incoming ? localize('atlas.callersLoaded', "Callers Loaded") : localize('atlas.expandCallers', "Expand Callers"), Codicon.callIncoming, () => this.expand(true, false), this.inspectorStore);
		const outgoing = this.button(this.inspector, node.outgoing ? localize('atlas.calleesLoaded', "Callees Loaded") : localize('atlas.expandCallees', "Expand Callees"), Codicon.callOutgoing, () => this.expand(false, true), this.inspectorStore);
		incoming.disabled = this.busy || this.stale || node.incoming;
		outgoing.disabled = this.busy || this.stale || node.outgoing;
		append(this.inspector, $('p.atlas-provenance')).textContent = localize('atlas.provenance', "Calls reported by the {0} language provider. A static call relationship does not prove runtime execution.", this.language);
		const sites = append(this.inspector, $('.atlas-call-sites'));
		append(sites, $('h4')).textContent = localize('atlas.sites', "Loaded Call Sites");
		let count = 0;
		for (const edge of this.graph!.edges.values()) {
			if (edge.from !== node.id && edge.to !== node.id) { continue; }
			const from = this.graph!.nodes.get(edge.from)!;
			const to = this.graph!.nodes.get(edge.to)!;
			for (const range of edge.sites) {
				if (count++ >= 20) { break; }
				this.button(sites, localize('atlas.site', "{0} → {1}, line {2}", from.item.name, to.item.name, range.startLineNumber), undefined, () => this.openSource(from.item.uri, range), this.inspectorStore);
			}
			if (count > 20) { break; }
		}
		if (!count) { append(sites, $('p')).textContent = localize('atlas.noSites', "No call-site ranges are loaded for this symbol."); }
		if (count > 20) { append(sites, $('p')).textContent = localize('atlas.siteLimit', "Showing the first 20 loaded call sites."); }
		if ([...this.graph!.edges.values()].some(edge => (edge.from === node.id || edge.to === node.id) && edge.truncatedSites)) {
			append(sites, $('p')).textContent = localize('atlas.rangeLimit', "Call-site ranges are capped at 32 per relationship. Some provider locations were omitted.");
		}
	}

	private async openSource(uri: URI, selection: IRange): Promise<void> {
		if (this.sourceGroup === this.group.id || (this.sourceGroup !== undefined && !this.editorService.visibleEditorPanes.some(pane => pane.group?.id === this.sourceGroup))) { this.sourceGroup = undefined; }
		const pane = await this.editorService.openEditor({ resource: uri, options: { selection, pinned: true } }, this.sourceGroup ?? SIDE_GROUP);
		this.sourceGroup = pane?.group?.id;
	}

	setSourceGroup(groupId: number): void { this.sourceGroup = groupId === this.group.id ? undefined : groupId; }

	private svg<K extends keyof SVGElementTagNameMap>(parent: SVGElement, tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
		const element = this.container.ownerDocument.createElementNS(SVG_NS, tag);
		for (const [key, value] of Object.entries(attrs)) { element.setAttribute(key, value); }
		parent.appendChild(element);
		return element;
	}

	private renderMinimap(): void {
		if (!this.map) { return; }
		this.map.replaceChildren();
		this.map.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`);
		for (const placement of this.placements) {
			this.svg(this.map, 'rect', { x: String(placement.x), y: String(placement.y), width: String(NODE_WIDTH), height: String(NODE_HEIGHT), class: placement.node.id === this.selected ? 'selected' : 'node' });
		}
		this.svg(this.map, 'rect', { x: String(this.viewport.scrollLeft / this.zoom), y: String(this.viewport.scrollTop / this.zoom), width: String(Math.min(this.size.width, this.viewport.clientWidth / this.zoom)), height: String(Math.min(this.size.height, this.viewport.clientHeight / this.zoom)), class: 'viewport' });
		this.map.style.display = this.placements.length ? '' : 'none';
	}

	private applyZoom(): void {
		this.stage.style.width = `${this.size.width}px`;
		this.stage.style.height = `${this.size.height}px`;
		this.stage.style.transform = `scale(${this.zoom})`;
		this.world.style.width = `${this.size.width * this.zoom}px`;
		this.world.style.height = `${this.size.height * this.zoom}px`;
		this.renderMinimap();
	}

	private setZoom(value: number): void {
		const previous = this.zoom;
		this.zoom = Math.max(0.01, Math.min(2, value));
		this.viewport.scrollTo(this.viewport.scrollLeft / previous * this.zoom, this.viewport.scrollTop / previous * this.zoom);
		this.applyZoom();
	}

	private revealSelected(): void {
		const placement = this.placements.find(placement => placement.node.id === this.selected);
		if (placement) { this.viewport.scrollTo((placement.x + NODE_WIDTH / 2) * this.zoom - this.viewport.clientWidth / 2, (placement.y + NODE_HEIGHT / 2) * this.zoom - this.viewport.clientHeight / 2); }
	}

	override layout(dimension: Dimension): void {
		if (this.container) {
			this.container.style.width = `${dimension.width}px`;
			this.container.style.height = `${dimension.height}px`;
			this.container.classList.toggle('compact', dimension.width < 750);
			this.container.classList.toggle('narrow', dimension.width < 450);
			this.revealSelected();
			this.renderMinimap();
		}
	}

	override focus(): void {
		if (this.selected && this.nodeButtons.has(this.selected)) {
			this.focusSelected();
		} else {
			this.focusPending = true;
			this.viewport.focus();
		}
	}
	override clearInput(): void {
		this.request.value?.cancel();
		this.request.clear();
		this.inputStore.clear();
		this.sessionStore.clear();
		this.modelListeners.clearAndDisposeAll();
		this.session = undefined;
		this.graph = undefined;
		this.busy = false;
		this.focusPending = false;
		this.render();
		super.clearInput();
	}
	override dispose(): void { this.request.value?.cancel(); super.dispose(); }
}
