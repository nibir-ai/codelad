/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Checks distribution metadata without printing endpoint values or credentials. */
export function assertCodeladPrivacy(product: Record<string, unknown>): asserts product is Record<string, unknown> & { skipBuiltinExtensions: string[] } {
	const failures: string[] = [];
	for (const [key, expected] of Object.entries({ applicationName: 'codelad', enableTelemetry: false, removeTelemetryMachineId: true })) {
		if (product[key] !== expected) {
			failures.push(key);
		}
	}
	const levels = product.enabledTelemetryLevels as { error?: boolean; usage?: boolean } | undefined;
	if (levels?.error !== false || levels.usage !== false) {
		failures.push('enabledTelemetryLevels');
	}
	if (!Array.isArray(product.skipBuiltinExtensions) || product.skipBuiltinExtensions.some(id => typeof id !== 'string') || !product.skipBuiltinExtensions.includes('GitHub.copilot-chat')) {
		failures.push('skipBuiltinExtensions');
	}
	if (!Array.isArray(product.builtInExtensionsEnabledWithAutoUpdates) || product.builtInExtensionsEnabledWithAutoUpdates.length !== 0) {
		failures.push('builtInExtensionsEnabledWithAutoUpdates');
	}
	for (const key of ['aiConfig', 'appCenter', 'tasConfig', 'ariaKey', 'statsig', 'experimentation', 'voiceWsUrl', 'defaultChatAgent', 'settingsSearchUrl', 'surveyUrl', 'surveys', 'updateUrl', 'webviewContentExternalBaseUrlTemplate', 'configurationSync.store', 'configurationSync.store.insiders']) {
		if (product[key] !== undefined) {
			failures.push(key);
		}
	}
	const gallery = product.extensionsGallery as Record<string, string> | undefined;
	if (gallery?.serviceUrl !== 'https://open-vsx.org/vscode/gallery') {
		failures.push('extensionsGallery.serviceUrl');
	}
	for (const key of ['controlUrl', 'resourceUrlTemplate', 'extensionUrlTemplate', 'nlsBaseUrl', 'itemUrl']) {
		if (gallery?.[key]) {
			try {
				const url = new URL(gallery[key]);
				if (url.origin !== 'https://open-vsx.org' || url.username || url.password) {
					failures.push(`extensionsGallery.${key}`);
				}
			} catch {
				failures.push(`extensionsGallery.${key}`);
			}
		}
	}
	if (failures.length) {
		throw new Error(`Codelad privacy configuration rejected: ${failures.join(', ')}`);
	}
}
