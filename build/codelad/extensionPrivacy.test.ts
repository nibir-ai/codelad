/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { getExperimentationService, TargetPopulation, TelemetryReporter } from './no-telemetry/src/index.mts';

test('built compatibility adapter loads in ESM and CommonJS extension hosts', async () => {
	const esm = await import(new URL('./no-telemetry/out/index.js', import.meta.url).href) as typeof import('./no-telemetry/src/index.mts');
	const commonjs = createRequire(import.meta.url)('./no-telemetry/out/index.cjs') as typeof esm;
	assert.deepStrictEqual([new esm.TelemetryReporter().telemetryLevel, new commonjs.default().telemetryLevel], ['off', 'off']);
});

test('built-in compatibility reporter never inspects event or error payloads', async () => {
	const reporter = new TelemetryReporter('ignored-key');
	const payload = { get path(): never { throw new Error('Payload must not be collected'); } };
	reporter.sendTelemetryEvent('usage', payload);
	reporter.sendRawTelemetryEvent('raw', payload);
	reporter.sendDangerousTelemetryEvent('dangerous', payload);
	reporter.sendTelemetryErrorEvent('error', payload);
	reporter.sendDangerousTelemetryErrorEvent('dangerous-error', payload);
	await reporter.dispose();
	assert.strictEqual(reporter.telemetryLevel, 'off');
});

test('removed extension experiments never read state or call their telemetry hooks', async () => {
	const service = getExperimentationService('ignored-id', '0.0.0', TargetPopulation.Public, {
		setSharedProperty: () => { throw new Error('No metadata should be recorded'); },
		postEvent: () => { throw new Error('No events should be emitted'); }
	}, { get secret(): never { throw new Error('User state must not be read'); } });
	await service.initialFetch;
	await service.initializePromise;
	assert.deepStrictEqual([service.getTreatmentVariable('config', 'feature'), await service.getTreatmentVariableAsync('config', 'feature', true)], [undefined, undefined]);
});
