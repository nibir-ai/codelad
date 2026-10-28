/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { assertJsDebugDefinition } from './buildJsDebug.ts';
import { assertNoCollectorBundleInputs } from './jsDebugPolicy.ts';

function loadReplacement<T>(name: string): T {
	const source = readFileSync(new URL(`./js-debug/${name}.ts.txt`, import.meta.url), 'utf8');
	const { code } = transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2022', tsconfigRaw: { compilerOptions: { experimentalDecorators: true } } });
	const module = { exports: {} };
	runInNewContext(code, {
		module, exports: module.exports,
		require: (id: string) => {
			if (id === 'inversify') {
				return { injectable: () => (constructor: object) => constructor, inject: () => () => { } };
			}
			if (id === '../ioc-extras') {
				return { IsVSCode: Symbol('IsVSCode') };
			}
			throw new Error('Unexpected runtime dependency in debugger replacement');
		},
		setTimeout: () => { throw new Error('No telemetry timers may start'); },
		fetch: () => { throw new Error('No experiment request may start'); }
	});
	return module.exports as T;
}

test('debugger reporter never reads payloads, emits DAP output or flushes collection callbacks', () => {
	const { DapTelemetryReporter } = loadReplacement<{ DapTelemetryReporter: new () => {
		report(name: string, data: object): void;
		reportOperation(name: string, method: string, duration: number, error: Error): void;
		attachDap(dap: object): void;
		pushOutput(event: object): void;
		setGlobalMetric(name: string, value: string): void;
		onFlush(listener: () => void): { dispose(): void };
		flush(): void;
		dispose(): void;
	}; }>('dapTelemetryReporter');
	const reporter = new DapTelemetryReporter();
	const privatePayload = { get data(): never { throw new Error('Private payload inspected'); } };
	let flushed = false;
	const subscription = reporter.onFlush(() => { flushed = true; });
	reporter.report('launch', privatePayload);
	reporter.reportOperation('dapOperation', 'launch', 1, new Error('private error'));
	reporter.attachDap({ get output(): never { throw new Error('DAP transport inspected'); } });
	reporter.pushOutput(privatePayload);
	reporter.setGlobalMetric('privateMetric', 'privateValue');
	reporter.flush();
	subscription.dispose();
	reporter.dispose();
	assert.strictEqual(flushed, false);
});

test('debugger experiments keep both enabled and disabled local defaults without importing TAS', async () => {
	const { VSCodeExperimentationService } = loadReplacement<{ VSCodeExperimentationService: new () => {
		getTreatment(name: string, defaultValue: boolean): Promise<boolean>;
		dispose(): void;
	}; }>('vscodeExperimentationService');
	const experiments = new VSCodeExperimentationService();
	assert.deepStrictEqual(await Promise.all([experiments.getTreatment('diagnosticPrompt', true), experiments.getTreatment('diagnosticPrompt', false)]), [true, false]);
	experiments.dispose();
});

test('bundler audit rejects nested and Windows collector paths without exposing private directories', () => {
	for (const input of ['PRIVATE_PATH/node_modules/vscode-tas-client/out/index.js', 'C:\\PRIVATE_PATH\\node_modules\\nested\\node_modules\\@microsoft\\1ds-core-js\\index.js', 'node_modules/tas-client/index.js']) {
		assert.throws(() => assertNoCollectorBundleInputs([input]), error => error instanceof Error && error.message.includes('Collector modules') && !error.message.includes('PRIVATE_PATH'));
	}
	assert.doesNotThrow(() => assertNoCollectorBundleInputs(['src/telemetry/dapTelemetryReporter.ts', 'node_modules/acorn/dist/acorn.js', 'src/applicationinsights.ts', 'node_modules/vscode-tas-client-compatible/index.js']));
});

test('product selects the reviewed source derivative and cannot relabel its inputs', () => {
	const product = JSON.parse(readFileSync(new URL('../../product.json', import.meta.url), 'utf8'));
	const definition = product.builtInExtensions.find((extension: { name: string }) => extension.name === 'ms-vscode.js-debug');
	assertJsDebugDefinition(definition);
	for (const override of [{ codeladSource: undefined }, { name: 'other.extension' }, { version: '1.140.0' }, { sha256: 'unreviewed' }]) {
		assert.throws(() => assertJsDebugDefinition({ ...definition, ...override }), /differs from the reviewed source recipe/);
	}
});
