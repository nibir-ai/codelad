/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RunOnceScheduler, Sequencer, timeout } from '../../../../base/common/async.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable, IDisposable, MutableDisposable, toDisposable } from '../../../../base/common/lifecycle.js';
import { autorun } from '../../../../base/common/observable.js';
import { localize } from '../../../../nls.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IQuickInputService, IQuickPickItem } from '../../../../platform/quickinput/common/quickInput.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { ViewContainerLocation } from '../../../common/views.js';
import { CODELAD_CONTEXTS, CODELAD_SHELL_ENABLED, CodeladContext, codeladContextLabels, ICodeladRepositoryState, ICodeladShellService } from '../../../services/codelad/common/codeladShellService.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { ISCMRepository, ISCMViewService } from '../../scm/common/scm.js';
import { ContributedTask, CustomTask, Task } from '../../tasks/common/tasks.js';
import { ITaskService } from '../../tasks/common/taskService.js';
import { captureCodeladLayout, defaultCodeladLayout, ICodeladLayout, parseCodeladShellState } from './codeladShellState.js';

const STORAGE_KEY = 'codelad.quietShell.contexts.v1';

interface IActionPick extends IQuickPickItem {
	task?: Task;
	command?: string;
}

/** Workspace-local compositions over existing workbench parts; never replaces editors. */
export class CodeladShellService extends Disposable implements ICodeladShellService {
	declare readonly _serviceBrand: undefined;
	private readonly _onDidChange = this._register(new Emitter<void>());
	readonly onDidChange = this._onDidChange.event;
	private readonly queue = new Sequencer();
	private readonly state;
	private initialLayout: ICodeladLayout | undefined;
	private applying = false;
	private _ready = false;
	private _repository: ICodeladRepositoryState | undefined;
	private repositorySource: ISCMRepository | undefined;
	private focusStrip: (() => void) | undefined;
	private readonly resourceListener = this._register(new MutableDisposable());
	private readonly saveScheduler = this._register(new RunOnceScheduler(() => this.saveCurrentLayout(), 150));

