/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface IScrollspaceSurface {
	readonly id: number;
	readonly windowId: number;
}

/** Navigate real surfaces in supplied visual order, within the active native window. */
export function adjacentScrollspaceSurface<T extends IScrollspaceSurface>(surfaces: readonly T[], activeId: number, windowId: number, direction: -1 | 1): T | undefined {
	const local = surfaces.filter(surface => surface.windowId === windowId);
	if (!local.length) {
		return undefined;
	}
	const index = local.findIndex(surface => surface.id === activeId);
	if (index < 0) {
		return direction === 1 ? local[0] : local[local.length - 1];
	}
	return local[(index + direction + local.length) % local.length];
}
