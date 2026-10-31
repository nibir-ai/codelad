/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { adjacentScrollspaceSurface } from '../../browser/scrollspaceNavigation.js';

suite('Codelad Scrollspace navigation', () => {
	ensureNoDisposablesAreLeakedInTestSuite();
	const surfaces = [{ id: 7, windowId: 1 }, { id: 80, windowId: 2 }, { id: 3, windowId: 1 }, { id: 19, windowId: 1 }];
	test('uses visual order rather than identifiers and wraps in either direction', () => {
		assert.deepStrictEqual([adjacentScrollspaceSurface(surfaces, 7, 1, 1)?.id, adjacentScrollspaceSurface(surfaces, 19, 1, 1)?.id, adjacentScrollspaceSurface(surfaces, 7, 1, -1)?.id], [3, 7, 19]);
	});
	test('never traverses into another native window', () => {
		assert.deepStrictEqual([adjacentScrollspaceSurface(surfaces, 80, 2, 1)?.id, adjacentScrollspaceSurface(surfaces, 3, 1, -1)?.id], [80, 7]);
	});
	test('handles removed active groups and empty windows', () => {
		assert.deepStrictEqual([adjacentScrollspaceSurface(surfaces, 999, 1, 1)?.id, adjacentScrollspaceSurface(surfaces, 999, 1, -1)?.id, adjacentScrollspaceSurface(surfaces, 7, 9, 1)], [7, 19, undefined]);
	});
});
