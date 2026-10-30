/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'mocha';
import * as assert from 'assert';
import { createServer } from 'http';
import { graphql } from '@octokit/graphql';
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

	test('sends only the expected GraphQL fields to a selected endpoint after opt-in', async () => {
		interface RequestBody { query: string; variables: { owner: string; repo: string; commit?: string } }
		const requests: { path: string | undefined; headers: string[]; body: RequestBody }[] = [];
		const server = createServer((request, response) => {
			const chunks: Buffer[] = [];
			request.on('data', (chunk: Buffer) => chunks.push(chunk));
			request.on('end', () => {
				const body: RequestBody = JSON.parse(Buffer.concat(chunks).toString());
				requests.push({ path: request.url, headers: Object.keys(request.headers), body });
				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify({ data: { repository: body.variables.commit
					? { object: { author: { name: 'Local Author', email: 'local@example.invalid', avatarUrl: 'https://example.invalid/avatar?fixture=1', user: { id: 'fixture', login: 'fixture' } } } }
					: { assignableUsers: { nodes: [] } } } }));
			});
		});
		await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
		const address = server.address();
		assert.ok(address && typeof address !== 'string');
		const disposables = new DisposableStore();
		const closed = new EventEmitter<Repository>();
		disposables.add(closed);
		const service = new OctokitService();
		disposables.add(service);
		service.getOctokitGraphql = async () => graphql.defaults({ baseUrl: `http://127.0.0.1:${address.port}`, headers: { authorization: 'token codelad-fixture-only' } });
		const logger = window.createOutputChannel('GitHub provider payload test', { log: true });
		disposables.add(logger);
		const provider = new GitHubSourceControlHistoryItemDetailsProvider({ onDidCloseRepository: closed.event } as API, service, logger);
		disposables.add(provider);
		const config = workspace.getConfiguration('github');
		const previous = config.inspect<boolean>('showAvatar')?.globalValue;
		const repository = { rootUri: Uri.file('/codelad-privacy-fixture'), state: { remotes: [{ name: 'origin', fetchUrl: 'https://github.com/codelad-validation/privacy-fixture.git' }] } } as Repository;
		const query = { size: 32, commits: [{ hash: 'local-only', authorName: 'Local Author', authorEmail: 'local@example.invalid' }] };
		try {
			await config.update('showAvatar', false, ConfigurationTarget.Global);
			await provider.provideAvatar(repository, query);
			assert.strictEqual(requests.length, 0);
			await config.update('showAvatar', true, ConfigurationTarget.Global);
			const avatars = await provider.provideAvatar(repository, query);
			assert.strictEqual(avatars?.get('local-only'), 'https://example.invalid/avatar?fixture=1&s=32');
			assert.deepStrictEqual(requests.map(request => ({ path: request.path, fields: Object.keys(request.body).sort(), variables: request.body.variables })), [
				{ path: '/graphql', fields: ['query', 'variables'], variables: { owner: 'codelad-validation', repo: 'privacy-fixture' } },
				{ path: '/graphql', fields: ['query', 'variables'], variables: { owner: 'codelad-validation', repo: 'privacy-fixture', commit: 'local-only' } },
			]);
			assert.ok(requests.every(request => request.headers.includes('authorization') && !request.headers.some(header => /machine|session|cookie/i.test(header))));
			await config.update('showAvatar', false, ConfigurationTarget.Global);
			await provider.provideAvatar(repository, query);
			assert.strictEqual(requests.length, 2);
		} finally {
			await config.update('showAvatar', previous, ConfigurationTarget.Global);
			disposables.dispose();
			await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
		}
	});
});
