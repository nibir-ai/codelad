/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { AgentHostTimingAttributePrefix, agentHostTimingAttributes, type IAgentHostTurnTimingDiagnostic } from '../../../common/otel/agentHostTiming.js';

suite('Agent Host local timing attributes', () => {
	ensureNoDisposablesAreLeakedInTestSuite();
	const prefix = AgentHostTimingAttributePrefix;
	const host: IAgentHostTurnTimingDiagnostic = {
		provider: 'mock', turnId: 'request-1', agentSessionId: 'session-1', chatId: 'default',
		isSubagentSession: false, result: 'success', totalTime: 42,
		sendStageWorkingDirectoryMs: 0, sendStageCheckpointMs: 3,
		timeToProviderDispatch: 8, timeToFirstProgress: 12, timeToFirstSubstantiveProgress: 15,
		hostRootTurnOrdinal: 1, hostProcessAgeMs: 100, titleGenerationStrategy: 'deferred',
	};

	test('allowlists diagnostics, preserves zero, and omits unknown or invalid measurements', () => {
		const attributes = agentHostTimingAttributes({
			...host, agentSessionId: 'file:///private/workspace', chatId: '../private',
			sendStageAttachmentsMs: NaN, timeToFirstProgress: Infinity, hostProcessAgeMs: -1,
			prompt: 'private content', inputTokens: 99,
		} as IAgentHostTurnTimingDiagnostic, 'host')!;
		assert.deepStrictEqual({
			zero: attributes[`${prefix}sendStageWorkingDirectoryMs`],
			absent: ['agentSessionId', 'chatId', 'sendStageModelSelectionMs', 'sendStageAttachmentsMs', 'timeToFirstProgress', 'hostProcessAgeMs', 'prompt', 'inputTokens'].filter(key => attributes[`${prefix}${key}`] !== undefined),
			invalidJoin: agentHostTimingAttributes({ ...host, turnId: 'file:///private' }, 'host'),
		}, { zero: 0, absent: [], invalidJoin: undefined });
	});

});
