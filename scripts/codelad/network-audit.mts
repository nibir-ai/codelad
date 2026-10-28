/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { summarizeNetLog } from '../../build/codelad/networkAudit.ts';

const { values } = parseArgs({ options: {
	executable: { type: 'string' },
	workspace: { type: 'string' },
	output: { type: 'string' },
	'summarize': { type: 'string' },
	'allow-host': { type: 'string', multiple: true, default: [] }
} });

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
	const executable = resolve(values.executable ?? '.build/electron/Codelad.exe');
	if (!existsSync(executable)) {
		throw new Error('Build the actual desktop executable first, then pass --executable with its path.');
	}
	const directory = resolve(values.output ?? join('.build/codelad/network', new Date().toISOString().replaceAll(/[:.]/g, '-')));
	if (existsSync(directory)) {
		throw new Error('Choose a new output directory so the audit starts with an empty profile.');
	}
	mkdirSync(directory, { recursive: true });
	const args = [
		resolve('.'), '--user-data-dir', join(directory, 'profile'), '--extensions-dir', join(directory, 'extensions'),
		'--shared-data-dir', join(directory, 'shared-data'),
		'--disable-extensions', '--skip-welcome', '--skip-release-notes', '--new-window',
		`--log-net-log=${join(directory, 'netlog.json')}`, '--net-log-capture-mode=Default'
	];
	if (values.workspace) {
		args.push(resolve(values.workspace));
	}
	// Launch the development executable against this checkout.
	const environment: NodeJS.ProcessEnv = { ...process.env, VSCODE_DEV: '1' };
	delete environment.ELECTRON_RUN_AS_NODE;
	let captureFailed = false;
	const child = spawn(executable, args, { stdio: 'inherit', env: environment });
	if (process.platform === 'win32' && child.pid) {
		const capture = spawn('powershell.exe', [
			'-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('./capture-connections.ps1', import.meta.url)),
			'-RootProcessId', String(child.pid), '-OutputFile', join(directory, 'connections.jsonl')
		], { stdio: 'inherit', windowsHide: true });
		capture.on('error', () => { console.error('Process-tree connection sampling could not start.'); captureFailed = true; process.exitCode = 1; });
		capture.on('exit', code => {
			if (code !== 0) {
				captureFailed = true;
				console.error('Process-tree connection sampling failed; capture coverage is incomplete.');
				process.exitCode = 1;
			}
		});
	}
	writeFileSync(join(directory, 'capture.json'), JSON.stringify({ pid: child.pid, startedAt: new Date().toISOString(), captureMode: 'Default' }, null, 2));
	console.log(`Audit profile and logs: ${directory}`);
	console.log('Close Codelad normally to finish the NetLog. Raw logs may contain private request metadata; review locally.');
	child.on('error', () => {
		console.error('Desktop executable could not be started.');
		process.exitCode = 1;
	});
	child.on('exit', code => {
		process.exitCode = captureFailed ? 1 : code ?? 1;
	});
}
