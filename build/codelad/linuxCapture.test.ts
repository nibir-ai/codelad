/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

interface ICaptureRow {
	readonly at?: string;
	readonly connections?: readonly { pid: number }[];
	readonly finished?: boolean;
	readonly reason?: string;
	readonly remainingProcessCount?: number;
	readonly incomplete?: boolean;
}

interface IAuditMetadata {
	readonly mode: string;
	readonly extensionsEnabled: boolean;
	readonly localCrashDumps: boolean;
	readonly desktop: { code: number | null; signal: string | null; failedToStart: boolean };
	readonly capture: { code: number | null; signal: string | null; failedToStart: boolean };
}

const linuxOnly = { skip: process.platform !== 'linux', timeout: 20000 };
const sampler = fileURLToPath(new URL('../../scripts/codelad/capture-linux-connections.mts', import.meta.url));
const launcher = fileURLToPath(new URL('../../scripts/codelad/network-audit.mts', import.meta.url));

function temporaryDirectory(t: TestContext): string {
	const directory = mkdtempSync(join(tmpdir(), 'codelad-capture-test-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	return directory;
}

function completion(child: ChildProcess): Promise<number | null> {
	return new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', code => resolve(code));
	});
}

async function waitFor<T>(read: () => T | undefined): Promise<T> {
	const deadline = Date.now() + 10000;
	while (Date.now() < deadline) {
		const value = read();
		if (value !== undefined) {
			return value;
		}
		await setTimeout(50);
	}
	throw new Error('Timed out waiting for capture evidence.');
}

function readCapture(path: string): ICaptureRow[] {
	try {
		return readFileSync(path, 'utf8').trim().split('\n').map(line => JSON.parse(line));
	} catch {
		return [];
	}
}

