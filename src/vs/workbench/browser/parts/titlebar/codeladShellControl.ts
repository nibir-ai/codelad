/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/codeladShell.css';
import { $, addDisposableListener, append, EventType } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { getDefaultHoverDelegate } from '../../../../base/browser/ui/hover/hoverDelegateFactory.js';
import { IManagedHover } from '../../../../base/browser/ui/hover/hover.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Disposable, DisposableStore } from '../../../../base/common/lifecycle.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize } from '../../../../nls.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { CODELAD_CONTEXTS, CodeladContext, codeladContextLabels as labels, ICodeladShellService } from '../../../services/codelad/common/codeladShellService.js';
import { WindowTitle } from './windowTitle.js';
import { GroupsOrder, IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';

/** Compact navigation for real workspace compositions, inside the native-aware title area. */
export class CodeladShellControl extends Disposable {
	readonly element = $('.codelad-shell-control');
	private readonly contexts = new Map<CodeladContext, HTMLButtonElement>();
	private readonly hovers = new Map<HTMLButtonElement, IManagedHover>();
	private readonly repositoryLabel: HTMLElement;
	private readonly repositoryButton: HTMLButtonElement;
	private readonly repositoryCount: HTMLElement;
	private readonly pinButton: HTMLButtonElement;

	constructor(
		windowTitle: WindowTitle,
		@ICodeladShellService private readonly shellService: ICodeladShellService,
		@ICommandService private readonly commandService: ICommandService,
		@IHoverService private readonly hoverService: IHoverService,
		@IKeybindingService keybindingService: IKeybindingService,
		@INotificationService private readonly notificationService: INotificationService,
		@IEditorGroupsService groupsService: IEditorGroupsService,
		@IEditorService editorService: IEditorService,
	) {
		super();
		const project = this.button(this.element, localize('codelad.openFile', "Open File"), Codicon.search, () => this.commandService.executeCommand<void>('workbench.action.quickOpen'));
		project.classList.add('codelad-project');
		const projectLabel = append(project, $('span.codelad-project-label'));
		const updateProject = () => projectLabel.textContent = windowTitle.workspaceName || localize('codelad.workspace', "Workspace");
		updateProject();
		this._register(windowTitle.onDidChange(updateProject));
		const strip = append(this.element, $('.codelad-context-strip'));
		strip.role = 'toolbar';
		strip.setAttribute('aria-label', localize('codelad.contextStrip', "Workspace Contexts"));
		for (const context of CODELAD_CONTEXTS) {
			const binding = keybindingService.lookupKeybinding(`workbench.action.codelad.context.${context}`)?.getLabel();
			const hint = binding ? localize('codelad.contextKeybinding', "{0} ({1})", labels[context], binding) : labels[context];
			const button = this.button(strip, hint, undefined, () => shellService.selectContext(context));
			button.classList.add('codelad-context');
			button.dataset.codeladContext = context;
			button.textContent = labels[context];
			this.contexts.set(context, button);
		}
		this._register(addDisposableListener(strip, EventType.KEY_DOWN, (event: KeyboardEvent) => {
			const index = CODELAD_CONTEXTS.findIndex(context => this.contexts.get(context) === event.target);
			if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			const target = event.key === 'Home' ? 0 : event.key === 'End' ? CODELAD_CONTEXTS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + CODELAD_CONTEXTS.length) % CODELAD_CONTEXTS.length;
			this.run(async () => {
				await shellService.selectContext(CODELAD_CONTEXTS[target]);
				this.contexts.get(CODELAD_CONTEXTS[target])?.focus();
			});
		}));
		let lastWheel = 0;
		this._register(addDisposableListener(strip, 'wheel', (event: WheelEvent) => {
			if (!event.altKey) {
				return;
			}
			event.preventDefault();
			if (Date.now() - lastWheel > 180 && (event.deltaX || event.deltaY)) {
				lastWheel = Date.now();
				this.run(() => shellService.cycleContext(Math.sign(event.deltaX || event.deltaY)));
			}
		}, { passive: false }));
		this._register(shellService.registerContextStrip(() => this.contexts.get(shellService.activeContext)?.focus()));
		const surfaces = append(this.element, $('.codelad-surface-strip'));
		surfaces.role = 'toolbar';
		surfaces.setAttribute('aria-label', localize('codelad.surfaces', "Work Surfaces"));
		const surfaceListeners = this._register(new DisposableStore());
		const surfaceButtons = new Map<number, HTMLButtonElement>();
		const updateSurfaces = () => {
			if (!groupsService.isReady || this._store.isDisposed) { return; }
			surfaceListeners.clear();
			surfaceButtons.clear();
			surfaces.replaceChildren();
			const active = groupsService.activeGroup;
			for (const group of groupsService.getGroups(GroupsOrder.GRID_APPEARANCE)) {
				if (group.windowId !== active.windowId) { continue; }
				const button = append(surfaces, $<HTMLButtonElement>('button.codelad-surface'));
				button.type = 'button';
				surfaceButtons.set(group.id, button);
				button.textContent = group.activeEditor?.getName() ?? group.label;
				if (group.activeEditor) { surfaceListeners.add(group.activeEditor.onDidChangeLabel(updateSurfaces)); }
				button.setAttribute('aria-label', localize('codelad.surface', "{0}, {1}", group.label, button.textContent));
				button.setAttribute('aria-pressed', String(group.id === active.id));
				button.tabIndex = group.id === active.id ? 0 : -1;
				surfaceListeners.add(addDisposableListener(button, EventType.CLICK, () => { groupsService.activateGroup(group); group.focus(); }));
				if (group.id === active.id) { queueMicrotask(() => button.scrollIntoView({ block: 'nearest', inline: 'nearest' })); }
			}
		};
		for (const event of [groupsService.onDidAddGroup, groupsService.onDidRemoveGroup, groupsService.onDidMoveGroup, groupsService.onDidChangeActiveGroup]) {
			this._register(event(updateSurfaces));
		}
		this._register(editorService.onDidActiveEditorChange(updateSurfaces));
		this._register(addDisposableListener(surfaces, EventType.KEY_DOWN, (event: KeyboardEvent) => {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') { return; }
			event.preventDefault(); event.stopPropagation();
			this.run(async () => {
				await this.commandService.executeCommand(event.key === 'ArrowLeft' ? 'workbench.action.codelad.previousSurface' : 'workbench.action.codelad.nextSurface');
				surfaceButtons.get(groupsService.activeGroup.id)?.focus();
			});
		}));
		updateSurfaces();
		void groupsService.whenReady.then(updateSurfaces);
		const chooser = this.button(this.element, localize('codelad.chooseContext', "Choose Workspace Context"), Codicon.chevronDown, () => shellService.showContexts());
		chooser.classList.add('codelad-context-chooser');
		const atlasBinding = keybindingService.lookupKeybinding('workbench.action.codelad.openAtlas')?.getLabel();
		const atlasHint = atlasBinding ? localize('codelad.atlasKeybinding', "Open Code Atlas ({0})", atlasBinding) : localize('codelad.atlas', "Open Code Atlas");
		const atlas = this.button(this.element, atlasHint, Codicon.typeHierarchy, () => this.commandService.executeCommand<void>('workbench.action.codelad.openAtlas'));
		atlas.classList.add('codelad-atlas');
		const actions = this.button(this.element, localize('codelad.projectActions', "Project Actions"), Codicon.play, () => shellService.showActions());
		actions.classList.add('codelad-project-actions');
		append(actions, $('span.codelad-action-label')).textContent = localize('codelad.run', "Run");
		this.pinButton = this.button(this.element, localize('codelad.pinTools', "Pin Tool Areas"), Codicon.pin, () => shellService.showPins());
		this.pinButton.classList.add('codelad-pin');
		this.repositoryButton = this.button(this.element, localize('codelad.sourceControl', "Open Source Control"), Codicon.sourceControl, () => shellService.openSourceControl());
		this.repositoryButton.classList.add('codelad-repository');
		this.repositoryLabel = append(this.repositoryButton, $('span.codelad-repository-label'));
		this.repositoryCount = append(this.repositoryButton, $('span.codelad-repository-count'));
		this._register(shellService.onDidChange(() => this.update()));
		this.update();
	}

	private run(action: () => Promise<void>): void {
		void action().catch(error => this.notificationService.error(error));
	}

	private button(parent: HTMLElement, label: string, icon: ThemeIcon | undefined, action: () => Promise<void>): HTMLButtonElement {
		const button = append(parent, $<HTMLButtonElement>('button.codelad-shell-button'));
		button.type = 'button';
		button.setAttribute('aria-label', label);
		if (icon) {
			const rendered = append(button, renderIcon(icon));
			rendered.setAttribute('aria-hidden', 'true');
		}
		const hover = this._register(this.hoverService.setupManagedHover(getDefaultHoverDelegate('mouse'), button, label));
		this.hovers.set(button, hover);
		this._register(addDisposableListener(button, EventType.CLICK, () => this.run(action)));
		return button;
	}

	private update(): void {
		const stripFocused = [...this.contexts.values()].some(button => button.ownerDocument.activeElement === button);
		for (const [context, button] of this.contexts) {
			const selected = context === this.shellService.activeContext;
			button.setAttribute('aria-pressed', String(selected));
			button.tabIndex = selected ? 0 : -1;
			button.disabled = !this.shellService.ready;
		}
		this.pinButton.setAttribute('aria-pressed', String(this.shellService.hasPinnedTools));
		const repository = this.shellService.repository;
		this.repositoryLabel.textContent = repository ? repository.branch ?? repository.name : localize('codelad.git', "Git");
		this.repositoryCount.textContent = repository && repository.changes > 0 ? String(repository.changes) : '';
		const repositoryHint = repository ? localize('codelad.repositoryState', "{0}, {1} pending changes. Open Source Control", repository.branch ?? repository.name, repository.changes) : localize('codelad.sourceControl', "Open Source Control");
		this.repositoryButton.setAttribute('aria-label', repositoryHint);
		this.hovers.get(this.repositoryButton)?.update(repositoryHint);
		if (stripFocused) {
			this.contexts.get(this.shellService.activeContext)?.focus();
		}
	}
}
