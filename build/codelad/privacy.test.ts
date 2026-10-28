/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertCodeladPrivacy } from './privacy.ts';
import { fileURLToPath } from 'node:url';
import { assertCodeladDependencyManifests, assertNoTelemetryDependencies } from './dependencies.ts';

const product = JSON.parse(readFileSync(new URL('../../product.json', import.meta.url), 'utf8'));

test('source product satisfies the distribution privacy policy', () => {
	assert.doesNotThrow(() => assertCodeladPrivacy(product));
});

test('desktop, server, web and included built-ins do not depend on the removed telemetry SDKs', () => {
	assertCodeladDependencyManifests(fileURLToPath(new URL('../../', import.meta.url)), product.skipBuiltinExtensions);
});

test('direct runtime collector dependencies are rejected without inspecting version strings', () => {
	for (const section of ['dependencies', 'optionalDependencies']) {
		for (const name of ['@microsoft/1ds-core-js', '@microsoft/1ds-post-js', '@vscode/deviceid', '@vscode/extension-telemetry', 'vscode-tas-client', 'tas-client', 'applicationinsights']) {
			assert.throws(() => assertNoTelemetryDependencies({ [section]: { [name]: 'SECRET' } }), error => error instanceof Error && error.message.includes(name) && !error.message.includes('SECRET'));
		}
	}
});

test('recorded downloaded debugger is rejected while the other pinned extension inventories pass', () => {
	const inventory: { extensions: { id: string; telemetryDependencies: string[] }[] } = JSON.parse(readFileSync(new URL('../../docs/codelad/downloaded-extension-inventory.json', import.meta.url), 'utf8'));
	const rejected: string[] = [];
	for (const extension of inventory.extensions) {
		try {
			assertNoTelemetryDependencies({ dependencies: Object.fromEntries(extension.telemetryDependencies.map(name => [name, 'inventory-only'])) });
		} catch {
			rejected.push(extension.id);
		}
	}
	assert.deepStrictEqual(rejected, ['ms-vscode.js-debug']);
});

test('distribution mixins cannot enable collectors, experiments, updates or cloud bindings', () => {
	for (const key of ['aiConfig', 'appCenter', 'tasConfig', 'voiceWsUrl', 'defaultChatAgent', 'settingsSearchUrl', 'surveys', 'updateUrl', 'webviewContentExternalBaseUrlTemplate', 'configurationSync.store']) {
		assert.throws(() => assertCodeladPrivacy({ ...product, [key]: {} }), /privacy configuration rejected/);
	}
});

test('distribution mixins cannot re-enable telemetry or identifying gallery headers', () => {
	for (const override of [{ enableTelemetry: true }, { removeTelemetryMachineId: false }, { enabledTelemetryLevels: { error: true, usage: false } }, { skipBuiltinExtensions: [] }]) {
		assert.throws(() => assertCodeladPrivacy({ ...product, ...override }), /privacy configuration rejected/);
	}
});

test('gallery overrides cannot redirect to another origin or leak credentials in errors', () => {
	for (const key of ['serviceUrl', 'resourceUrlTemplate', 'controlUrl', 'extensionUrlTemplate', 'nlsBaseUrl', 'itemUrl']) {
		assert.throws(() => assertCodeladPrivacy({ ...product, extensionsGallery: { ...product.extensionsGallery, [key]: 'https://user:SECRET@example.invalid' } }), error =>
			error instanceof Error && error.message.includes(`extensionsGallery.${key}`) && !error.message.includes('SECRET'));
	}
});
