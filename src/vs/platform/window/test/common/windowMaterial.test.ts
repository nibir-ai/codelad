/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { resolveWindowMaterial } from '../../common/windowMaterial.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';

suite('Codelad window material policy', () => {
	ensureNoDisposablesAreLeakedInTestSuite();
	test('solid is the default and unsupported hosts stay opaque', () => {
		assert.deepStrictEqual([
			resolveWindowMaterial(undefined, 'win32', '10.0.26200', false, false, undefined),
			resolveWindowMaterial('native', 'win32', '10.0.22000', false, false, undefined),
			resolveWindowMaterial('native', 'linux', '6.8.0', false, false, undefined),
			resolveWindowMaterial('native', 'win32', 'invalid', false, false, undefined)
		].map(state => [state.effective, state.reason]), [['none', 'disabled'], ['none', 'unsupported'], ['none', 'unsupported'], ['none', 'unsupported']]);
	});
	test('selects platform materials without confusing Mica with live desktop blur', () => {
		assert.deepStrictEqual([
			resolveWindowMaterial('native', 'win32', '10.0.22621', false, false, undefined),
			resolveWindowMaterial('mica', 'win32', '10.0.26200', false, false, undefined),
			resolveWindowMaterial('native', 'darwin', '25.0.0', false, false, undefined),
			resolveWindowMaterial('mica', 'darwin', '25.0.0', false, false, undefined)
		].map(state => state.effective), ['acrylic', 'mica', 'vibrancy', 'none']);
	});
	test('accessibility preferences take precedence and opacity is bounded', () => {
		assert.deepStrictEqual([
			resolveWindowMaterial('native', 'win32', '10.0.26200', true, false, 0),
			resolveWindowMaterial('native', 'win32', '10.0.26200', false, true, 2),
			resolveWindowMaterial('native', 'win32', '10.0.26200', false, false, NaN)
		].map(state => [state.effective, state.reason, state.chromeOpacity]), [['none', 'accessibility', 0.6], ['none', 'accessibility', 1], ['acrylic', 'supported', 0.85]]);
	});
});
