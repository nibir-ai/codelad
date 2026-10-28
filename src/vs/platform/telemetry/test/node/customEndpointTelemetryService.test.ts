/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { mock } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { TestConfigurationService } from '../../../configuration/test/common/testConfigurationService.js';
import { IEnvironmentService } from '../../../environment/common/environment.js';
import { ILoggerService } from '../../../log/common/log.js';
import { IProductService } from '../../../product/common/productService.js';
import { NullTelemetryService } from '../../common/telemetryUtils.js';
import { CustomEndpointTelemetryService } from '../../node/customEndpointTelemetryService.js';

suite('CustomEndpointTelemetryService', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('product opt-out returns before reading endpoint credentials or starting a collector', () => {
		const product = new class extends mock<IProductService>() {
			override readonly enableTelemetry = false;
		};
		const service = new CustomEndpointTelemetryService(
			new TestConfigurationService({ 'telemetry.telemetryLevel': 'all' }),
			NullTelemetryService,
			new class extends mock<ILoggerService>() { },
			new class extends mock<IEnvironmentService>() { },
			product
		);
		const endpoint = {
			get id(): string { throw new Error('Endpoint must not be read when telemetry is disabled'); },
			get aiKey(): string { throw new Error('Endpoint key must not be read when telemetry is disabled'); },
			sendErrorTelemetry: true
		};
		assert.doesNotThrow(() => {
			service.publicLog(endpoint, 'usage');
			service.publicLogError(endpoint, 'error');
		});
	});
});
