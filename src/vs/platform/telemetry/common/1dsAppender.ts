/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITelemetryData } from './telemetry.js';
import { ITelemetryAppender } from './telemetryUtils.js';

/** Compatibility adapter for upstream consumers. Codelad contains no collector or upload client. */
export abstract class AbstractOneDataSystemAppender implements ITelemetryAppender {
	constructor(
		_isInternalTelemetry: boolean,
		_eventPrefix: string,
		_defaultData: Record<string, unknown> | null,
		_keyOrClientFactory: string | (() => object)
	) { }

	log(_eventName: string, _data?: ITelemetryData): void { }

	async flush(): Promise<void> { }
}
