/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { summarizeNetLog } from '../../build/codelad/networkAudit.ts';

const { values } = parseArgs({ options: {
	executable: { type: 'string' },
	packaged: { type: 'boolean', default: false },
	'enable-extensions': { type: 'boolean', default: false },
	'local-crash-dumps': { type: 'boolean', default: false },
	'duration-seconds': { type: 'string', default: '180' },
	'remote-debugging-port': { type: 'string' },
	workspace: { type: 'string' },
	output: { type: 'string' },
	'summarize': { type: 'string' },
	'allow-host': { type: 'string', multiple: true, default: [] }
} });

/** Waits for capture and desktop completion without losing spawn failures or signal exits. */
function waitForExit(child: ChildProcess, label: string): Promise<{ code: number | null; signal: NodeJS.Signals | null; failedToStart: boolean }> {
	return new Promise(resolve => {
		let failedToStart = false;
		child.on('error', () => {
			failedToStart = true;
			console.error(`${label} could not be started.`);
		});
		child.on('close', (code, signal) => resolve({ code, signal, failedToStart }));
	});
}

if (values.summarize) {
	let contents: string;
	try {
		contents = readFileSync(resolve(values.summarize), 'utf8');
	} catch {
		throw new Error('Could not read a completed NetLog. Review it locally before sharing.');
	}
	const report = summarizeNetLog(contents, values['allow-host']);
	console.log(JSON.stringify(report, null, 2));
	if (report.hosts.some(entry => !entry.expectedForThisAction)) {
		process.exitCode = 1;
	}
} else {
	const duration = Number(values['duration-seconds']);
	const debugPort = values['remote-debugging-port'] === undefined ? undefined : Number(values['remote-debugging-port']);
	if (!Number.isSafeInteger(duration) || duration < 1 || duration > 3600 || (debugPort !== undefined && (!Number.isSafeInteger(debugPort) || debugPort < 0 || debugPort > 65535))) {
		throw new Error('Choose a duration of 1–3600 seconds and a debugging port of 0–65535.');
	}
	if (values.packaged && !values.executable) {
		throw new Error('Packaged audits require --executable pointing to the packaged desktop binary.');
	}
	const repository = fileURLToPath(new URL('../../', import.meta.url));
	const product: { applicationName: string; nameLong: string; nameShort: string } = JSON.parse(readFileSync(new URL('../../product.json', import.meta.url), 'utf8'));
	const defaultExecutable = process.platform === 'win32' ? `.build/electron/${product.nameShort}.exe`
		: process.platform === 'darwin' ? `.build/electron/${product.nameLong}.app/Contents/MacOS/${product.nameShort}`
			: `.build/electron/${product.applicationName}`;
	const executable = values.executable ? resolve(values.executable) : join(repository, defaultExecutable);
	if (!existsSync(executable)) {
		throw new Error('Build the actual desktop executable first, then pass --executable with its path.');
	}
	const directory = resolve(values.output ?? join('.build/codelad/network', new Date().toISOString().replaceAll(/[:.]/g, '-')));
	if (existsSync(directory)) {
		throw new Error('Choose a new output directory so the audit starts with an empty profile.');
	}
	mkdirSync(dirname(directory), { recursive: true });
	mkdirSync(directory, { mode: 0o700 });
	const args = [
		...values.packaged ? [] : [repository],
		'--user-data-dir', join(directory, 'profile'), '--extensions-dir', join(directory, 'extensions'),
		'--shared-data-dir', join(directory, 'shared-data'),
		...values['enable-extensions'] ? [] : ['--disable-extensions'],
		'--skip-welcome', '--skip-release-notes', '--new-window',
		`--log-net-log=${join(directory, 'netlog.json')}`, '--net-log-capture-mode=Default'
	];
	if (debugPort !== undefined) {
		args.push(`--remote-debugging-port=${debugPort}`, '--remote-debugging-address=127.0.0.1');
	}
	if (values['local-crash-dumps']) {
		args.push(`--crash-reporter-directory=${join(directory, 'dumps')}`);
	}
	if (values.workspace) {
		args.push(resolve(values.workspace));
	}
	const environment: NodeJS.ProcessEnv = { ...process.env };
	if (values.packaged) {
		delete environment.VSCODE_DEV;
	} else {
		environment.VSCODE_DEV = '1';
	}
	delete environment.ELECTRON_RUN_AS_NODE;
	delete environment.GIT_CONFIG_COUNT;
	delete environment.GIT_CONFIG_PARAMETERS;
	const child = spawn(executable, args, { stdio: 'inherit', env: environment });
	const desktopCompletion = waitForExit(child, 'Desktop executable');
	let captureCompletion: ReturnType<typeof waitForExit> | undefined;
	let capturePid: number | undefined;
	if ((process.platform === 'win32' || process.platform === 'linux') && child.pid) {
		const captureCommand = process.platform === 'win32' ? 'powershell.exe' : process.execPath;
		const captureArgs = process.platform === 'win32' ? [
			'-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('./capture-connections.ps1', import.meta.url)),
			'-RootProcessId', String(child.pid), '-OutputFile', join(directory, 'connections.jsonl'), '-DurationSeconds', String(duration)
		] : [fileURLToPath(new URL('./capture-linux-connections.mts', import.meta.url)), '--root-pid', String(child.pid), '--output', join(directory, 'connections.jsonl'), '--duration-seconds', String(duration)];
		const capture = spawn(captureCommand, captureArgs, { stdio: 'inherit', windowsHide: true });
		capturePid = capture.pid;
		captureCompletion = waitForExit(capture, 'Process-tree connection sampler');
	}
	const metadata = {
		pid: child.pid, capturePid, startedAt: new Date().toISOString(), captureMode: 'Default',
		executable, mode: values.packaged ? 'packaged' : 'development', extensionsEnabled: values['enable-extensions'],
		localCrashDumps: values['local-crash-dumps'], durationSeconds: duration
	};
	const writeMetadata = (completion = {}) => writeFileSync(join(directory, 'capture.json'), JSON.stringify({ ...metadata, ...completion }, null, 2), { mode: 0o600 });
	writeMetadata();
	console.log(`Audit profile and logs: ${directory}`);
	console.log('Close Codelad normally to finish the NetLog. Raw logs may contain private request metadata; review locally.');
	const forwardSignal = (signal: NodeJS.Signals) => { child.kill(signal); };
	process.on('SIGTERM', forwardSignal);
	process.on('SIGINT', forwardSignal);
	const [desktop, capture] = await Promise.all([desktopCompletion, captureCompletion]);
	process.removeListener('SIGTERM', forwardSignal);
	process.removeListener('SIGINT', forwardSignal);
	if (capture && (capture.failedToStart || capture.code !== 0)) {
		console.error('Process-tree connection sampling failed; capture coverage is incomplete.');
	}
	writeMetadata({ finishedAt: new Date().toISOString(), desktop, capture });
	process.exitCode = desktop.failedToStart || (capture && (capture.failedToStart || capture.code !== 0)) ? 1 : desktop.code ?? 1;
}
