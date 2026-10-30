/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { resolveWindowMaterial } from '../../common/windowMaterial.js';
import { applyWindowMaterial, getWindowMaterialBackground } from '../../electron-main/windowMaterial.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';

suite('Codelad native material application', () => {
	ensureNoDisposablesAreLeakedInTestSuite();
	test('theme updates retain transparency only while the native material is active', () => {
		const calls: string[] = [];
		const window = { setVibrancy: () => { }, setBackgroundMaterial: (value: string) => { calls.push(value); }, setBackgroundColor: (value: string) => { calls.push(value); } };
		applyWindowMaterial(window, resolveWindowMaterial('native', 'win32', '10.0.26200', false, false, undefined), '#111a25');
		assert.strictEqual(getWindowMaterialBackground(window, '#ffffff'), '#00000000');
		applyWindowMaterial(window, resolveWindowMaterial('solid', 'win32', '10.0.26200', false, false, undefined), '#111a25');
		assert.deepStrictEqual({ calls, background: getWindowMaterialBackground(window, '#ffffff') }, { calls: ['acrylic', '#00000000', 'none', '#111a25'], background: '#ffffff' });
	});
	test('failed native APIs restore solid surfaces even when native cleanup also fails', () => {
		let background = '';
		const window = { setVibrancy: () => { }, setBackgroundMaterial: () => { throw new Error('Unsupported native API'); }, setBackgroundColor: (value: string) => { background = value; } };
		const state = applyWindowMaterial(window, resolveWindowMaterial('native', 'win32', '10.0.26200', false, false, undefined), '#111a25');
		assert.deepStrictEqual({ effective: state.effective, reason: state.reason, background }, { effective: 'none', reason: 'native-error', background: '#111a25' });
	});
});
