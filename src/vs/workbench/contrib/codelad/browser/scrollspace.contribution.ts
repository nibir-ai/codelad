/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { GroupsOrder, IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { adjacentScrollspaceSurface } from './scrollspaceNavigation.js';

for (const [id, title, direction, key] of [
	['previousSurface', localize2('scrollspace.previous', "Previous Work Surface"), -1, KeyCode.BracketLeft],
	['nextSurface', localize2('scrollspace.next', "Next Work Surface"), 1, KeyCode.BracketRight]
] as const) {
	registerAction2(class extends Action2 {
		constructor() {
			super({ id: `workbench.action.codelad.${id}`, title, category: localize2('codelad.category', "Codelad"), f1: true,
				keybinding: { weight: KeybindingWeight.WorkbenchContrib, primary: KeyMod.CtrlCmd | KeyMod.Alt | key } });
		}
		run(accessor: ServicesAccessor): void {
			const groups = accessor.get(IEditorGroupsService);
			const active = groups.activeGroup;
			const target = adjacentScrollspaceSurface(groups.getGroups(GroupsOrder.GRID_APPEARANCE), active.id, active.windowId, direction);
			if (target && target.id !== active.id) {
				groups.activateGroup(target);
				target.focus();
			}
		}
	});
}
