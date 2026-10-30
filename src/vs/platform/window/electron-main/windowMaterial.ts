/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { BrowserWindow } from 'electron';
import { IWindowMaterialState } from '../common/windowMaterial.js';

type WindowMaterialTarget = Pick<BrowserWindow, 'setBackgroundColor' | 'setBackgroundMaterial' | 'setVibrancy'>;
const materials = new WeakMap<WindowMaterialTarget, IWindowMaterialState>();

/** Keep later theme/splash updates from covering an active native backdrop. */
export function getWindowMaterialBackground(window: WindowMaterialTarget, solidColor: string): string {
	const state = materials.get(window);
	return state && state.effective !== 'none' ? '#00000000' : solidColor;
}

/** Apply only native APIs; an application failure restores an opaque background. */
export function applyWindowMaterial(window: WindowMaterialTarget, state: IWindowMaterialState, solidColor: string): IWindowMaterialState {
	const previous = materials.get(window);
	if (state.effective === 'none' && (!previous || previous.effective === 'none')) {
		materials.set(window, state);
		return state;
	}
	try {
		if (state.effective === previous?.effective) {
			// An opacity-only change does not need a native material reset.
		} else if (state.effective === 'acrylic' || state.effective === 'mica') {
			window.setBackgroundMaterial(state.effective);
		} else if (state.effective === 'vibrancy') {
			window.setVibrancy('under-window');
		} else if (previous?.effective === 'acrylic' || previous?.effective === 'mica') {
			window.setBackgroundMaterial('none');
		} else if (previous?.effective === 'vibrancy') {
			window.setVibrancy(null);
		}
		materials.set(window, state);
		window.setBackgroundColor(getWindowMaterialBackground(window, solidColor));
		return state;
	} catch {
		const fallback: IWindowMaterialState = { ...state, effective: 'none', reason: 'native-error' };
		materials.set(window, fallback);
		try {
			if (state.effective === 'vibrancy') {
				window.setVibrancy(null);
			} else if (state.effective !== 'none') {
				window.setBackgroundMaterial('none');
			}
		} catch {
			// The platform may reject removing an unavailable material too.
		}
		window.setBackgroundColor(solidColor);
		return fallback;
	}
}
