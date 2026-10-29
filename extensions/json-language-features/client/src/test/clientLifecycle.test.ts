/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { suite, test } from 'mocha';
import { ClientLifecycle } from '../utils/clientLifecycle';
import type { AsyncDisposable } from '../jsonClient';

suite('JSON client lifecycle', () => {
	test('deactivation and subscription disposal share shutdown and preserve logging until it finishes', async () => {
		const calls: string[] = [];
		const stopping = Promise.withResolvers<void>();
		let channelOpen = true;
		const lifecycle = new ClientLifecycle({ dispose: () => {
			channelOpen = false;
			calls.push('channel closed');
		} }, async () => ({ dispose: async () => {
			calls.push('stopping');
			await stopping.promise;
			assert.ok(channelOpen, 'Shutdown diagnostics must still have an open output channel');
			calls.push('stopped');
		} }));
		await lifecycle.ready;

		const deactivation = lifecycle.dispose();
		const subscriptions = lifecycle.dispose();
		assert.strictEqual(deactivation, subscriptions);
		await Promise.resolve();
		assert.deepStrictEqual(calls, ['stopping']);
		stopping.resolve();
		await deactivation;
		assert.deepStrictEqual(calls, ['stopping', 'stopped', 'channel closed']);
	});

	test('a late-starting client still stops before its output channel closes', async () => {
		const calls: string[] = [];
		const starting = Promise.withResolvers<AsyncDisposable>();
		const lifecycle = new ClientLifecycle({ dispose: () => { calls.push('channel closed'); } }, () => starting.promise);
		const disposing = lifecycle.dispose();
		starting.resolve({ dispose: async () => { calls.push('stopped'); } });
		await disposing;
		assert.deepStrictEqual(calls, ['stopped', 'channel closed']);
	});

	test('shutdown failure is preserved and the output channel is still closed', async () => {
		const calls: string[] = [];
		const failure = new Error('shutdown failed');
		const lifecycle = new ClientLifecycle({ dispose: () => { calls.push('channel closed'); } }, async () => ({ dispose: async () => {
			calls.push('shutdown failed');
			throw failure;
		} }));
		await lifecycle.ready;
		await assert.rejects(lifecycle.dispose(), error => error === failure);
		assert.deepStrictEqual(calls, ['shutdown failed', 'channel closed']);
	});

	test('failed activation is reported through readiness and disposes its output once', async () => {
		let disposed = 0;
		const failure = new Error('startup failed');
		const lifecycle = new ClientLifecycle({ dispose: () => { disposed++; } }, async () => { throw failure; });
		await assert.rejects(lifecycle.ready, error => error === failure);
		await Promise.all([lifecycle.dispose(), lifecycle.dispose()]);
		assert.strictEqual(disposed, 1);
	});
});
