/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Optional asset-authoring tool only. Normal app/build installation needs neither binary.
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = join(root, 'resources/codelad/icon.svg');
const temporary = mkdtempSync(join(tmpdir(), 'codelad-icons-'));
function run(command: string, args: string[]): void {
	const result = spawnSync(command, args, { stdio: 'inherit' });
	if (result.error || result.status !== 0) {
		throw new Error(`Icon generation requires a working ${command}`);
	}
}
function png(size: number): string {
	const destination = join(temporary, `${size}.png`);
	run('rsvg-convert', ['--width', String(size), '--height', String(size), '--output', destination, source]);
	return destination;
}
try {
	for (const [size, destination] of [
		[1024, 'resources/linux/code.png'], [70, 'resources/win32/code_70x70.png'],
		[150, 'resources/win32/code_150x150.png'], [192, 'resources/server/code-192.png'],
		[512, 'resources/server/code-512.png']
	] as const) {
		copyFileSync(png(size), join(root, destination));
	}
	copyFileSync(source, join(root, 'src/vs/workbench/browser/media/code-icon.svg'));
	for (const destination of ['resources/win32/code.ico', 'resources/server/favicon.ico']) {
		run('magick', [[16, 24, 32, 48, 64, 128, 256].map(png), join(root, destination)].flat());
	}
	// PNG-backed representations already used by the upstream ICNS, including Retina sizes.
	const chunks = ([['ic11', 32], ['ic12', 64], ['ic07', 128], ['ic08', 256], ['ic13', 256], ['ic09', 512], ['ic14', 512], ['ic10', 1024]] as const).map(([type, size]) => {
		const contents = readFileSync(png(size));
		const header = Buffer.alloc(8);
		header.write(type);
		header.writeUInt32BE(contents.length + 8, 4);
		return Buffer.concat([header, contents]);
	});
	const header = Buffer.alloc(8);
	header.write('icns');
	header.writeUInt32BE(8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0), 4);
	writeFileSync(join(root, 'resources/darwin/code.icns'), Buffer.concat([header, ...chunks]));
	// Preserve the upstream installer's authored dimensions, which are not uniform scale multiples.
	for (const [scale, bigWidth, bigHeight, smallWidth, smallHeight] of [
		[100, 164, 314, 55, 55], [125, 192, 386, 64, 68], [150, 246, 459, 83, 80],
		[175, 273, 556, 92, 97], [200, 328, 604, 110, 106], [225, 355, 700, 119, 123],
		[250, 410, 797, 138, 140]
	]) {
		for (const kind of ['big', 'small']) {
			const width = kind === 'big' ? bigWidth : smallWidth;
			const height = kind === 'big' ? bigHeight : smallHeight;
			const logo = png(Math.round((kind === 'big' ? 112 : 48) * scale / 100));
			run('magick', ['-size', `${width}x${height}`, 'xc:#18252b', logo, '-gravity', 'center', '-composite', '-alpha', 'off', `BMP3:${join(root, `resources/win32/inno-${kind}-${scale}.bmp`)}`]);
		}
	}
} finally {
	rmSync(temporary, { recursive: true, force: true });
}
