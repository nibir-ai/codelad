/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { getNotebookContentSecurityPolicy } from '../../browser/view/renderers/notebookContentSecurityPolicy.js';

suite('Notebook content privacy', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('remote resources stay blocked independently of the old experimental CSP switch', () => {
		for (const legacy of [false, true]) {
			const policy = getNotebookContentSecurityPolicy(false, legacy);
			assert.ok(policy.includes(`default-src 'none'`) && policy.includes('https://*.vscode-resource.vscode-cdn.net'));
			assert.ok(!policy.includes('https://*.vscode-cdn.net'));
			assert.doesNotMatch(policy, /(?:^|\s)(?:https?:|wss?:)(?:\s|;)/);
			assert.ok(policy.includes(`form-action 'none'`) && policy.includes('worker-src') && policy.includes('blob:') && policy.includes('data:'));
		}
	});

	test('explicit opt-in preserves the original renderer and experimental security choices', () => {
		assert.strictEqual(getNotebookContentSecurityPolicy(true, false), '');
		const restricted = getNotebookContentSecurityPolicy(true, true);
		assert.ok(restricted.includes('connect-src https:') && restricted.includes(`default-src 'none'`));
		assert.ok(!restricted.includes('script-src https:'));
	});
});
