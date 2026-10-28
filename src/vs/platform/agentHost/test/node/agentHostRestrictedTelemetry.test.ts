/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { NullLogService } from '../../../log/common/log.js';
import { AgentHostRestrictedTelemetrySender, multiplexProperties, type FetchFn } from '../../node/agentHostRestrictedTelemetry.js';

suite('AgentHostRestrictedTelemetrySender removed', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('enabling restricted or internal telemetry cannot inspect or upload content', async () => {
		let requests = 0;
		const fetch: FetchFn = async () => { requests++; throw new Error('No telemetry request may be created'); };
		const properties = { get prompt(): never { throw new Error('Prompt must not be inspected'); } };
		const sender = new AgentHostRestrictedTelemetrySender({ get sessionID(): never { throw new Error('Identity must not be collected'); } }, new NullLogService(), 'https://example.invalid', undefined, fetch);
		const context = { restrictedTelemetryEnabled: true, telemetryEndpoint: 'https://example.invalid', isInternal: true, trackingId: 'private-id', userName: 'private-user', isVscodeTeamMember: true };
		sender.setRestrictedTelemetryEnabled(true);
		sender.setRestrictedTelemetryEndpoint('https://example.invalid');
		sender.setInternalTelemetryContext(context);
		sender.setCopilotTrackingId('private-id');
		sender.setCommonProperty('private', 'value');
		sender.sendGHTelemetryEvent('event', properties);
		sender.sendEnhancedGHTelemetryEvent('event', properties);
		sender.sendEnhancedGHTelemetryEventForContext(context, 'event', properties);
		sender.sendInternalMSFTTelemetryEvent('event', properties);
		sender.sendInternalMSFTTelemetryEventForContext(context, 'event', properties);
		assert.deepStrictEqual({ requests, processed: await multiplexProperties(properties) }, { requests: 0, processed: {} });
	});
});
