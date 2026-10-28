/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ILogService } from '../../log/common/log.js';
import { IStateService } from '../../state/node/state.js';
import { machineIdKey, sqmIdKey, devDeviceIdKey } from '../common/telemetry.js';
import { resolveMachineId as resolveNodeMachineId } from '../node/telemetryUtils.js';

export async function resolveMachineId(stateService: IStateService, logService: ILogService): Promise<string> {
	const machineId = await resolveNodeMachineId(stateService, logService);
	stateService.setItem(machineIdKey, machineId);
	return machineId;
}

export async function resolveSqmId(stateService: IStateService, _logService: ILogService): Promise<string> {
	stateService.removeItem(sqmIdKey);
	return '';
}

export async function resolveDevDeviceId(stateService: IStateService, _logService: ILogService): Promise<string> {
	stateService.removeItem(devDeviceIdKey);
	return '';
}
