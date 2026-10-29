/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const executable = join(repository, '.build/electron/codelad');

test('Electron IPC disconnects lost renderers and accepts a fresh connection after renderer termination', {
	skip: process.platform !== 'linux' || !process.env.DISPLAY || !existsSync(executable), timeout: 30000
}, async t => {
	const directory = mkdtempSync(join(tmpdir(), 'codelad-electron-ipc-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	const fixture = join(directory, 'main.mjs');
	writeFileSync(fixture, `
		import assert from 'node:assert/strict';
		import { once } from 'node:events';
		import { join } from 'node:path';
		import electron from 'electron';
		import { Server } from ${JSON.stringify(new URL('../../out/vs/base/parts/ipc/electron-main/ipc.electron.js', import.meta.url).href)};
		import { IPCClient } from ${JSON.stringify(new URL('../../out/vs/base/parts/ipc/common/ipc.js', import.meta.url).href)};
		import { Event } from ${JSON.stringify(new URL('../../out/vs/base/common/event.js', import.meta.url).href)};
		const { app, BrowserWindow, ipcMain } = electron;
		app.setPath('userData', join(${JSON.stringify(directory)}, 'profile'));
		app.setPath('crashDumps', join(${JSON.stringify(directory)}, 'dumps'));
		app.on('window-all-closed', () => {});
		let stage = 'app readiness';
		const deadline = setTimeout(() => { console.error('Electron IPC fixture timed out: ' + stage); app.exit(1); }, 15000);
		async function run() {
			await app.whenReady();
			const outcomes = [];
			try {
				for (const reason of ['disconnect', 'reconnect', 'killed', 'destroy']) {
					stage = reason + ': initial load';
					const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
					const server = new Server();
					const clients = [];
					try {
						await window.loadURL('about:blank');
						function connect() {
							const sender = window.webContents;
							const event = { sender, senderFrame: sender.mainFrame };
							ipcMain.emit('vscode:hello', event);
							const client = new IPCClient({ onMessage: Event.None, send: message => {
								if (!sender.isDestroyed()) ipcMain.emit('vscode:message', { sender, senderFrame: sender.mainFrame }, message.buffer);
							} }, reason);
							clients.push(client);
						}
						connect();
						assert.equal(server.connections.length, 1);
						stage = reason + ': disconnect';
						const disconnected = Event.toPromise(server.onDidRemoveConnection);
						if (reason === 'disconnect') {
							ipcMain.emit('vscode:disconnect', { sender: window.webContents, senderFrame: window.webContents.mainFrame }, null);
						} else if (reason === 'reconnect') {
							connect();
						} else if (reason === 'killed') {
							const crashed = once(window.webContents, 'render-process-gone');
							process.kill(window.webContents.getOSProcessId(), 'SIGKILL');
							await crashed;
						} else {
							window.destroy();
						}
						await disconnected;
						assert.equal(server.connections.length, reason === 'reconnect' ? 1 : 0);
						if (reason === 'killed') {
							stage = reason + ': fresh load';
							await window.loadURL('about:blank');
							connect();
							assert.equal(server.connections.length, 1);
						}
						outcomes.push(reason);
					} finally {
						for (const client of clients) client.dispose();
						if (!window.isDestroyed()) window.destroy();
						server.dispose();
					}
				}
				console.log('CODELAD_IPC_RESULT=' + JSON.stringify(outcomes));
				app.exit(0);
			} catch (error) {
				console.error(error);
				app.exit(1);
			} finally {
				clearTimeout(deadline);
			}
		}
		void run().catch(error => { console.error(error); app.exit(1); });
	`);
	const environment: NodeJS.ProcessEnv = { ...process.env, MANGOHUD: '0' };
	delete environment.ELECTRON_RUN_AS_NODE;
	const child = spawn(executable, [fixture], { env: environment, stdio: ['ignore', 'pipe', 'pipe'] });
	let output = '';
	child.stdout.setEncoding('utf8').on('data', data => { output += data; });
	child.stderr.setEncoding('utf8').on('data', data => { output += data; });
	const result = new Promise<number | null>((resolve, reject) => {
		child.once('error', reject);
		child.once('close', code => resolve(code));
	});
	t.after(async () => { child.kill(); await result; });
	const code = await result;
	assert.deepStrictEqual({ code, outcomes: output.match(/CODELAD_IPC_RESULT=(?<outcomes>[^\n]+)/)?.groups?.outcomes }, {
		code: 0, outcomes: JSON.stringify(['disconnect', 'reconnect', 'killed', 'destroy'])
	}, output);
});
