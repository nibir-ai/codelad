/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

// Optional asset-authoring tool only. Normal app/build installation needs no image library.
// Use an existing sharp installation rather than adding a runtime dependency.
const { values } = parseArgs({ options: { 'sharp-path': { type: 'string' } } });
const { default: sharp } = await import(values['sharp-path'] ? pathToFileURL(values['sharp-path']).href : 'sharp');
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = join(root, 'assets/codeLad-symbol-art-2048.png');
const vector = join(root, 'assets/codeLad-flat-vector.svg');
const representations = new Map<number, Buffer>();
async function png(size: number): Promise<Buffer> {
	let contents = representations.get(size);
	if (!contents) {
		contents = await sharp(source).resize(size, size).png().toBuffer();
		representations.set(size, contents);
	}
	return contents;
}

// The installer consumes uncompressed 24-bit BMPs. Encode the existing RGB pixels,
// retaining its authored dimensions without a platform-specific conversion binary.
function bitmap(rgb: Buffer, width: number, height: number): Buffer {
	const stride = (width * 3 + 3) & ~3;
	const result = Buffer.alloc(54 + stride * height);
	result.write('BM');
	result.writeUInt32LE(result.length, 2);
	result.writeUInt32LE(54, 10);
	result.writeUInt32LE(40, 14);
	result.writeInt32LE(width, 18);
	result.writeInt32LE(height, 22);
	result.writeUInt16LE(1, 26);
	result.writeUInt16LE(24, 28);
	result.writeUInt32LE(stride * height, 34);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const input = (y * width + x) * 3;
			const output = 54 + (height - y - 1) * stride + x * 3;
			result[output] = rgb[input + 2];
			result[output + 1] = rgb[input + 1];
			result[output + 2] = rgb[input];
		}
	}
	return result;
}

for (const [size, destination] of [
	[1024, 'resources/linux/code.png'], [70, 'resources/win32/code_70x70.png'],
	[150, 'resources/win32/code_150x150.png'], [192, 'resources/server/code-192.png'],
	[512, 'resources/server/code-512.png']
] as const) {
	writeFileSync(join(root, destination), await png(size));
}
copyFileSync(vector, join(root, 'resources/codelad/icon.svg'));
copyFileSync(vector, join(root, 'src/vs/workbench/browser/media/code-icon.svg'));
for (const destination of ['resources/win32/code.ico', 'resources/server/favicon.ico']) {
	copyFileSync(join(root, 'assets/codeLad-windows.ico'), join(root, destination));
}
// PNG-backed representations already used by the upstream ICNS, including Retina sizes.
const chunks = await Promise.all(([['ic11', 32], ['ic12', 64], ['ic07', 128], ['ic08', 256], ['ic13', 256], ['ic09', 512], ['ic14', 512], ['ic10', 1024]] as const).map(async ([type, size]) => {
	const contents = await png(size);
	const header = Buffer.alloc(8);
	header.write(type);
	header.writeUInt32BE(contents.length + 8, 4);
	return Buffer.concat([header, contents]);
}));
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
		const size = Math.min(width, height, Math.round((kind === 'big' ? 112 : 48) * scale / 100));
		const rgb = await sharp({ create: { width, height, channels: 3, background: '#18252b' } })
			.composite([{ input: await png(size), gravity: 'centre' }]).removeAlpha().raw().toBuffer();
		writeFileSync(join(root, `resources/win32/inno-${kind}-${scale}.bmp`), bitmap(rgb, width, height));
	}
}
