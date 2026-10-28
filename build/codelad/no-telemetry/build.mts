/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const source = readFileSync(new URL('./src/index.mts', import.meta.url), 'utf8');
const compiler = join(dirname(createRequire(import.meta.url).resolve('@typescript/native/package.json')), 'bin', 'tsc');
// File dependencies can be prepared concurrently by different extensions.
const declarationDirectory = new URL(`./out/types.${process.pid}/`, import.meta.url);
mkdirSync(declarationDirectory, { recursive: true });
const result = spawnSync(process.execPath, [compiler, '--ignoreConfig', '--declaration', '--emitDeclarationOnly', '--skipLibCheck', '--target', 'es2022', '--module', 'nodenext', '--outDir', fileURLToPath(declarationDirectory), fileURLToPath(new URL('./src/index.mts', import.meta.url))], { stdio: 'inherit' });
if (result.error || result.status !== 0) {
	throw result.error ?? new Error('Could not generate extension compatibility declarations');
}
const declarationFile = new URL('index.d.mts', declarationDirectory);
const declarations = readFileSync(declarationFile, 'utf8');
unlinkSync(declarationFile);
rmdirSync(declarationDirectory);
for (const [name, contents] of Object.entries({
	'index.js': transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code,
	'index.cjs': transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2022' }).code,
	'index.d.mts': declarations,
	'index.d.cts': declarations
})) {
	const destination = new URL(`./out/${name}`, import.meta.url);
	if (!existsSync(destination) || readFileSync(destination, 'utf8') !== contents) {
		const temporary = new URL(`./out/${name}.${process.pid}.tmp`, import.meta.url);
		writeFileSync(temporary, contents);
		renameSync(temporary, destination);
	}
}
