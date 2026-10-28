/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Removes telemetry configuration only from Codelad-owned agent children, leaving project shells untouched. */
export function disableAgentTelemetry(environment: Record<string, string | undefined>): void {
	for (const key of Object.keys(environment)) {
		if (/^(OTEL_|COPILOT_OTEL_|CLAUDE_CODE_.*TELEMETRY|TRACEPARENT$|TRACESTATE$)/i.test(key)) {
			delete environment[key];
		}
	}
	Object.assign(environment, {
		OTEL_SDK_DISABLED: 'true',
		OTEL_TRACES_EXPORTER: 'none',
		OTEL_METRICS_EXPORTER: 'none',
		OTEL_LOGS_EXPORTER: 'none',
		COPILOT_OTEL_ENABLED: 'false',
		CLAUDE_CODE_ENABLE_TELEMETRY: '0'
	});
}
