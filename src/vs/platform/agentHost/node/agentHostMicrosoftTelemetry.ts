/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import type { IRequestService } from '../../request/common/request.js';
import type { ICommonProperties } from '../../telemetry/common/telemetry.js';
import type { IAgentHostInternalTelemetryContext, IAgentHostInternalTelemetrySink, TelemetryMeasurements, TelemetryProps } from './agentHostRestrictedTelemetry.js';

interface IInternalTelemetryAppender {
	log(eventName: string, data?: object): void;
	flush(): Promise<void>;
}

interface IAgentHostInternalTelemetrySenderOptions {
	readonly requestService?: IRequestService;
	readonly commonProperties?: ICommonProperties;
	readonly extensionVersion?: string;
	readonly createAppender?: (requestService: IRequestService | undefined, commonProperties: ICommonProperties | undefined, eventPrefix: string) => IInternalTelemetryAppender;
}

/** Internal Microsoft telemetry has been removed. Retains the caller-facing lifetime and methods only. */
export class AgentHostInternalTelemetrySender extends Disposable implements IAgentHostInternalTelemetrySink {
	constructor(_options: IAgentHostInternalTelemetrySenderOptions = {}) { super(); }
	setContext(_context: IAgentHostInternalTelemetryContext | undefined): void { }
	send(_name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
	sendForContext(_context: IAgentHostInternalTelemetryContext, _name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
}
