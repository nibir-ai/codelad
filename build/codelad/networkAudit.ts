/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface INetLog {
	readonly events: readonly { readonly type?: number; readonly params?: { readonly url?: string } }[];
	readonly constants?: { readonly logEventTypes?: Record<string, number> };
}

/** Summarizes completed Chromium URL events without retaining paths, credentials or query strings. */
export function summarizeNetLog(contents: string, allowedHosts: readonly string[] = []) {
	let log: INetLog | null;
	try {
		log = JSON.parse(contents);
	} catch {
		throw new Error('Could not read a completed NetLog. Review it locally before sharing.');
	}
	if (!log || !Array.isArray(log.events) || !log.constants?.logEventTypes) {
		throw new Error('Expected a completed Chromium NetLog with events and constants.');
	}
	const hosts = new Map<string, number>();
	let localRequests = 0;
	let emptyWebSocketEvents = 0;
	for (const event of log.events) {
		if (!event || typeof event !== 'object') {
			throw new Error('Invalid event in NetLog; review the raw log locally.');
		}
		const rawUrl = event.params?.url;
		if (typeof rawUrl !== 'string') {
			continue;
		}
		// Chromium emits an empty URL on some WebSocket lifecycle events before URL assignment.
		// Count that metadata separately; it supplies no destination and is not a local request.
		if (rawUrl === '' && typeof event.type === 'number' && event.type === log.constants.logEventTypes.WEBSOCKET_ALIVE) {
			emptyWebSocketEvents++;
			continue;
		}
		try {
			const url = new URL(rawUrl);
			if (['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
				const host = url.hostname.toLowerCase();
				hosts.set(host, (hosts.get(host) ?? 0) + 1);
			} else {
				localRequests++;
			}
		} catch {
			throw new Error('Unparseable request URL in NetLog; review the raw log locally.');
		}
	}
	const allowed = new Set(allowedHosts.map(host => host.toLowerCase()));
	return {
		coverage: 'Chromium URL events only. Node, extension host, child processes, DNS and OS traffic require separate capture.',
		localRequests,
		emptyWebSocketEvents,
		hosts: [...hosts].sort(([a], [b]) => a.localeCompare(b)).map(([host, urlEvents]) => ({ host, urlEvents, expectedForThisAction: allowed.has(host) }))
	};
}
