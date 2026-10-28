/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Extensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { Registry } from '../../../../platform/registry/common/platform.js';

// Keep optional network features available, with explicit user opt-in for background access.
Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerDefaultConfigurations([{
	overrides: {
		'workbench.startupEditor': 'welcomePage',
		'workbench.secondarySideBar.defaultVisibility': 'hidden',
		'chat.disableAIFeatures': true,
		'workbench.enableExperiments': false,
		'update.mode': 'none',
		'update.showReleaseNotes': false,
		'extensions.autoUpdate': 'off',
		'extensions.autoCheckUpdates': false,
		'extensions.ignoreRecommendations': true,
		'npm.fetchOnlinePackageInfo': false,
		'js/ts.tsserver.automaticTypeAcquisition.enabled': false,
		// The extension's migration reader checks the legacy setting when the unified value is a default.
		'typescript.disableAutomaticTypeAcquisition': true,
		'git.autofetch': false
	}
}]);
