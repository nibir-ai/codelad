/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as sinon from 'sinon';
import * as vscode from 'vscode';
import TelemetryReporter from '@codelad/no-telemetry';
import { ExperimentationTelemetry } from '../common/experimentationService';
import { createTestExtensionContext } from './testExtensionContext';
import { TestSecretStorage } from './testSecretStorage';

suite('GitHub authentication telemetry privacy', () => {
	teardown(() => sinon.restore());

	test('disabled telemetry does not initialize experiments or send events', async () => {
		sinon.stub(vscode.env, 'isTelemetryEnabled').value(false);
		const reporter = sinon.createStubInstance(TelemetryReporter);
		const secrets = new TestSecretStorage();
		const subscriptions: vscode.Disposable[] = [];
		const context = createTestExtensionContext(subscriptions, secrets);
		Object.defineProperty(context, 'extension', { get: () => { throw new Error('Experiment initialization must not read the extension when telemetry is disabled'); } });
		const telemetry = new ExperimentationTelemetry(context, reporter);
		try {
			await telemetry.sendTelemetryEvent('usage');
			await telemetry.sendTelemetryErrorEvent('error');
			sinon.assert.notCalled(reporter.sendTelemetryEvent);
			sinon.assert.notCalled(reporter.sendTelemetryErrorEvent);
		} finally {
			await telemetry.dispose();
			secrets.dispose();
			for (const subscription of subscriptions) {
				subscription.dispose();
			}
		}
	});
});
