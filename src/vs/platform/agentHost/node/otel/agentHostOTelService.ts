/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { INativeEnvironmentService } from '../../../environment/common/environment.js';
import { ILogService } from '../../../log/common/log.js';
import { IAgentHostOTelService, NullAgentHostOTelService } from '../../common/otel/agentHostOTelService.js';

/** Removed collector: no receivers, exporters, span databases, identity reads or content capture. */
export class AgentHostOTelService extends Disposable implements IAgentHostOTelService {
	declare readonly _serviceBrand: undefined;
	readonly enabled = false;
	readonly diagnosticsEnabled = false;
	readonly emitTurnTiming = NullAgentHostOTelService.emitTurnTiming;
	readonly emitFirstResponse = NullAgentHostOTelService.emitFirstResponse;
	readonly emitUserInteraction = NullAgentHostOTelService.emitUserInteraction;
	readonly getSdkTelemetryConfig = NullAgentHostOTelService.getSdkTelemetryConfig;
	readonly getNativeSdkTelemetryConfig = NullAgentHostOTelService.getNativeSdkTelemetryConfig;
	readonly getSessionTraceContext = NullAgentHostOTelService.getSessionTraceContext;
	readonly setSessionComparisonMetadata = NullAgentHostOTelService.setSessionComparisonMetadata;
	readonly releaseSessionTraceContext = NullAgentHostOTelService.releaseSessionTraceContext;
	readonly withTraceContext = NullAgentHostOTelService.withTraceContext;
	readonly getCurrentTraceContext = NullAgentHostOTelService.getCurrentTraceContext;
	readonly getSpansDbPath = NullAgentHostOTelService.getSpansDbPath;
	readonly emitSessionTitleChanged = NullAgentHostOTelService.emitSessionTitleChanged;
	readonly flush = NullAgentHostOTelService.flush;

	constructor(
		_options: { readonly env?: NodeJS.ProcessEnv; readonly fetchFn?: typeof globalThis.fetch; readonly readOSUsername?: () => string; readonly readHostname?: () => string } | undefined,
		@ILogService _logService: ILogService,
		@INativeEnvironmentService _environmentService: INativeEnvironmentService,
	) {
		super();
	}
}
