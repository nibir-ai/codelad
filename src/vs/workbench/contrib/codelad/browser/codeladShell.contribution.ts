/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IConfigurationService, ConfigurationTarget } from '../../../../platform/configuration/common/configuration.js';
import { ConfigurationScope, Extensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { CODELAD_CONTEXTS, CODELAD_SHELL_ENABLED, codeladContextLabels, ICodeladShellService } from '../../../services/codelad/common/codeladShellService.js';
import { CodeladShellService } from './codeladShellService.js';

Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	id: 'workbench',
	type: 'object',
	properties: {
		[CODELAD_SHELL_ENABLED]: {
			type: 'boolean', default: true, scope: ConfigurationScope.APPLICATION,
			description: localize('codelad.shellSetting', "Use Codelad's Quiet Shell context strip, project actions and repository HUD. Workspace-local compositions share your real editors. Turn this off to restore the conventional title area and pre-shell tool layout.")
		}
	}
});

registerSingleton(ICodeladShellService, CodeladShellService, InstantiationType.Delayed);

class CodeladShellContribution {
	static readonly ID = 'workbench.contrib.codeladShell';
	constructor(@ICodeladShellService service: ICodeladShellService) {
		// Initialize lifecycle/state handling even with an OS-native titlebar.
		void service.enabled;
	}
}
registerWorkbenchContribution2(CodeladShellContribution.ID, CodeladShellContribution, WorkbenchPhase.BlockRestore);

const category = localize2('codelad.category', "Codelad");
const enabled = ContextKeyExpr.equals(`config.${CODELAD_SHELL_ENABLED}`, true);

for (const [index, context] of CODELAD_CONTEXTS.entries()) {
	registerAction2(class extends Action2 {
		constructor() {
			super({
				id: `workbench.action.codelad.context.${context}`,
				title: { value: codeladContextLabels[context], original: context },
				category, f1: true, precondition: enabled,
				keybinding: { weight: KeybindingWeight.WorkbenchContrib, primary: KeyMod.CtrlCmd | KeyMod.Alt | (KeyCode.Digit1 + index) }
			});
		}
		run(accessor: ServicesAccessor): Promise<void> {
			return accessor.get(ICodeladShellService).selectContext(context);
		}
	});
}

for (const [id, title, delta, key] of [
	['nextContext', localize2('codelad.next', "Next Context"), 1, KeyCode.PageDown],
	['previousContext', localize2('codelad.previous', "Previous Context"), -1, KeyCode.PageUp]
] as const) {
	registerAction2(class extends Action2 {
		constructor() {
			super({ id: `workbench.action.codelad.${id}`, title, category, f1: true, precondition: enabled,
				keybinding: { weight: KeybindingWeight.WorkbenchContrib, primary: KeyMod.CtrlCmd | KeyMod.Alt | key } });
		}
		run(accessor: ServicesAccessor): Promise<void> {
			return accessor.get(ICodeladShellService).cycleContext(delta);
		}
	});
}

for (const [id, title, method] of [
	['chooseContext', localize2('codelad.chooseContext', "Choose Workspace Context"), 'showContexts'],
	['projectActions', localize2('codelad.projectActions', "Project Actions"), 'showActions'],
	['pinTools', localize2('codelad.pinTools', "Pin Tool Areas"), 'showPins'],
	['resetContext', localize2('codelad.resetContext', "Reset Current Context"), 'resetContext']
] as const) {
	registerAction2(class extends Action2 {
		constructor() {
			super({ id: `workbench.action.codelad.${id}`, title, category, f1: true, precondition: enabled,
				...(id === 'projectActions' ? { keybinding: { weight: KeybindingWeight.WorkbenchContrib, primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyP } } : {}) });
		}
		run(accessor: ServicesAccessor): Promise<void> {
			return accessor.get(ICodeladShellService)[method]();
		}
	});
}

registerAction2(class extends Action2 {
	constructor() {
		super({ id: 'workbench.action.codelad.focusContextStrip', title: localize2('codelad.focusStrip', "Focus Context Strip"), category, f1: true, precondition: enabled });
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(ICodeladShellService).focusContextStrip();
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({ id: 'workbench.action.codelad.toggleShell', title: localize2('codelad.toggleShell', "Toggle Quiet Shell"), category, f1: true });
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const config = accessor.get(IConfigurationService);
		await config.updateValue(CODELAD_SHELL_ENABLED, !config.getValue<boolean>(CODELAD_SHELL_ENABLED), ConfigurationTarget.USER);
	}
});
