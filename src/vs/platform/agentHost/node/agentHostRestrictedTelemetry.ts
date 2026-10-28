/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ILogService } from '../../log/common/log.js';
import { ICommonProperties } from '../../telemetry/common/telemetry.js';

export type TelemetryProps = Record<string, string | undefined>;
export type TelemetryMeasurements = Record<string, number | undefined>;

export interface IAgentHostInternalTelemetryContext {
	readonly isInternal: boolean;
	readonly trackingId: string | undefined;
	readonly userName: string | undefined;
	readonly isVscodeTeamMember: boolean;
}

export interface IAgentHostRestrictedTelemetryContext extends IAgentHostInternalTelemetryContext {
	readonly restrictedTelemetryEnabled: boolean;
	readonly telemetryEndpoint: string | undefined;
	/** Whether content exclusion is enabled; undefined when account discovery could not determine it. */
	readonly copilotIgnoreEnabled?: boolean;
}

export interface IAgentHostInternalTelemetrySink {
	setContext(context: IAgentHostInternalTelemetryContext | undefined): void;
	send(eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
	sendForContext(context: IAgentHostInternalTelemetryContext, eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
}

/** The subset of the global `fetch` used to POST envelopes; injectable so tests avoid live network calls. */
export type FetchFn = typeof globalThis.fetch;

/** Telemetry payload processing has been removed along with the transports. */
export async function multiplexProperties(_properties: TelemetryProps): Promise<TelemetryProps> { return {}; }

export interface IAgentHostRestrictedTelemetry {
	/** GH standard (non-restricted) telemetry -> `copilot_v0_copilot_event`. */
	sendGHTelemetryEvent(eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
	/** GH enhanced/restricted telemetry (prompts, tools, etc.) -> `copilot_v0_restricted_copilot_event`. */
	sendEnhancedGHTelemetryEvent(eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
	/** GH enhanced telemetry attributed and routed using an immutable per-session context. */
	sendEnhancedGHTelemetryEventForContext(context: IAgentHostRestrictedTelemetryContext, eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
	/** MSFT-internal telemetry -> Aria/Collector++ (internal-only table). No-op without an internal key. */
	sendInternalMSFTTelemetryEvent(eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
	/** MSFT-internal telemetry attributed using an immutable per-session context. */
	sendInternalMSFTTelemetryEventForContext(context: IAgentHostInternalTelemetryContext, eventName: string, properties?: TelemetryProps, measurements?: TelemetryMeasurements): void;
	/** Sets the Copilot user tracking id (`copilot_trackingId`) carried on every subsequent event. */
	setCopilotTrackingId(trackingId: string | undefined): void;
	/** Adds or removes a property carried on every subsequent event, mirroring `ITelemetryService.setCommonProperty`. */
	setCommonProperty(name: string, value: string | boolean | undefined): void;
	/** Overrides the POST endpoint with the user's CAPI `endpoints.telemetry`; falsy restores the default. */
	setRestrictedTelemetryEndpoint(endpointUrl: string | undefined): void;
	/** Enables enhanced GH telemetry once the authenticated account opts in; off by default and on flip/logout. */
	setRestrictedTelemetryEnabled(enabled: boolean): void;
	/** Sets the internal-user identity and enables the internal sink only for staff accounts. */
	setInternalTelemetryContext(context: IAgentHostInternalTelemetryContext | undefined): void;
}

/** Inert agent-host compatibility seam. No endpoint, identity, payload, sink or fetch callback is read or retained. */
export class AgentHostRestrictedTelemetrySender implements IAgentHostRestrictedTelemetry {
	constructor(_commonProperties: ICommonProperties, _logService: ILogService, _endpointUrl?: string, _internalSink?: IAgentHostInternalTelemetrySink, _fetchFn?: FetchFn) { }
	sendGHTelemetryEvent(_name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
	sendEnhancedGHTelemetryEvent(_name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
	sendEnhancedGHTelemetryEventForContext(_context: IAgentHostRestrictedTelemetryContext, _name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
	sendInternalMSFTTelemetryEvent(_name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
	sendInternalMSFTTelemetryEventForContext(_context: IAgentHostInternalTelemetryContext, _name: string, _properties?: TelemetryProps, _measurements?: TelemetryMeasurements): void { }
	setCopilotTrackingId(_trackingId: string | undefined): void { }
	setCommonProperty(_name: string, _value: string | boolean | undefined): void { }
	setRestrictedTelemetryEndpoint(_endpointUrl: string | undefined): void { }
	setRestrictedTelemetryEnabled(_enabled: boolean): void { }
	setInternalTelemetryContext(_context: IAgentHostInternalTelemetryContext | undefined): void { }
}
