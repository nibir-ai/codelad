/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../nls.js';
import { IConfigurationService } from '../../configuration/common/configuration.js';
import { ConfigurationScope, Extensions, IConfigurationRegistry } from '../../configuration/common/configurationRegistry.js';
import { IMeteredConnectionService } from '../../meteredConnection/common/meteredConnection.js';
import product from '../../product/common/product.js';
import { IProductService } from '../../product/common/productService.js';
import { Registry } from '../../registry/common/platform.js';
import { ClassifiedEvent, IGDPRProperty, OmitMetadata, StrictPropertyCheck } from './gdprTypings.js';
import { ITelemetryData, ITelemetryService, TelemetryConfiguration, TelemetryLevel, TELEMETRY_OLD_SETTING_ID, TELEMETRY_SECTION_ID, TELEMETRY_SETTING_ID, ICommonProperties } from './telemetry.js';
import { ITelemetryAppender } from './telemetryUtils.js';

/** Legacy constructor shape retained for callers; the inert service does not read these options. */
export interface ITelemetryServiceConfig {
	appenders: ITelemetryAppender[];
	sendErrorTelemetry?: boolean;
	commonProperties?: ICommonProperties;
	piiPaths?: string[];
	/**
	 * Paths that are removed from telemetry data like {@link piiPaths}, but whose
	 * descendant file paths are fully redacted instead of being kept relative to them.
	 */
	userContentPaths?: string[];
	/**
	 * A fixed telemetry level for processes that receive the resolved level from their launcher.
	 * When provided, the service does not read or observe telemetry settings.
	 */
	telemetryLevel?: TelemetryLevel;
	/** Retained for source compatibility. Events are never buffered. */
	waitForExperimentProperties?: boolean;
	/**
	 * If provided, telemetry events will be dropped when the connection is metered.
	 */
	meteredConnectionService?: IMeteredConnectionService;
}

/** Inert compatibility service. No identifiers, properties, timers, buffers or event data are collected. */
export class TelemetryService implements ITelemetryService {
	declare readonly _serviceBrand: undefined;
	get telemetryLevel(): TelemetryLevel { return TelemetryLevel.NONE; }
	readonly sendErrorTelemetry = false;
	readonly sessionId = '';
	readonly machineId = '';
	readonly sqmId = '';
	readonly devDeviceId = '';
	readonly firstSessionDate = '';

	static createWithLevel(config: ITelemetryServiceConfig & { telemetryLevel: TelemetryLevel }, productService: IProductService): TelemetryService {
		return new TelemetryService(config, undefined, productService);
	}

	constructor(config: ITelemetryServiceConfig & { telemetryLevel: TelemetryLevel }, configurationService: undefined, productService: IProductService);
	constructor(config: ITelemetryServiceConfig, configurationService: IConfigurationService, productService: IProductService);
	constructor(
		_config: ITelemetryServiceConfig,
		@IConfigurationService _configurationService: IConfigurationService | undefined,
		@IProductService _productService: IProductService
	) { }

	publicLog(_eventName: string, _data?: ITelemetryData): void { }
	publicLog2<E extends ClassifiedEvent<OmitMetadata<T>> = never, T extends IGDPRProperty = never>(_eventName: string, _data?: StrictPropertyCheck<T, E>): void { }
	publicLogError(_eventName: string, _data?: ITelemetryData): void { }
	publicLogError2<E extends ClassifiedEvent<OmitMetadata<T>> = never, T extends IGDPRProperty = never>(_eventName: string, _data?: StrictPropertyCheck<T, E>): void { }
	setExperimentProperty(_name: string, _value: string): void { }
	setCommonProperty(_name: string, _value: string | boolean | undefined): void { }
	dispose(): void { }
}

Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	id: TELEMETRY_SECTION_ID,
	order: 1,
	type: 'object',
	title: localize('telemetryConfigurationTitle', "Telemetry"),
	properties: {
		[TELEMETRY_SETTING_ID]: {
			type: 'string',
			enum: [TelemetryConfiguration.OFF],
			default: TelemetryConfiguration.OFF,
			markdownDescription: localize('telemetry.removed', "{0} does not include a telemetry collector or automatic crash uploader. Product telemetry cannot be enabled. Participating extensions receive the disabled telemetry state. User-installed extensions and selected services may have independent privacy policies.", product.nameLong),
			scope: ConfigurationScope.APPLICATION,
			restricted: true
		},
		[TELEMETRY_OLD_SETTING_ID]: {
			type: 'boolean',
			enum: [false],
			default: false,
			markdownDeprecationMessage: localize('telemetry.legacyRemoved', "Product telemetry has been removed. Use {0} to inspect the disabled state.", TELEMETRY_SETTING_ID),
			scope: ConfigurationScope.APPLICATION,
			restricted: true
		},
		'telemetry.feedback.enabled': {
			type: 'boolean',
			default: false,
			description: localize('telemetry.manualFeedback', "Enable user-initiated feedback actions such as the issue reporter. No automatic feedback or survey uploads are sent.")
		}
	}
});