async function startProcessTree(t: TestContext) {
	const childCode = `
		const socket = require('node:dgram').createSocket('udp4');
		socket.bind(0, '127.0.0.1', () => process.send({ pid: process.pid }));
	`;
	const root = spawn(process.execPath, ['--input-type=module', '--eval', `
		import { spawn } from 'node:child_process';
		const child = spawn(process.execPath, ['--eval', ${JSON.stringify(childCode)}], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
		child.once('message', message => process.send(message));
		process.on('message', () => { child.disconnect(); child.unref(); process.exit(0); });
	`], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
	const rootCompletion = completion(root);
	t.after(async () => {
		root.kill();
		await rootCompletion;
	});
	const childPid = ((await once(root, 'message'))[0] as { pid: number }).pid;
	t.after(() => {
		try { process.kill(childPid, 'SIGTERM'); } catch { /* The fixture may already have exited. */ }
	});
	return { root, rootCompletion, childPid };
}

function startCapture(t: TestContext, root: ChildProcess, output: string, duration = '15', environment = process.env) {
	const child = spawn(process.execPath, [sampler, '--root-pid', String(root.pid), '--output', output, '--duration-seconds', duration], { stdio: 'ignore', env: environment });
	const result = completion(child);
	t.after(async () => { child.kill(); await result; });
	return { child, result };
}

test('Linux sampler follows a discovered child after its parent exits and finishes when the tree exits', linuxOnly, async t => {
	const output = join(temporaryDirectory(t), 'connections.jsonl');
	const { root, rootCompletion, childPid } = await startProcessTree(t);
	const { result } = startCapture(t, root, output);
	await waitFor(() => readCapture(output).find(row => row.connections?.some(connection => connection.pid === childPid)));
	root.send('exit');
	await rootCompletion;
	const parentExitedAt = Date.now();
	await waitFor(() => readCapture(output).find(row => row.at && Date.parse(row.at) > parentExitedAt && row.connections?.some(connection => connection.pid === childPid)));
	process.kill(childPid, 'SIGTERM');
	assert.deepStrictEqual({ code: await result, final: readCapture(output).at(-1), mode: statSync(output).mode & 0o777 }, {
		code: 0,
		final: { at: readCapture(output).at(-1)?.at, finished: true, reason: 'process-tree-exited', remainingProcessCount: 0, incomplete: false },
		mode: 0o600
	});
});

test('Linux sampler distinguishes a duration limit from complete process-tree shutdown', linuxOnly, async t => {
	const output = join(temporaryDirectory(t), 'connections.jsonl');
	const { root } = await startProcessTree(t);
	const { result } = startCapture(t, root, output, '1');
	assert.deepStrictEqual({ code: await result, final: readCapture(output).at(-1) }, {
		code: 0,
		final: { at: readCapture(output).at(-1)?.at, finished: true, reason: 'duration-limit', remainingProcessCount: 2, incomplete: false }
	});
});

test('Linux sampler reports interruption as incomplete coverage', linuxOnly, async t => {
	const output = join(temporaryDirectory(t), 'connections.jsonl');
	const { root, childPid } = await startProcessTree(t);
	const { child, result } = startCapture(t, root, output);
	await waitFor(() => readCapture(output).find(row => row.connections?.some(connection => connection.pid === childPid)));
	child.kill('SIGTERM');
	assert.deepStrictEqual({ code: await result, final: readCapture(output).at(-1) }, {
		code: 1,
		final: { at: readCapture(output).at(-1)?.at, finished: true, reason: 'interrupted', remainingProcessCount: 2, incomplete: true }
	});
});

test('Linux sampler records a failed socket command and preserves existing output files', linuxOnly, async t => {
	const directory = temporaryDirectory(t);
	const output = join(directory, 'connections.jsonl');
	const { root } = await startProcessTree(t);
	const { result } = startCapture(t, root, output, '15', { ...process.env, PATH: '' });
	const code = await result;
	const contents = readFileSync(output, 'utf8');
	const retry = startCapture(t, root, output);
	assert.deepStrictEqual({ code, final: readCapture(output).at(-1), retry: await retry.result, preserved: readFileSync(output, 'utf8') === contents }, {
		code: 1,
		final: { at: readCapture(output).at(-1)?.at, finished: true, reason: 'capture-error', remainingProcessCount: 2, incomplete: true },
		retry: 1, preserved: true
	});
});

for (const { packaged, captureFailure } of [{ packaged: false, captureFailure: false }, { packaged: true, captureFailure: false }, { packaged: true, captureFailure: true }]) {
	test(`audit launcher isolates a ${packaged ? 'packaged' : 'development'} executable and records capture ${captureFailure ? 'failure' : 'completion'}`, linuxOnly, async t => {
		const directory = temporaryDirectory(t);
		const output = join(directory, 'audit');
		const observed = join(directory, 'observed.json');
		const executable = join(directory, 'fixture.mjs');
		writeFileSync(executable, `#!${process.execPath}\n
			import { writeFileSync } from 'node:fs';
			writeFileSync(${JSON.stringify(observed)}, JSON.stringify({ args: process.argv.slice(2), development: process.env.VSCODE_DEV ?? null, runAsNode: process.env.ELECTRON_RUN_AS_NODE ?? null, gitConfig: process.env.GIT_CONFIG_COUNT ?? null }));
			setTimeout(() => process.exit(0), 1500);
		`);
		chmodSync(executable, 0o700);
		const child = spawn(process.execPath, [launcher, '--executable', executable, '--output', output, '--duration-seconds', '10', '--remote-debugging-port', '0',
			...packaged ? ['--packaged', '--enable-extensions', '--local-crash-dumps'] : []
		], { stdio: 'ignore', env: { ...process.env, VSCODE_DEV: 'inherited', ELECTRON_RUN_AS_NODE: '1', GIT_CONFIG_COUNT: '1', PATH: captureFailure ? '' : process.env.PATH } });
		const result = completion(child);
		t.after(async () => { child.kill(); await result; });
		const code = await result;
		const observation: { args: string[]; development: string | null; runAsNode: string | null; gitConfig: string | null } = JSON.parse(readFileSync(observed, 'utf8'));
		const metadata: IAuditMetadata = JSON.parse(readFileSync(join(output, 'capture.json'), 'utf8'));
		assert.deepStrictEqual({
			code, mode: metadata.mode, extensionsEnabled: metadata.extensionsEnabled, desktop: metadata.desktop, capture: metadata.capture,
			localCrashDumps: metadata.localCrashDumps, dumpArgument: observation.args.find(argument => argument.startsWith('--crash-reporter-directory=')),
			firstArgument: observation.args[0], disableExtensions: observation.args.includes('--disable-extensions'),
			development: observation.development, runAsNode: observation.runAsNode, gitConfig: observation.gitConfig,
			trustBypassed: observation.args.includes('--disable-workspace-trust'),
			debugPort: observation.args.includes('--remote-debugging-port=0'),
			directoryMode: statSync(output).mode & 0o777, metadataMode: statSync(join(output, 'capture.json')).mode & 0o777
		}, {
			code: captureFailure ? 1 : 0, mode: packaged ? 'packaged' : 'development', extensionsEnabled: packaged,
			localCrashDumps: packaged, dumpArgument: packaged ? `--crash-reporter-directory=${join(output, 'dumps')}` : undefined,
			desktop: { code: 0, signal: null, failedToStart: false }, capture: { code: captureFailure ? 1 : 0, signal: null, failedToStart: false },
			firstArgument: packaged ? '--user-data-dir' : fileURLToPath(new URL('../../', import.meta.url)), disableExtensions: !packaged,
			development: packaged ? null : '1', runAsNode: null, gitConfig: null, trustBypassed: false, debugPort: true,
			directoryMode: 0o700, metadataMode: 0o600
		});
	});
}
