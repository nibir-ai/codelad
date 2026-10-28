/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterLinuxConnections } from './linuxConnections.ts';

test('Linux capture keeps owned IPv4, IPv6 and UDP endpoints without retaining process details', () => {
	const snapshot = [
		'tcp ESTAB 0 0 127.0.0.1:41649 127.0.0.1:1234 users:(("PRIVATE_PROCESS",pid=10,fd=1))',
		'udp UNCONN 0 0 [::]:443 [::]:0 users:(("PRIVATE_PROCESS",pid=11,fd=2))',
		'tcp ESTAB 0 0 192.0.2.1:1234 192.0.2.2:443 users:(("OTHER_PRIVATE_PROCESS",pid=999,fd=3))'
	].join('\n');
	assert.deepStrictEqual(filterLinuxConnections(snapshot, new Set([10, 11])), { connections: [
		{ pid: 10, protocol: 'tcp', state: 'ESTAB', local: '127.0.0.1:41649', remote: '127.0.0.1:1234' },
		{ pid: 11, protocol: 'udp', state: 'UNCONN', local: '[::]:443', remote: '[::]:0' }
	], unparsedOwnedRows: 0 });
});

test('Linux capture does not retain unknown endpoints, malformed rows or unrelated sockets', () => {
	assert.deepStrictEqual(filterLinuxConnections([
		'tcp ESTAB 0 0 PRIVATE_PATH:1 PRIVATE_HOST:443 users:(("private",pid=10,fd=1))',
		'tcp ESTAB 0 0 127.0.0.1:1 127.0.0.1:2',
		'garbage',
		'udp UNCONN 0 0 0.0.0.0:1 0.0.0.0:0 users:(("private",pid=999,fd=1))'
	].join('\n'), new Set([10])), { connections: [], unparsedOwnedRows: 1 });
});
