/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeNetLog } from './networkAudit.ts';

test('network audit reports unexpected hosts without exposing request secrets', () => {
	const report = summarizeNetLog(JSON.stringify({ constants: { logEventTypes: {} }, events: [
		{ params: { url: 'https://user:PRIVATE_PASSWORD@open-vsx.org/api/PRIVATE_PATH?token=PRIVATE_TOKEN' } },
		{ params: { url: 'https://unexpected.invalid/PRIVATE_PATH' } }
	] }), ['open-vsx.org']);
	assert.deepStrictEqual({ hosts: report.hosts, leaksPrivateValues: /PRIVATE_/.test(JSON.stringify(report)) }, {
		hosts: [{ host: 'open-vsx.org', urlEvents: 1, expectedForThisAction: true }, { host: 'unexpected.invalid', urlEvents: 1, expectedForThisAction: false }],
		leaksPrivateValues: false
	});
});

test('network audit counts URL events and normalizes hosts without treating metadata as requests', () => {
	const report = summarizeNetLog(JSON.stringify({ constants: { logEventTypes: {} }, events: [
		{ params: { url: 'https://OPEN-VSX.ORG/api' } },
		{ params: { url: 'wss://open-vsx.org/socket' } },
		{ params: { url: 'file:///PRIVATE_PATH' } },
		{ params: { url: 'data:text/plain,PRIVATE_CONTENT' } },
		{ params: { source: 'PRIVATE_METADATA' } }, {}
	] }), ['OPEN-VSX.ORG']);
	assert.deepStrictEqual({ hosts: report.hosts, localRequests: report.localRequests }, {
		hosts: [{ host: 'open-vsx.org', urlEvents: 2, expectedForThisAction: true }], localRequests: 2
	});
});

test('unfinished and malformed captures are rejected without printing private raw contents', () => {
	for (const contents of ['{"PRIVATE_TOKEN":', 'null', '{}', '{"events":[],"PRIVATE_TOKEN":"secret"}', '{"events":[null],"constants":{"logEventTypes":{}}}']) {
		assert.throws(() => summarizeNetLog(contents), error => error instanceof Error && !/PRIVATE_|secret/.test(error.message));
	}
});

test('invalid request URLs are rejected without exposing their contents', () => {
	assert.throws(() => summarizeNetLog(JSON.stringify({ constants: { logEventTypes: {} }, events: [{ params: { url: 'PRIVATE_SECRET_INVALID_URL' } }] })), error =>
		error instanceof Error && error.message.includes('Unparseable request URL') && !error.message.includes('PRIVATE_'));
});

test('empty WebSocket lifecycle metadata is counted separately without weakening invalid URL checks', () => {
	const report = summarizeNetLog(JSON.stringify({ constants: { logEventTypes: { WEBSOCKET_ALIVE: 3 } }, events: [
		{ type: 3, params: { url: '' } },
		{ params: { url: 'ws://127.0.0.1/socket?PRIVATE_TOKEN' } }
	] }));
	assert.deepStrictEqual({ metadata: report.emptyWebSocketEvents, localRequests: report.localRequests, hosts: report.hosts }, {
		metadata: 1, localRequests: 0, hosts: [{ host: '127.0.0.1', urlEvents: 1, expectedForThisAction: false }]
	});
	for (const event of [{ params: { url: '' } }, { type: 4, params: { url: '' } }, { type: 3, params: { url: 'PRIVATE_INVALID' } }]) {
		assert.throws(() => summarizeNetLog(JSON.stringify({ constants: { logEventTypes: { WEBSOCKET_ALIVE: 3 } }, events: [event] })), /Unparseable request URL/);
	}
});