	get enabled(): boolean { return this.configurationService.getValue<boolean>(CODELAD_SHELL_ENABLED) === true; }
	get ready(): boolean { return this._ready; }
	get activeContext(): CodeladContext { return this.state.active; }
	get hasPinnedTools(): boolean { return this.state.pinPanel || this.state.pinSidebar; }
	get repository(): ICodeladRepositoryState | undefined { return this._repository; }

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IStorageService private readonly storageService: IStorageService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IViewsService private readonly viewsService: IViewsService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@ISCMViewService scmViewService: ISCMViewService,
		@IQuickInputService private readonly quickInputService: IQuickInputService,
		@ITaskService private readonly taskService: ITaskService,
		@ICommandService private readonly commandService: ICommandService,
		@INotificationService private readonly notificationService: INotificationService,
	) {
		super();
		this.state = parseCodeladShellState(storageService.get(STORAGE_KEY, StorageScope.WORKSPACE));
		this.updateContainers();
		this._register(layoutService.onDidAddContainer(({ container }) => container.classList.toggle('codelad-quiet-shell', this.enabled)));
		this._register(configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(CODELAD_SHELL_ENABLED)) {
				this.updateContainers();
				void this.queue.queue(async () => {
					if (!this.ready) {
						return;
					}
					if (this.enabled) {
						this.initialLayout = this.capture();
						await this.apply(this.state.layouts[this.activeContext] ?? defaultCodeladLayout(this.activeContext), true);
					} else if (this.initialLayout) {
						this.saveCurrentLayout(true);
						await this.apply(this.initialLayout, false);
					}
				}).catch(error => this.notificationService.error(error));
				this._onDidChange.fire();
			}
		}));
		this._register(layoutService.onDidChangePartVisibility(() => this.scheduleSave()));
		this._register(layoutService.onDidLayoutContainer(() => this.scheduleSave()));
		this._register(viewsService.onDidChangeViewContainerVisibility(() => this.scheduleSave()));
		this._register(storageService.onWillSaveState(() => this.saveCurrentLayout()));
		const observeRepository = () => this._register(autorun(reader => {
			const repository = scmViewService.activeRepository.read(reader)?.repository;
			if (repository !== this.repositorySource) {
				this.repositorySource = repository;
				this.resourceListener.value = repository?.provider.onDidChangeResources(() => this.updateRepositoryResources());
			}
			if (repository) {
				const provider = repository.provider;
				this._repository = {
					name: provider.name,
					branch: provider.historyProvider.read(reader)?.historyItemRef.read(reader)?.name,
					changes: provider.count.read(reader) ?? provider.groups.reduce((count, group) => count + group.resources.length, 0)
				};
			} else {
				this._repository = undefined;
			}
			this._onDidChange.fire();
		}));
		void lifecycleService.when(LifecyclePhase.Restored).then(async () => {
			if (this._store.isDisposed) {
				return;
			}
			this.initialLayout = this.capture();
			this._ready = true;
			observeRepository();
			if (this.enabled && this.state.layouts[this.activeContext]) {
				await this.apply(this.state.layouts[this.activeContext]!, true);
			}
			this._onDidChange.fire();
		}).catch(error => this.notificationService.error(error));
	}

	private updateContainers(): void {
		for (const container of this.layoutService.containers) {
			container.classList.toggle('codelad-quiet-shell', this.enabled);
		}
	}

	private updateRepositoryResources(): void {
		if (this.repositorySource && this._repository) {
			this._repository = { ...this._repository, changes: this.repositorySource.provider.count.get() ?? this.repositorySource.provider.groups.reduce((count, group) => count + group.resources.length, 0) };
			this._onDidChange.fire();
		}
	}

	private capture(): ICodeladLayout {
		const sidebar = this.layoutService.isVisible(Parts.SIDEBAR_PART);
		const panel = this.layoutService.isVisible(Parts.PANEL_PART);
		return {
			sidebar, panel, auxiliary: this.layoutService.isVisible(Parts.AUXILIARYBAR_PART),
			sidebarId: this.viewsService.getVisibleViewContainer(ViewContainerLocation.Sidebar)?.id,
			panelId: this.viewsService.getVisibleViewContainer(ViewContainerLocation.Panel)?.id,
			sidebarWidth: sidebar ? this.layoutService.getSize(Parts.SIDEBAR_PART).width : undefined,
			panelHeight: panel ? this.layoutService.getSize(Parts.PANEL_PART).height : undefined
		};
	}

	private scheduleSave(): void {
		if (this.ready && this.enabled && !this.applying) {
			this.saveScheduler.schedule();
		}
	}

	private saveCurrentLayout(allowDisabled = false): void {
		if (!this.ready || (!this.enabled && !allowDisabled) || this.applying) {
			return;
		}
		const baseline = this.state.layouts[this.activeContext] ?? defaultCodeladLayout(this.activeContext);
		this.state.layouts[this.activeContext] = captureCodeladLayout(this.capture(), baseline, this.state.pinSidebar, this.state.pinPanel);
		this.persist();
	}

	private persist(): void {
		this.storageService.store(STORAGE_KEY, JSON.stringify(this.state), StorageScope.WORKSPACE, StorageTarget.MACHINE);
	}

	private async apply(layout: ICodeladLayout, honorPins: boolean): Promise<void> {
		// A picker can restore tool focus asynchronously. Let it settle before
		// suppressing layout events and applying the requested composition.
		await timeout(0);
		this.applying = true;
		this.saveScheduler.cancel();
		try {
			const sidebar = layout.sidebar || (honorPins && this.state.pinSidebar);
			const panel = layout.panel || (honorPins && this.state.pinPanel);
			// Opening through the views service awaits the composite and prevents the
			// layout service's fire-and-forget open from later restoring tool focus.
			if (!sidebar) {
				this.layoutService.setPartHidden(true, Parts.SIDEBAR_PART);
			}
			if (!panel) {
				this.layoutService.setPartHidden(true, Parts.PANEL_PART);
			}
			this.layoutService.setPartHidden(!layout.auxiliary, Parts.AUXILIARYBAR_PART);
			if (sidebar) {
				await this.viewsService.openViewContainer(layout.sidebarId ?? 'workbench.view.explorer', false);
			}
			if (panel) {
				await this.viewsService.openViewContainer(layout.panelId ?? 'terminal', false);
			}
			if (sidebar && layout.sidebarWidth) {
				this.layoutService.setSize(Parts.SIDEBAR_PART, { ...this.layoutService.getSize(Parts.SIDEBAR_PART), width: layout.sidebarWidth });
			}
			if (panel && layout.panelHeight) {
				this.layoutService.setSize(Parts.PANEL_PART, { ...this.layoutService.getSize(Parts.PANEL_PART), height: layout.panelHeight });
			}
		} finally {
			this.applying = false;
		}
	}

	async selectContext(context: CodeladContext): Promise<void> {
		await this.lifecycleService.when(LifecyclePhase.Restored);
		return this.queue.queue(() => this.switchContext(context));
	}

	private async switchContext(context: CodeladContext): Promise<void> {
		if (!this.enabled || context === this.activeContext) {
			return;
		}
		this.saveCurrentLayout();
		await this.apply(this.state.layouts[context] ?? defaultCodeladLayout(context), true);
		this.state.active = context;
		this.persist();
		this._onDidChange.fire();
	}

	async cycleContext(delta: number): Promise<void> {
		await this.lifecycleService.when(LifecyclePhase.Restored);
		await this.queue.queue(() => {
			const index = CODELAD_CONTEXTS.indexOf(this.activeContext);
			return this.switchContext(CODELAD_CONTEXTS[(index + delta + CODELAD_CONTEXTS.length) % CODELAD_CONTEXTS.length]);
		});
	}

	async showContexts(): Promise<void> {
		const pick = await this.quickInputService.pick(CODELAD_CONTEXTS.map(context => ({ label: codeladContextLabels[context], context, picked: context === this.activeContext })), {
			title: localize('codelad.contexts', "Workspace Contexts"),
			placeHolder: localize('codelad.contextsHint', "Change tools around the current editors")
		});
		if (pick) {
			await this.selectContext(pick.context);
		}
	}

	async showActions(): Promise<void> {
		// Discovery is user-directed. Nothing is polled or executed during startup.
		const tasks = await this.taskService.tasks();
		const items: IActionPick[] = tasks.filter(task => !task.configurationProperties.hide).slice(0, 5).map(task => ({
			label: task._label,
			description: task.getWorkspaceFolder()?.name ?? task._source.label,
			detail: this.taskDetail(task),
			task
		}));
		items.push(
			{ label: localize('codelad.atlas', "Open Code Atlas"), command: 'workbench.action.codelad.openAtlas' },
			{ label: localize('codelad.allTasks', "All Tasks…"), command: 'workbench.action.tasks.runTask' },
			{ label: localize('codelad.configureTasks', "Configure Tasks…"), command: 'workbench.action.tasks.configureTaskRunner' },
			{ label: localize('codelad.toggleTerminal', "Toggle Terminal"), command: 'workbench.action.terminal.toggleTerminal' },
			{ label: localize('codelad.commandPalette', "Command Palette…"), command: 'workbench.action.showCommands' }
		);
		const pick = await this.quickInputService.pick(items, { title: localize('codelad.actions', "Project Actions"), matchOnDescription: true, matchOnDetail: true });
		if (pick?.task) {
			await this.selectContext('operate');
			await this.taskService.run(pick.task);
		} else if (pick?.command) {
			await this.commandService.executeCommand(pick.command);
		}
	}

	private taskDetail(task: Task): string {
		if ((CustomTask.is(task) || ContributedTask.is(task)) && task.command?.name) {
			const words = [task.command.name, ...(task.command.args ?? [])].map(word => typeof word === 'string' ? word : word.value);
			const cwd = task.command.options?.cwd ?? task.getWorkspaceFolder()?.uri.fsPath;
			return cwd ? localize('codelad.taskPreviewCwd', "Declared command: {0} · Directory: {1}", words.join(' '), cwd) : localize('codelad.taskPreview', "Declared command: {0}", words.join(' '));
		}
		return task.configurationProperties.detail ?? localize('codelad.taskSource', "Configured {0} task. Use Configure Tasks to inspect its definition.", task.getDefinition()?.type ?? task._source.label);
	}

	async showPins(): Promise<void> {
		await this.lifecycleService.when(LifecyclePhase.Restored);
		// Preserve the composition before the picker restores focus to a tool area.
		this.saveCurrentLayout();
		const picks = await this.quickInputService.pick([
			{ label: localize('codelad.pinSidebar', "Keep Sidebar Visible"), part: 'sidebar', picked: this.state.pinSidebar },
			{ label: localize('codelad.pinPanel', "Keep Panel Visible"), part: 'panel', picked: this.state.pinPanel }
		], { title: localize('codelad.pinTools', "Pin Tool Areas"), canPickMany: true });
		if (!picks) {
			return;
		}
		this.state.pinSidebar = picks.some(item => item.part === 'sidebar');
		this.state.pinPanel = picks.some(item => item.part === 'panel');
		await this.queue.queue(() => this.apply(this.state.layouts[this.activeContext] ?? defaultCodeladLayout(this.activeContext), true));
		this.persist();
		this._onDidChange.fire();
	}

	async openSourceControl(): Promise<void> {
		await this.selectContext('review');
		await this.viewsService.openViewContainer('workbench.view.scm', true);
	}

	async resetContext(): Promise<void> {
		await this.lifecycleService.when(LifecyclePhase.Restored);
		await this.queue.queue(async () => {
			delete this.state.layouts[this.activeContext];
			await this.apply(defaultCodeladLayout(this.activeContext), true);
			this.persist();
			this._onDidChange.fire();
		});
	}

	registerContextStrip(focus: () => void): IDisposable {
		this.focusStrip = focus;
		return toDisposable(() => {
			if (this.focusStrip === focus) {
				this.focusStrip = undefined;
			}
		});
	}

	focusContextStrip(): void {
		if (this.focusStrip) {
			this.focusStrip();
		} else {
			void this.showContexts().catch(error => this.notificationService.error(error));
		}
	}

	override dispose(): void {
		for (const container of this.layoutService.containers) {
			container.classList.remove('codelad-quiet-shell');
		}
		super.dispose();
	}
}
