/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const enum MarkdownPreviewSecurityLevel {
	Strict = 0,
	AllowInsecureContent = 1,
	AllowScriptsAndAllContent = 2,
	AllowInsecureLocalContent = 3
}

/** Only the resource subdomain is intercepted by the webview's local-resource service worker. */
function getLocalResourceSource(cspSource: string): string {
	return cspSource.split(';')[0].replaceAll('https://*.vscode-cdn.net', 'https://*.vscode-resource.vscode-cdn.net');
}

/** Remote resources require user opt-in independently of the preview's script security level. */
export function getPreviewContentSecurityPolicy(cspSource: string, nonce: string, level: MarkdownPreviewSecurityLevel, allowRemoteContent: boolean): string {
	const rule = getLocalResourceSource(cspSource);
	let remoteSources = '';
	if (allowRemoteContent) {
		switch (level) {
			case MarkdownPreviewSecurityLevel.AllowScriptsAndAllContent:
				return '';
			case MarkdownPreviewSecurityLevel.AllowInsecureContent:
				remoteSources = 'http: https:';
				break;
			case MarkdownPreviewSecurityLevel.AllowInsecureLocalContent:
				remoteSources = 'https: http://localhost:* http://127.0.0.1:*';
				break;
			default:
				remoteSources = 'https:';
		}
	}
	const resources = `'self' ${rule} data: ${remoteSources}`.trim();
	return `default-src 'none'; img-src ${resources}; media-src ${resources}; script-src 'nonce-${nonce}'; style-src ${resources} 'unsafe-inline'; font-src ${resources};`;
}

/** Keep the rich editor's workers and local resources available without allowing remote media by default. */
export function getEditorContentSecurityPolicy(cspSource: string, nonce: string, allowRemoteContent: boolean): string {
	cspSource = getLocalResourceSource(cspSource);
	const mediaSources = `${cspSource} data:${allowRemoteContent ? ' https:' : ''}`;
	return `default-src 'none'; style-src ${cspSource} 'unsafe-inline'; font-src ${cspSource}; img-src ${mediaSources}; media-src ${mediaSources}; script-src 'nonce-${nonce}' ${cspSource}; worker-src ${cspSource} blob:; connect-src ${cspSource}; frame-src 'self';`;
}
