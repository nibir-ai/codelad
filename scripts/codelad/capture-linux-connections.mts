/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawnSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, readdirSync, writeSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { filterLinuxConnections } from '../../build/codelad/linuxConnections.ts';

const { values } = parseArgs({ options: {
	'root-pid': { type: 'string' }, output: { type: 'string' }, 'duration-seconds': { type: 'string', default: '180' }
} });
const rootPid = Number(values['root-pid']);
const duration = Number(values['duration-seconds']);
if (process.platform !== 'linux' || !Number.isSafeInteger(rootPid) || rootPid <= 0 || !values.output || !Number.isFinite(duration) || duration <= 0) {
	throw new Error('Run on Linux with --root-pid, a new --output file and a positive --duration-seconds.');
}

function readProcess(pid: number): { parentPid: number; startedAt: string } | undefined {
	try {
		const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
		const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
		if (fields[0] === 'Z' || fields[0] === 'X') {
			return undefined;
		}
		return { parentPid: Number(fields[1]), startedAt: fields[19] };
	} catch {
		return undefined;
	}
}

const root = readProcess(rootPid);
if (!root) {
	throw new Error('The editor root process is not running.');
}
const known = new Map([[rootPid, root.startedAt]]);
const output = openSync(values.output, 'wx', 0o600);
writeSync(output, JSON.stringify({
	coverage: 'Linux process-tree TCP/UDP snapshots via ss. Sampling can miss short-lived sockets, unconnected UDP/DNS and unreadable processes; this is not packet capture.',
	rootPid, intervalMs: 1000, durationSeconds: duration
}) + '\n');
let finished = false;
let incomplete = false;

function finish(reason: 'process-tree-exited' | 'duration-limit' | 'interrupted' | 'capture-error', code = 0): void {
	if (!finished) {
		finished = true;
		clearInterval(interval);
		clearTimeout(deadline);
		writeSync(output, JSON.stringify({ at: new Date().toISOString(), finished: true, reason, remainingProcessCount: known.size, incomplete }) + '\n');
		closeSync(output);
		process.exitCode = code || (incomplete ? 1 : 0);
	}
}

function sample(): void {
	let unreadableProcessEntries = 0;
	const queue = [...known.keys()];
	const current = new Set<number>();
	for (const pid of queue) {
		const info = readProcess(pid);
		if (!info || (known.has(pid) && known.get(pid) !== info.startedAt)) {
			known.delete(pid);
			continue;
		}
		known.set(pid, info.startedAt);
		current.add(pid);
		try {
			for (const task of readdirSync(`/proc/${pid}/task`)) {
				try {
					for (const child of readFileSync(`/proc/${pid}/task/${task}/children`, 'utf8').trim().split(/\s+/).map(Number)) {
						if (child > 0 && !queue.includes(child)) {
							queue.push(child);
						}
					}
				} catch {
					unreadableProcessEntries++;
				}
			}
		} catch {
			unreadableProcessEntries++;
		}
	}
	if (!current.size) {
		finish('process-tree-exited');
		return;
	}
	const result = spawnSync('ss', ['-Htanup'], { encoding: 'utf8', timeout: 5000, maxBuffer: 8 * 1024 * 1024 });
	if (result.error || result.status !== 0) {
		writeSync(output, JSON.stringify({ at: new Date().toISOString(), error: 'Socket capture failed; coverage is incomplete.' }) + '\n');
		incomplete = true;
		finish('capture-error', 1);
		return;
	}
	const parsed = filterLinuxConnections(result.stdout, current);
	incomplete ||= unreadableProcessEntries > 0 || parsed.unparsedOwnedRows > 0;
	writeSync(output, JSON.stringify({ at: new Date().toISOString(), processCount: current.size, unreadableProcessEntries, ...parsed }) + '\n');
}

const interval = setInterval(sample, 1000);
const deadline = setTimeout(() => {
	sample();
	finish('duration-limit');
}, duration * 1000);
process.on('SIGTERM', () => { incomplete = true; finish('interrupted', 1); });
process.on('SIGINT', () => { incomplete = true; finish('interrupted', 1); });
sample();
