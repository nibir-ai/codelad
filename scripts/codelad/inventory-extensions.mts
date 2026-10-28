/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

interface IManifest {
	readonly publisher?: string;
	readonly name: string;
	readonly version: string;
	readonly license?: string;
	readonly dependencies?: Record<string, string>;
	readonly activationEvents?: readonly string[];
}

const { values } = parseArgs({ options: {
	'extensions-root': { type: 'string', default: 'extensions' },
	output: { type: 'string' }
} });
const root = resolve(values['extensions-root']);
const entries = readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).flatMap(entry => {
	const directory = join(root, entry.name);
	const manifestFile = join(directory, 'package.json');
	if (!existsSync(manifestFile)) {
		return [];
	}
	const manifest: IManifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
	return [{
		id: `${manifest.publisher ?? '(unspecified)'}.${manifest.name}`,
		version: manifest.version,
		manifest: relative(root, manifestFile).replaceAll('\\', '/'),
		declaredLicense: manifest.license ?? '(unspecified; review root license and extension notices)',
		licenseFiles: readdirSync(directory).filter(file => /^(license|thirdpartynotices|notice)(\.|$)/i.test(file)),
		telemetryDependencies: Object.keys(manifest.dependencies ?? {}).filter(name => /telemetry|applicationinsights|1ds|tas-client|statsig/i.test(name)).sort(),
		explicitActivationEvents: manifest.activationEvents ?? []
	}];
}).sort((a, b) => a.id.localeCompare(b.id));

const report = JSON.stringify({
	scope: 'Manifest inventory only. Does not establish license compliance, absence of networking, or which extensions a packaged artifact includes. Run again against the final packaged extensions folder.',
	extensions: entries
}, null, '\t') + '\n';
if (values.output) {
	writeFileSync(resolve(values.output), report);
	console.log(`Inventoried ${entries.length} extension manifests.`);
} else {
	console.log(report);
}
