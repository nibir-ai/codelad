/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { removedTelemetryPackages } from './dependencies.ts';

/** Rejects known collector modules in bundler inputs without printing local build paths. */
export function assertNoCollectorBundleInputs(inputs: readonly string[]): void {
	const prohibited = new Set<string>();
	for (const input of inputs) {
		const segments = input.replaceAll('\\', '/').split('/');
		for (let index = 0; index < segments.length - 1; index++) {
			if (segments[index] !== 'node_modules') {
				continue;
			}
			const name = segments[index + 1].startsWith('@') ? `${segments[index + 1]}/${segments[index + 2]}` : segments[index + 1];
			if (removedTelemetryPackages.has(name)) {
				prohibited.add(name);
			}
		}
	}
	if (prohibited.size) {
		throw new Error(`Collector modules included in debugger bundle: ${[...prohibited].sort().join(', ')}`);
	}
}
