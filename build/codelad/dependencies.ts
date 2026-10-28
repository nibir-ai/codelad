/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

interface IDependencyManifest {
	readonly name?: string;
	readonly publisher?: string;
	readonly dependencies?: Readonly<Record<string, string>>;
	readonly optionalDependencies?: Readonly<Record<string, string>>;
}

const removedPackages = new Set(['@microsoft/1ds-core-js', '@microsoft/1ds-post-js', '@vscode/deviceid', '@vscode/extension-telemetry', 'vscode-tas-client', 'tas-client', 'applicationinsights']);

/** Guards direct runtime dependency regressions; does not replace a transitive or runtime audit. */
export function assertNoTelemetryDependencies(manifest: IDependencyManifest): void {
	const prohibited = [...new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.optionalDependencies ?? {})])].filter(name => removedPackages.has(name));
	if (prohibited.length) {
		throw new Error(`Removed telemetry dependencies reintroduced: ${prohibited.sort().join(', ')}`);
	}
}

/** Checks source manifests used by the desktop, server, web and included built-in extensions. */
export function assertCodeladDependencyManifests(root: string, skippedExtensions: readonly string[]): void {
	const readManifest = (file: string): IDependencyManifest => JSON.parse(readFileSync(file, 'utf8'));
	for (const file of ['package.json', 'remote/package.json', 'remote/web/package.json']) {
		assertNoTelemetryDependencies(readManifest(join(root, file)));
	}
	const skipped = new Set(skippedExtensions.map(id => id.toLowerCase()));
	const extensionsRoot = join(root, 'extensions');
	for (const directory of readdirSync(extensionsRoot, { withFileTypes: true })) {
		const file = join(extensionsRoot, directory.name, 'package.json');
		if (!directory.isDirectory() || !existsSync(file)) {
			continue;
		}
		const manifest = readManifest(file);
		if (!skipped.has(`${manifest.publisher}.${manifest.name}`.toLowerCase())) {
			assertNoTelemetryDependencies(manifest);
		}
	}
}
