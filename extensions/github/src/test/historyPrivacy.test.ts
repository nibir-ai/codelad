/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'mocha';
import * as assert from 'assert';
import { ConfigurationTarget, EventEmitter, Uri, window, workspace } from 'vscode';
import { AuthenticationError, OctokitService } from '../auth.js';
import { GitHubSourceControlHistoryItemDetailsProvider } from '../historyItemDetailsProvider.js';
import type { API, Repository } from '../typings/git.d.ts';
import { DisposableStore } from '../util.js';

suite('GitHub history privacy', () => {
	test('does not request authentication for avatars until user opt-in', async () => {
		const disposables = new DisposableStore();
		const closed = new EventEmitter<Repository>();
		disposables.add(closed);
		const service = new OctokitService();
		disposables.add(service);
		const logger = window.createOutputChannel('GitHub history privacy test', { log: true });
		disposables.add(logger);
		const provider = new GitHubSourceControlHistoryItemDetailsProvider({ onDidCloseRepository: closed.event } as API, service, logger);
		disposables.add(provider);
		const config = workspace.getConfiguration('github');
		const previous = config.inspect<boolean>('showAvatar')?.globalValue;
		const repository = { rootUri: Uri.file('/codelad-privacy-fixture'), state: { remotes: [{ name: 'origin', fetchUrl: 'https://github.com/codelad-validation/privacy-fixture.git' }] } } as Repository;
		let authenticationCalls = 0;
		service.getOctokitGraphql = async () => {
			authenticationCalls++;
			throw new AuthenticationError('Controlled test: no account access');
		};
		try {
			await config.update('showAvatar', undefined, ConfigurationTarget.Global);
			const query = { size: 32, commits: [{ hash: 'local-only', authorName: 'Local Author', authorEmail: 'local@example.invalid' }] };
			const disabled = await provider.provideAvatar(repository, query);
			assert.deepStrictEqual({ result: disabled, authenticationCalls }, { result: undefined, authenticationCalls: 0 });
			await config.update('showAvatar', true, ConfigurationTarget.Global);
			const enabled = await provider.provideAvatar(repository, query);
			assert.deepStrictEqual({ result: enabled, authenticationCalls }, { result: undefined, authenticationCalls: 1 });
		} finally {
			await config.update('showAvatar', previous, ConfigurationTarget.Global);
			disposables.dispose();
		}
	});
});
