/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IHeaders } from '../../../base/parts/request/common/request.js';
import { IConfigurationService } from '../../configuration/common/configuration.js';
import { IEnvironmentService } from '../../environment/common/environment.js';
import { IFileService } from '../../files/common/files.js';
import { IProductService } from '../../product/common/productService.js';
import { IStorageService } from '../../storage/common/storage.js';
import { ITelemetryService } from '../../telemetry/common/telemetry.js';

export async function resolveMarketplaceHeaders(version: string,
	productService: IProductService,
	_environmentService: IEnvironmentService,
	_configurationService: IConfigurationService,
	_fileService: IFileService,
	_storageService: IStorageService | undefined,
	_telemetryService: ITelemetryService): Promise<IHeaders> {

	const applicationName = productService.nameShort || 'Codelad';
	return {
		'X-Market-Client-Id': `${applicationName} ${version}`,
		'User-Agent': `${applicationName} ${version}`
	};
}
