/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { captureCodeladLayout, defaultCodeladLayout, parseCodeladShellState } from '../../browser/codeladShellState.js';

suite('Codelad workspace context state', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('invalid or future storage falls back without accepting command-shaped state', () => {
		const fallback = parseCodeladShellState(undefined);
		assert.deepStrictEqual(['{', 'null', '{"version":2,"active":"focus"}', '{"version":1,"active":"run-shell"}'].map(raw => parseCodeladShellState(raw)), Array(4).fill(fallback));
	});

	test('restores only valid bounded view/layout fields', () => {
		const state = parseCodeladShellState(JSON.stringify({ version: 1, active: 'review', pinPanel: true, layouts: {
			review: { sidebar: true, panel: false, auxiliary: false, sidebarId: 'workbench.view.scm', sidebarWidth: -5, panelHeight: 'large', command: 'never-run' },
			focus: { sidebar: 'true', panel: false, auxiliary: false }
		} }));
		assert.deepStrictEqual(state, { version: 1, active: 'review', pinPanel: true, pinSidebar: false, layouts: { review: { sidebar: true, panel: false, auxiliary: false, sidebarId: 'workbench.view.scm' } } });
	});

	test('temporary pins do not turn Focus into a permanently open tool composition', () => {
		const baseline = defaultCodeladLayout('focus');
		const actual = { ...baseline, sidebar: true, panel: true, sidebarWidth: 420, panelHeight: 300 };
		assert.deepStrictEqual(captureCodeladLayout(actual, baseline, true, true), { ...baseline, sidebarWidth: undefined, panelHeight: undefined });
	});

	test('keeps distinct saved contexts and preserves user resize choices through serialization', () => {
		const state = parseCodeladShellState(undefined);
		state.layouts.explore = { ...defaultCodeladLayout('explore'), sidebarWidth: 340 };
		state.layouts.operate = { ...defaultCodeladLayout('operate'), panelHeight: 280 };
		state.active = 'operate';
		assert.deepStrictEqual(parseCodeladShellState(JSON.stringify(state)), state);
	});
});
