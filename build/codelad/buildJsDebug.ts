/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromBuffer } from 'yauzl';
import { assertNoTelemetryDependencies } from './dependencies.ts';

interface IRecipe {
	readonly extensionId: string;
	readonly version: string;
	readonly upstreamVersion: string;
	readonly sourceCommit: string;
	readonly sourceArchiveSha256: string;
	readonly upstreamVsixSha256: string;
	readonly packageLockSha256: string;
	readonly gulpfileSha256: string;
	readonly replacements: Readonly<Record<string, string>>;
}

interface IArtifact {
	readonly path: string;
	readonly sha256: string;
	readonly recipeHash: string;
}

const recipeDirectory = fileURLToPath(new URL('./js-debug/', import.meta.url));
const recipe: IRecipe = JSON.parse(readFileSync(join(recipeDirectory, 'recipe.json'), 'utf8'));
const builds = new Map<string, Promise<IArtifact>>();
const sha256 = (contents: string | Buffer): string => createHash('sha256').update(contents).digest('hex');

/** Prevents a product override from mislabeling the source build or changing its pinned notice input. */
export function assertJsDebugDefinition(extension: { name: string; version: string; sha256: string; codeladSource?: string }): void {
	if (extension.codeladSource !== 'js-debug' || extension.name !== recipe.extensionId || extension.version !== recipe.version || extension.sha256 !== recipe.upstreamVsixSha256) {
		throw new Error('Codelad debugger definition differs from the reviewed source recipe');
	}
}

/** Includes the reviewed recipe, replacements, build/audit code and build platform in the cache key. */
export function getJsDebugRecipeHash(): string {
	const hash = createHash('sha256');
	for (const file of [new URL(import.meta.url), new URL('./jsDebugPolicy.ts', import.meta.url), new URL('./dependencies.ts', import.meta.url), new URL('./js-debug/recipe.json', import.meta.url), ...Object.keys(recipe.replacements).map(name => new URL(`./js-debug/${name}.txt`, import.meta.url))]) {
		hash.update(readFileSync(file));
	}
	return hash.update(`${process.platform}/${process.arch}/${process.versions.node}`).digest('hex');
}

async function downloadVerified(url: string, destination: string, expected: string): Promise<Buffer> {
	if (existsSync(destination)) {
		const contents = await readFile(destination);
		if (sha256(contents) === expected) {
			return contents;
		}
	}
	const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
	if (!response.ok) {
		throw new Error(`Debugger build input download failed (${response.status})`);
	}
	const contents = Buffer.from(await response.arrayBuffer());
	if (sha256(contents) !== expected) {
		throw new Error('Debugger build input checksum mismatch');
	}
	await writeFile(destination, contents);
	return contents;
}

function run(command: string, args: string[], cwd: string): Promise<void> {
	return new Promise((resolveRun, reject) => {
		const child = spawn(command, args, {
			cwd, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd'),
			env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false', PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' }
		});
		child.on('error', reject);
		child.on('exit', code => code === 0 ? resolveRun() : reject(new Error(`Debugger build command failed (${code})`)));
	});
}

async function readNotices(contents: Buffer): Promise<Map<string, Buffer>> {
	return new Promise((resolveNotices, reject) => {
		fromBuffer(contents, { lazyEntries: true }, (error, zip) => {
			if (error || !zip) {
				reject(error ?? new Error('Could not read upstream debugger notices'));
				return;
			}
			const files = new Map<string, Buffer>();
			zip.on('error', reject);
			zip.on('end', () => resolveNotices(files));
			zip.on('entry', entry => {
				if (!['extension/LICENSE.txt', 'extension/ThirdPartyNotices.txt'].includes(entry.fileName)) {
					zip.readEntry();
					return;
				}
				zip.openReadStream(entry, (streamError, stream) => {
					if (streamError || !stream) {
						zip.close();
						reject(streamError ?? new Error('Could not read upstream debugger notice'));
						return;
					}
					const chunks: Buffer[] = [];
					stream.on('data', (chunk: Buffer) => chunks.push(chunk));
					stream.on('error', reject);
					stream.on('end', () => {
						files.set(entry.fileName.slice('extension/'.length), Buffer.concat(chunks));
						zip.readEntry();
					});
				});
			});
			zip.readEntry();
		});
	});
}

