/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { mock } from '../../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { INativeEnvironmentService } from '../../../../environment/common/environment.js';
import { NullLogService } from '../../../../log/common/log.js';
import { AgentHostOTelService } from '../../../node/otel/agentHostOTelService.js';

suite('AgentHostOTelService removed', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('environment variables cannot initialize a receiver, exporter or identity collection', async () => {
		let requests = 0;
		const service = store.add(new AgentHostOTelService({
			env: { COPILOT_OTEL_ENABLED: 'true', COPILOT_OTEL_DB_SPAN_EXPORTER_ENABLED: 'true', COPILOT_OTEL_CAPTURE_IDENTITY: 'true', OTEL_EXPORTER_OTLP_ENDPOINT: 'https://collector.invalid', COPILOT_OTEL_FILE_EXPORTER_PATH: 'private-traces.jsonl' },
			fetchFn: async () => { requests++; throw new Error('No requests allowed'); },
			readOSUsername: () => { throw new Error('No identity reads allowed'); },
			readHostname: () => { throw new Error('No host reads allowed'); }
		}, new NullLogService(), new class extends mock<INativeEnvironmentService>() { }));
		service.emitSessionTitleChanged('session', 'private-uri', 'private-title');
		service.setSessionComparisonMetadata('session', { get id(): never { throw new Error('No metadata reads allowed'); }, role: 'attempt', attemptCount: 1 });
		await service.flush();
		assert.deepStrictEqual({
			enabled: service.enabled, diagnosticsEnabled: service.diagnosticsEnabled, requests,
			sdk: await service.getSdkTelemetryConfig(), native: await service.getNativeSdkTelemetryConfig(),
			context: service.getSessionTraceContext('session', 'private-uri'), database: service.getSpansDbPath()
		}, { enabled: false, diagnosticsEnabled: false, requests: 0, sdk: undefined, native: undefined, context: undefined, database: undefined });
	});

	test('provider operations still run without retaining a trace context', async () => {
		const service = store.add(new AgentHostOTelService(undefined, new NullLogService(), new class extends mock<INativeEnvironmentService>() { }));
		const result = await service.withTraceContext({ traceId: 'ignored', spanId: 'ignored', traceparent: 'ignored' }, async () => 'provider-result');
		assert.deepStrictEqual([result, service.getCurrentTraceContext()], ['provider-result', undefined]);
	});
});
