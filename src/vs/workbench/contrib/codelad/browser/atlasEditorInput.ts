/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { Emitter } from '../../../../base/common/event.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { URI } from '../../../../base/common/uri.js';
import { IPosition } from '../../../../editor/common/core/position.js';
import { localize } from '../../../../nls.js';
import { EditorInputCapabilities, IUntypedEditorInput } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';

export interface IAtlasSeed { readonly uri: URI; readonly position: IPosition }

/** One actual graph editor per workbench; only its source anchor is serialized. */
export class AtlasEditorInput extends EditorInput {
	static readonly ID = 'workbench.input.codeladAtlas';
	private static current: AtlasEditorInput | undefined;
	static get instance(): AtlasEditorInput {
		if (!this.current || this.current.isDisposed()) {
			this.current = new AtlasEditorInput();
		}
		return this.current;
	}
	private readonly seedEmitter = this._register(new Emitter<void>());
	readonly onDidChangeSeed = this.seedEmitter.event;
	seed: IAtlasSeed | undefined;
	loadRequested = false;
	readonly resource = URI.from({ scheme: 'codelad-atlas', path: '/calls' });
	override get typeId(): string { return AtlasEditorInput.ID; }
	override get capabilities(): EditorInputCapabilities { return EditorInputCapabilities.Readonly | EditorInputCapabilities.Singleton; }
	override getName(): string { return localize('atlas.name', "Atlas"); }
	override getIcon(): ThemeIcon { return Codicon.typeHierarchy; }
	setSeed(seed: IAtlasSeed, load = true): void {
		this.seed = seed;
		this.loadRequested = load;
		this.seedEmitter.fire();
	}
	override matches(other: EditorInput | IUntypedEditorInput): boolean { return other instanceof AtlasEditorInput; }
}