async function build(root: string, recipeHash: string): Promise<IArtifact> {
	const cache = join(root, '.build', 'codelad', 'js-debug');
	const directory = join(cache, recipeHash.slice(0, 16));
	const artifactPath = join(directory, 'source', 'dist', 'js-debug.vsix');
	const stampPath = join(directory, 'artifact.json');
	if (existsSync(stampPath) && existsSync(artifactPath)) {
		const stamp: IArtifact = JSON.parse(await readFile(stampPath, 'utf8'));
		if (stamp.recipeHash === recipeHash && sha256(await readFile(artifactPath)) === stamp.sha256) {
			return { path: artifactPath, sha256: stamp.sha256, recipeHash };
		}
	}
	await mkdir(cache, { recursive: true });
	const archivePath = join(cache, `${recipe.sourceCommit}.tar.gz`);
	await downloadVerified(`https://codeload.github.com/microsoft/vscode-js-debug/tar.gz/${recipe.sourceCommit}`, archivePath, recipe.sourceArchiveSha256);
	const upstreamVsix = await downloadVerified(`https://github.com/microsoft/vscode-js-debug/releases/download/v${recipe.upstreamVersion}/ms-vscode.js-debug.${recipe.upstreamVersion}.vsix`, join(cache, `upstream-${recipe.upstreamVersion}.vsix`), recipe.upstreamVsixSha256);
	const notices = await readNotices(upstreamVsix);
	if (!notices.get('LICENSE.txt')?.length || !notices.get('ThirdPartyNotices.txt')?.length) {
		throw new Error('Pinned upstream debugger is missing required notices');
	}
	// This directory contains only generated inputs for this build recipe.
	await rm(directory, { recursive: true, force: true });
	const source = join(directory, 'source');
	await mkdir(source, { recursive: true });
	await run('tar', ['-xzf', archivePath, '--strip-components=1', '-C', source], root);
	if (sha256(await readFile(join(source, 'package-lock.json'))) !== recipe.packageLockSha256) {
		throw new Error('Pinned debugger dependency lock changed');
	}
	// The pinned upstream postinstall downloads browsers/system dependencies; it is not needed to build.
	await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], source);
	for (const [name, expected] of Object.entries(recipe.replacements)) {
		const destination = join(source, 'src', 'telemetry', name);
		if (sha256(await readFile(destination)) !== expected) {
			throw new Error(`Debugger replacement input changed: ${name}`);
		}
		await copyFile(join(recipeDirectory, `${name}.txt`), destination);
	}
	const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
	if (`${manifest.publisher}.${manifest.name}` !== recipe.extensionId || manifest.version !== recipe.upstreamVersion) {
		throw new Error('Debugger source identity differs from the reviewed recipe');
	}
	delete manifest.dependencies['vscode-tas-client'];
	manifest.version = recipe.version;
	manifest._codeladBuildRecipeHash = recipeHash;
	assertNoTelemetryDependencies(manifest);
	await writeFile(join(source, 'package.json'), JSON.stringify(manifest, null, 2));
	const gulpPath = join(source, 'gulpfile.js');
	const gulpfile = await readFile(gulpPath, 'utf8');
	const esbuildDeclaration = `const esbuild = require('esbuild');`;
	if (sha256(gulpfile) !== recipe.gulpfileSha256 || !gulpfile.includes(esbuildDeclaration)) {
		throw new Error('Debugger bundler entrypoint changed');
	}
	const auditPath = fileURLToPath(new URL('./jsDebugPolicy.ts', import.meta.url));
	await writeFile(join(source, '.codelad-esbuild.cjs'), `
const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assertNoCollectorBundleInputs } = require(${JSON.stringify(auditPath)});
module.exports = { ...esbuild, async build(options) {
	const result = await esbuild.build({ ...options, metafile: true });
	const inputs = Object.keys(result.metafile.inputs);
	assertNoCollectorBundleInputs(inputs);
	const directory = path.join(__dirname, 'codelad-audit');
	fs.mkdirSync(directory, { recursive: true });
	const key = crypto.createHash('sha256').update(JSON.stringify(options.entryPoints)).digest('hex');
	fs.writeFileSync(path.join(directory, key + '.json'), JSON.stringify({ entryPoints: options.entryPoints, inputs }));
	delete result.metafile;
	return result;
} };
`);
	await writeFile(gulpPath, gulpfile.replace(esbuildDeclaration, `const esbuild = require('./.codelad-esbuild.cjs');`));
	const gulp = join(source, 'node_modules', 'gulp', 'bin', 'gulp.js');
	await run(process.execPath, [gulp, 'compile'], source);
	for (const [name, contents] of notices) {
		await writeFile(join(source, 'dist', name), contents);
	}
	await writeFile(join(source, 'dist', 'CodeladSource.json'), JSON.stringify({
		extensionId: recipe.extensionId, version: recipe.version, upstreamVersion: recipe.upstreamVersion,
		sourceCommit: recipe.sourceCommit, sourceArchiveSha256: recipe.sourceArchiveSha256,
		upstreamNoticesVsixSha256: recipe.upstreamVsixSha256, recipeHash,
		changes: 'Inert telemetry reporter and local experiment defaults; collector modules excluded from all bundler inputs.'
	}, null, 2));
	await run(process.execPath, [gulp, 'package:createVSIX'], source);
	const artifact = { path: artifactPath, sha256: sha256(await readFile(artifactPath)), recipeHash };
	await writeFile(stampPath, JSON.stringify(artifact, null, 2));
	return artifact;
}

/** Builds the pinned, audited Codelad derivative; concurrent callers share one build. */
export function ensureCodeladJsDebug(root: string): Promise<IArtifact> {
	const recipeHash = getJsDebugRecipeHash();
	const key = `${resolve(root)}:${recipeHash}`;
	let result = builds.get(key);
	if (!result) {
		result = build(resolve(root), recipeHash).catch(error => { builds.delete(key); throw error; });
		builds.set(key, result);
	}
	return result;
}

if (import.meta.main) {
	ensureCodeladJsDebug(fileURLToPath(new URL('../../', import.meta.url))).then(artifact => {
		console.log(JSON.stringify(artifact, null, 2));
	}, error => {
		console.error(error);
		process.exitCode = 1;
	});
}
