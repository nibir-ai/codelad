/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { TestConfigurationService } from '../../../configuration/test/common/testConfigurationService.js';
import product from '../../../product/common/product.js';
import { TelemetryLevel } from '../../common/telemetry.js';
import { TelemetryService } from '../../common/telemetryService.js';

suite('TelemetryService', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('collection stays removed for every product, setting and injected telemetry level', () => {
		let appenderCalls = 0;
		const appender = { log: () => { appenderCalls++; }, flush: async () => { appenderCalls++; } };
		const states = [];
		for (const enableTelemetry of [false, true]) {
			for (const level of [TelemetryLevel.NONE, TelemetryLevel.CRASH, TelemetryLevel.ERROR, TelemetryLevel.USAGE]) {
				const service = TelemetryService.createWithLevel({ appenders: [appender], telemetryLevel: level, sendErrorTelemetry: true, waitForExperimentProperties: true }, { _serviceBrand: undefined, ...product, enableTelemetry });
				service.publicLog('usage', { file: 'private-file' });
				service.publicLogError('error', { credential: 'private-value' });
				service.setExperimentProperty('experiment', 'assignment');
				service.setCommonProperty('machine', 'private-id');
				states.push([service.telemetryLevel, service.sendErrorTelemetry, service.sessionId, service.machineId]);
				service.dispose();
			}
		}
		assert.deepStrictEqual({ appenderCalls, states }, { appenderCalls: 0, states: Array.from({ length: 8 }, () => [TelemetryLevel.NONE, false, '', '']) });
	});

	test('construction does not inspect identifiers, user paths or common properties', () => {
		const service = new TelemetryService({
			appenders: [],
			get commonProperties(): never { throw new Error('Common properties must not be collected'); },
			get piiPaths(): never { throw new Error('User paths must not be read'); }
		}, new TestConfigurationService({ 'telemetry.telemetryLevel': 'all' }), { _serviceBrand: undefined, ...product });
		assert.deepStrictEqual([service.telemetryLevel, service.sqmId, service.devDeviceId, service.firstSessionDate], [TelemetryLevel.NONE, '', '', '']);
		service.dispose();
	});
});
