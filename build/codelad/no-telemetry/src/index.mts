/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface TelemetryEventProperties {
	readonly [key: string]: string | { readonly value: string } | undefined;
}

export interface TelemetryEventMeasurements {
	readonly [key: string]: number | undefined;
}

export interface ReplacementOption {
	lookup: RegExp;
	replacementString?: string;
}

/** Inert compatibility API for built-in extensions. No SDK, transport, identifiers or payload storage. */
export class TelemetryReporter {
	readonly telemetryLevel = 'off';
	readonly onDidChangeTelemetryLevel = (_listener: (level: 'all' | 'error' | 'crash' | 'off') => void) => ({ dispose() { } });
	constructor(_key?: string, _replacementOptions?: readonly ReplacementOption[]) { }
	sendTelemetryEvent(_name: string, _properties?: TelemetryEventProperties, _measurements?: TelemetryEventMeasurements): void { }
	sendRawTelemetryEvent(_name: string, _properties?: TelemetryEventProperties, _measurements?: TelemetryEventMeasurements): void { }
	sendDangerousTelemetryEvent(_name: string, _properties?: TelemetryEventProperties, _measurements?: TelemetryEventMeasurements): void { }
	sendTelemetryErrorEvent(_name: string, _properties?: TelemetryEventProperties, _measurements?: TelemetryEventMeasurements): void { }
	sendDangerousTelemetryErrorEvent(_name: string, _properties?: TelemetryEventProperties, _measurements?: TelemetryEventMeasurements): void { }
	async dispose(): Promise<void> { }
}

export default TelemetryReporter;

export const TargetPopulation = { Public: 'public', Insiders: 'insider', Internal: 'internal', Team: 'team' } as const;
export type TargetPopulation = typeof TargetPopulation[keyof typeof TargetPopulation];

export interface IExperimentationTelemetry {
	setSharedProperty(name: string, value: string): void;
	postEvent(eventName: string, properties: Map<string, string>): void;
}

export interface IExperimentationService {
	readonly initialFetch: Promise<void>;
	readonly initializePromise: Promise<void>;
	getTreatmentVariable<T extends string | number | boolean>(configId: string, name: string): T | undefined;
	getTreatmentVariableAsync<T extends string | number | boolean>(configId: string, name: string, checkCache?: boolean): Promise<T | undefined>;
}

/** Keeps extension defaults intact without contacting an experiment service or reading user state. */
export function getExperimentationService(_id: string, _version: string, _population: TargetPopulation, _reporter: IExperimentationTelemetry, _state: object): IExperimentationService {
	return {
		initialFetch: Promise.resolve(),
		initializePromise: Promise.resolve(),
		getTreatmentVariable: () => undefined,
		getTreatmentVariableAsync: async () => undefined
	};
}
