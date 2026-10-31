/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { URI } from '../../../../base/common/uri.js';
import { getCodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IInstantiationService, ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions, IEditorFactoryRegistry, IEditorSerializer } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IEditorService, SIDE_GROUP } from '../../../services/editor/common/editorService.js';
import { AtlasEditor } from './atlasEditor.js';
import { AtlasEditorInput } from './atlasEditorInput.js';

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(AtlasEditor, AtlasEditor.ID, localize('atlas.editor', "Atlas")),
	[new SyncDescriptor(AtlasEditorInput)]
);

class AtlasEditorSerializer implements IEditorSerializer {
	canSerialize(input: EditorInput): boolean { return input instanceof AtlasEditorInput && !!input.seed; }
	serialize(input: EditorInput): string | undefined {
		return input instanceof AtlasEditorInput && input.seed ? JSON.stringify({ uri: input.seed.uri.toString(), position: input.seed.position }) : undefined;
	}
	deserialize(_instantiationService: IInstantiationService, raw: string): EditorInput | undefined {
		try {
			const data: { uri?: string; position?: { lineNumber?: number; column?: number } } = JSON.parse(raw);
			const position = data?.position;
			if (typeof data?.uri !== 'string' || data.uri.length > 10000 || !Number.isSafeInteger(position?.lineNumber) || !Number.isSafeInteger(position?.column) || position!.lineNumber! < 1 || position!.column! < 1) {
				return undefined;
			}
			const input = AtlasEditorInput.instance;
			input.setSeed({ uri: URI.parse(data.uri), position: { lineNumber: position!.lineNumber!, column: position!.column! } }, false);
			return input;
		} catch {
			return undefined;
		}
	}
}
Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(AtlasEditorInput.ID, AtlasEditorSerializer);

registerAction2(class extends Action2 {
	constructor() {
		super({ id: 'workbench.action.codelad.openAtlas', title: localize2('atlas.open', "Open Code Atlas"), category: localize2('codelad.category', "Codelad"), f1: true,
			keybinding: { weight: KeybindingWeight.WorkbenchContrib, primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyG } });
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const notificationService = accessor.get(INotificationService);
		const code = getCodeEditor(editorService.activeTextEditorControl);
		const sourceGroup = editorService.activeEditorPane?.group;
		const model = code?.getModel();
		const position = code?.getPosition();
		const input = AtlasEditorInput.instance;
		if (model && position) {
			input.setSeed({ uri: model.uri, position });
		} else if (!input.seed) {
			notificationService.info(localize('atlas.openSource', "Open a source file and place the caret on a function or method, then open Atlas."));
			return;
		}
		const atlas = await editorService.openEditor(input, { pinned: true, revealIfOpened: true });
		if (model && position) {
			const target = sourceGroup && sourceGroup.id !== atlas?.group.id ? sourceGroup.id : SIDE_GROUP;
			const source = await editorService.openEditor({ resource: model.uri, options: { selection: { startLineNumber: position.lineNumber, startColumn: position.column }, pinned: true, preserveFocus: true } }, target);
			if (atlas instanceof AtlasEditor && source?.group) { atlas.setSourceGroup(source.group.id); }
		}
	}
});
