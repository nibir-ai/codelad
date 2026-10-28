/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRequestService } from '../../request/common/request.js';
import { AbstractOneDataSystemAppender } from '../common/1dsAppender.js';

/** Retains the upstream service seam without creating or calling an upload transport. */
export class OneDataSystemAppender extends AbstractOneDataSystemAppender {
	constructor(
		_requestService: IRequestService | undefined,
		isInternalTelemetry: boolean,
		eventPrefix: string,
		defaultData: Record<string, unknown> | null,
		keyOrClientFactory: string | (() => object)
	) {
		super(isInternalTelemetry, eventPrefix, defaultData, keyOrClientFactory);
	}
}
