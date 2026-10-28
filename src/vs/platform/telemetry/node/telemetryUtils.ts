/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isUUID } from '../../../base/common/uuid.js';
import { getMachineId } from '../../../base/node/id.js';
import { ILogService } from '../../log/common/log.js';
import { IStateReadService } from '../../state/node/state.js';
import { machineIdKey } from '../common/telemetry.js';

/** Reuse a local random identifier for API compatibility; discard legacy hardware-derived values. */
export async function resolveMachineId(stateService: IStateReadService, logService: ILogService): Promise<string> {
	const cached = stateService.getItem<string>(machineIdKey);
	return typeof cached === 'string' && isUUID(cached) ? cached : getMachineId(error => logService.error(error));
}

export async function resolveSqmId(_stateService: IStateReadService, _logService: ILogService): Promise<string> { return ''; }
export async function resolveDevDeviceId(_stateService: IStateReadService, _logService: ILogService): Promise<string> { return ''; }
