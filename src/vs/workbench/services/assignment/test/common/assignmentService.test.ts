/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { WorkbenchAssignmentService } from '../../common/assignmentService.js';

suite('WorkbenchAssignmentService without remote experiments', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('explicit local overrides do not create or claim remote assignments', async () => {
		const configuration = new TestConfigurationService({ experiments: { override: { enabled: false, count: 0, label: '' } } });
		store.add(configuration.onDidChangeConfigurationEmitter);
		const service = store.add(new WorkbenchAssignmentService(configuration));
		const results = [];
		for (const name of ['enabled', 'count', 'label', 'absent']) {
			const treatment = await service.getTreatmentWithAssignment(name);
			results.push([treatment.value, await treatment.hasAssignment]);
		}
		assert.deepStrictEqual({ results, experiments: await service.getCurrentExperiments() }, {
			results: [[false, false], [0, false], ['', false], [undefined, false]], experiments: undefined
		});
	});

	test('telemetry filters are not inspected or retained', () => {
		const configuration = new TestConfigurationService();
		store.add(configuration.onDidChangeConfigurationEmitter);
		const service = store.add(new WorkbenchAssignmentService(configuration));
		assert.doesNotThrow(() => service.addTelemetryAssignmentFilter({
			get id(): string { throw new Error('No assignment metadata should be read'); },
			exclude: () => { throw new Error('No assignment filter should run'); },
			get onDidChange(): never { throw new Error('No assignment listener should be registered'); }
		}));
	});
});
