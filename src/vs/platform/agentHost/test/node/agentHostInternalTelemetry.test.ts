/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { AgentHostInternalTelemetrySender } from '../../node/agentHostMicrosoftTelemetry.js';

suite('AgentHostInternalTelemetrySender removed', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('internal accounts cannot initialize an appender or collect properties', () => {
		let appenders = 0;
		const sender = store.add(new AgentHostInternalTelemetrySender({
			createAppender: () => { appenders++; throw new Error('An internal telemetry appender must never be created'); },
			get commonProperties(): never { throw new Error('Common properties must not be collected'); }
		}));
		const context = { isInternal: true, trackingId: 'private-id', userName: 'private-user', isVscodeTeamMember: true };
		const properties = { get prompt(): never { throw new Error('Prompt must not be inspected'); } };
		sender.setContext(context);
		sender.send('event', properties);
		sender.sendForContext(context, 'event', properties);
		assert.strictEqual(appenders, 0);
	});
});
