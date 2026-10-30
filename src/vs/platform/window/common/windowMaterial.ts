/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface IWindowMaterialState {
	readonly requested: 'solid' | 'native' | 'mica';
	readonly effective: 'none' | 'acrylic' | 'mica' | 'vibrancy';
	readonly reason: 'disabled' | 'supported' | 'unsupported' | 'accessibility' | 'native-error';
	readonly chromeOpacity: number;
}

/** Resolve a native backdrop without promising compositor support on an untested Linux host. */
export function resolveWindowMaterial(mode: string | undefined, platform: string, osRelease: string, reducedTransparency: boolean, highContrast: boolean, opacity: number | undefined): IWindowMaterialState {
	const requested = mode === 'native' || mode === 'mica' ? mode : 'solid';
	const chromeOpacity = Number.isFinite(opacity) ? Math.max(0.6, Math.min(1, opacity!)) : 0.85;
	if (requested === 'solid') {
		return { requested, effective: 'none', reason: 'disabled', chromeOpacity };
	}
	if (reducedTransparency || highContrast) {
		return { requested, effective: 'none', reason: 'accessibility', chromeOpacity };
	}
	const build = Number(osRelease.split('.')[2]);
	if (platform === 'win32' && Number.isFinite(build) && build >= 22621) {
		return { requested, effective: requested === 'mica' ? 'mica' : 'acrylic', reason: 'supported', chromeOpacity };
	}
	if (platform === 'darwin' && requested === 'native') {
		return { requested, effective: 'vibrancy', reason: 'supported', chromeOpacity };
	}
	return { requested, effective: 'none', reason: 'unsupported', chromeOpacity };
}
