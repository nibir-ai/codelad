/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { webviewGenericCspSource, webviewRootResourceAuthority } from '../../../../webview/common/webview.js';

/** Keep notebook rendering local until the user explicitly permits renderer network access. */
export function getNotebookContentSecurityPolicy(allowRemoteContent: boolean, enableLegacyCsp: boolean): string {
	if (allowRemoteContent) {
		if (!enableLegacyCsp) {
			return '';
		}
		return `default-src 'none'; script-src ${webviewGenericCspSource} 'unsafe-inline' 'unsafe-eval'; style-src ${webviewGenericCspSource} 'unsafe-inline'; img-src ${webviewGenericCspSource} https: http: data:; font-src ${webviewGenericCspSource} https:; connect-src https:; child-src https: data:;`;
	}

	// The service worker intercepts this virtual resource authority for file loading.
	const local = `'self' https://*.${webviewRootResourceAuthority}`;
	return `default-src 'none'; script-src ${local} 'unsafe-inline' 'unsafe-eval'; style-src ${local} 'unsafe-inline'; img-src ${local} data: blob:; media-src ${local} data: blob:; font-src ${local} data:; connect-src ${local}; worker-src ${local} blob:; child-src ${local} blob: data:; form-action 'none'; base-uri ${local};`;
}
