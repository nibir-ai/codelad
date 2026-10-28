/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { OneDataSystemWebAppender } from '../../browser/1dsAppender.js';

suite('Telemetry transport removed', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('instrumentation keys and injected factories cannot initialize a collector', async () => {
		let factoryCalls = 0;
		const factory = () => { factoryCalls++; throw new Error('A telemetry collector must never be initialized'); };
		for (const destination of ['ignored-instrumentation-key', factory]) {
			const appender = new OneDataSystemWebAppender(true, 'test', null, destination);
			appender.log('usage', { file: 'private-file' });
			await appender.flush();
		}
		assert.strictEqual(factoryCalls, 0);
	});
});
