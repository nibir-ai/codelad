/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../../scripts/codelad/network-audit.mts', import.meta.url));

test('network audit reports unexpected hosts without exposing request secrets', () => {
	const directory = mkdtempSync(join(tmpdir(), 'codelad-netlog-test-'));
	try {
		const file = join(directory, 'netlog.json');
		writeFileSync(file, JSON.stringify({ constants: { logEventTypes: {} }, events: [
			{ params: { url: 'https://user:PRIVATE_PASSWORD@open-vsx.org/api/PRIVATE_PATH?token=PRIVATE_TOKEN' } },
			{ params: { url: 'https://unexpected.invalid/PRIVATE_PATH' } }
		] }));
		const result = spawnSync(process.execPath, [script, '--summarize', file, '--allow-host', 'open-vsx.org'], { encoding: 'utf8' });
		assert.deepStrictEqual({
			status: result.status,
			hosts: JSON.parse(result.stdout).hosts,
			leaksPrivateValues: /PRIVATE_/.test(result.stdout + result.stderr)
		}, {
			status: 1,
			hosts: [{ host: 'open-vsx.org', urlEvents: 1, expectedForThisAction: true }, { host: 'unexpected.invalid', urlEvents: 1, expectedForThisAction: false }],
			leaksPrivateValues: false
		});
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

test('unfinished capture is rejected without printing private raw contents', () => {
	const directory = mkdtempSync(join(tmpdir(), 'codelad-netlog-test-'));
	try {
		const file = join(directory, 'netlog.json');
		writeFileSync(file, '{"PRIVATE_TOKEN":');
		const result = spawnSync(process.execPath, [script, '--summarize', file], { encoding: 'utf8' });
		assert.deepStrictEqual({ status: result.status, leaksPrivateValues: /PRIVATE_TOKEN/.test(result.stdout + result.stderr) }, { status: 1, leaksPrivateValues: false });
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
