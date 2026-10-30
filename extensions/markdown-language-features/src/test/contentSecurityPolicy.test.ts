/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { getEditorContentSecurityPolicy, getPreviewContentSecurityPolicy, MarkdownPreviewSecurityLevel } from '../preview/contentSecurityPolicy';

suite('Markdown remote content policy', () => {
	const source = 'https://*.vscode-cdn.net';
	const localSource = 'https://*.vscode-resource.vscode-cdn.net';
	const levels = [MarkdownPreviewSecurityLevel.Strict, MarkdownPreviewSecurityLevel.AllowInsecureContent, MarkdownPreviewSecurityLevel.AllowScriptsAndAllContent, MarkdownPreviewSecurityLevel.AllowInsecureLocalContent];

	test('every preview security level blocks remote sources until opt-in', () => {
		for (const level of levels) {
			const policy = getPreviewContentSecurityPolicy(source, 'test-nonce', level, false);
			assert.ok(policy.includes(localSource) && !policy.includes(source) && policy.includes('data:') && policy.includes(`script-src 'nonce-test-nonce'`));
			assert.doesNotMatch(policy, /(?:^|\s)(?:https?:(?:\s|;)|http:\/\/localhost|http:\/\/127\.0\.0\.1)/);
		}
	});

	test('opt-in retains the existing transport and script security choices', () => {
		assert.deepStrictEqual(levels.map(level => {
			const policy = getPreviewContentSecurityPolicy(source, 'nonce', level, true);
			return {
				https: /\shttps:/.test(policy),
				http: /\shttp: /.test(policy),
				localhost: policy.includes('http://localhost:*'),
				unrestricted: policy === '',
			};
		}), [
			{ https: true, http: false, localhost: false, unrestricted: false },
			{ https: true, http: true, localhost: false, unrestricted: false },
			{ https: false, http: false, localhost: false, unrestricted: true },
			{ https: true, http: false, localhost: true, unrestricted: false },
		]);
	});

	test('the rich editor keeps local workers and enables only HTTPS media after opt-in', () => {
		const disabled = getEditorContentSecurityPolicy(source, 'nonce', false);
		const enabled = getEditorContentSecurityPolicy(source, 'nonce', true);
		assert.ok(disabled.includes(`worker-src ${localSource} blob:`) && disabled.includes(`connect-src ${localSource}`) && !disabled.includes(source));
		assert.doesNotMatch(disabled, /\shttps?:(?:\s|;)/);
		assert.ok(enabled.includes(`img-src ${localSource} data: https:`) && enabled.includes(`media-src ${localSource} data: https:`));
		assert.doesNotMatch(enabled, /\shttp:(?:\s|;)/);
	});
});
