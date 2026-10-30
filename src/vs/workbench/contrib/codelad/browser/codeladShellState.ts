/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CODELAD_CONTEXTS, CodeladContext } from '../../../services/codelad/common/codeladShellService.js';

export interface ICodeladLayout {
	sidebar: boolean;
	panel: boolean;
	auxiliary: boolean;
	sidebarId?: string;
	panelId?: string;
	sidebarWidth?: number;
	panelHeight?: number;
}

export interface ICodeladShellState {
	version: 1;
	active: CodeladContext;
	pinSidebar: boolean;
	pinPanel: boolean;
	layouts: Partial<Record<CodeladContext, ICodeladLayout>>;
}

/** Default compositions use real views and share the existing editor groups. */
export function defaultCodeladLayout(context: CodeladContext): ICodeladLayout {
	return {
		sidebar: context === 'explore' || context === 'review',
		panel: context === 'operate',
		auxiliary: false,
		sidebarId: context === 'review' ? 'workbench.view.scm' : 'workbench.view.explorer',
		panelId: 'terminal'
	};
}

/** Read only the known local state fields; malformed storage cannot supply commands. */
export function parseCodeladShellState(raw: string | undefined): ICodeladShellState {
	const fallback: ICodeladShellState = { version: 1, active: 'explore', pinSidebar: false, pinPanel: false, layouts: {} };
	if (!raw || raw.length > 50000) {
		return fallback;
	}
	try {
		const value: Partial<ICodeladShellState> = JSON.parse(raw);
		if (!value || value.version !== 1 || !CODELAD_CONTEXTS.includes(value.active!)) {
			return fallback;
		}
		fallback.active = value.active!;
		fallback.pinSidebar = value.pinSidebar === true;
		fallback.pinPanel = value.pinPanel === true;
		for (const context of CODELAD_CONTEXTS) {
			const layout = value.layouts?.[context];
			if (!layout || typeof layout.sidebar !== 'boolean' || typeof layout.panel !== 'boolean' || typeof layout.auxiliary !== 'boolean') {
				continue;
			}
			const result: ICodeladLayout = { sidebar: layout.sidebar, panel: layout.panel, auxiliary: layout.auxiliary };
			for (const key of ['sidebarId', 'panelId'] as const) {
				if (typeof layout[key] === 'string' && layout[key].length < 256) {
					result[key] = layout[key];
				}
			}
			for (const key of ['sidebarWidth', 'panelHeight'] as const) {
				if (typeof layout[key] === 'number' && Number.isFinite(layout[key]) && layout[key] >= 100 && layout[key] <= 10000) {
					result[key] = layout[key];
				}
			}
			fallback.layouts[context] = result;
		}
		return fallback;
	} catch {
		return fallback;
	}
}

/** A temporary visibility pin must not rewrite a context's intended composition. */
export function captureCodeladLayout(actual: ICodeladLayout, baseline: ICodeladLayout, pinSidebar: boolean, pinPanel: boolean): ICodeladLayout {
	return {
		...actual,
		...(pinSidebar ? { sidebar: baseline.sidebar, sidebarId: baseline.sidebarId, sidebarWidth: baseline.sidebarWidth } : {}),
		...(pinPanel ? { panel: baseline.panel, panelId: baseline.panelId, panelHeight: baseline.panelHeight } : {})
	};
}
