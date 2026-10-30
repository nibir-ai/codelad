/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { IDisposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const CODELAD_SHELL_ENABLED = 'workbench.codeladShell.enabled';
export const CODELAD_CONTEXTS = ['focus', 'explore', 'review', 'operate'] as const;
export type CodeladContext = typeof CODELAD_CONTEXTS[number];
export const codeladContextLabels: Record<CodeladContext, string> = {
	focus: localize('codelad.focus', "Focus"), explore: localize('codelad.explore', "Explore"),
	review: localize('codelad.review', "Review"), operate: localize('codelad.operate', "Operate")
};

export interface ICodeladRepositoryState {
	readonly name: string;
	readonly branch: string | undefined;
	readonly changes: number;
}

export const ICodeladShellService = createDecorator<ICodeladShellService>('codeladShellService');

export interface ICodeladShellService {
	readonly _serviceBrand: undefined;
	readonly onDidChange: Event<void>;
	readonly enabled: boolean;
	readonly ready: boolean;
	readonly activeContext: CodeladContext;
	readonly hasPinnedTools: boolean;
	readonly repository: ICodeladRepositoryState | undefined;
	selectContext(context: CodeladContext): Promise<void>;
	cycleContext(delta: number): Promise<void>;
	showContexts(): Promise<void>;
	showActions(): Promise<void>;
	showPins(): Promise<void>;
	openSourceControl(): Promise<void>;
	resetContext(): Promise<void>;
	registerContextStrip(focus: () => void): IDisposable;
	focusContextStrip(): void;
}
