/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Keeps only editor-owned numeric socket metadata; process arguments and names are never retained. */
export function filterLinuxConnections(snapshot: string, processIds: ReadonlySet<number>) {
	const connections: { pid: number; protocol: string; state: string; local: string; remote: string }[] = [];
	let unparsedOwnedRows = 0;
	for (const line of snapshot.split('\n')) {
		const owners = new Set([...line.matchAll(/\bpid=(\d+)/g)].map(match => Number(match[1])).filter(pid => processIds.has(pid)));
		if (!owners.size) {
			continue;
		}
		const fields = line.trim().split(/\s+/);
		if (fields.length < 7 || !/^(tcp|udp)$/.test(fields[0])) {
			unparsedOwnedRows++;
			continue;
		}
		if (!fields.slice(4, 6).every(endpoint => /^[\[\]0-9a-fA-F:.*]+$/.test(endpoint))) {
			unparsedOwnedRows++;
			continue;
		}
		for (const pid of owners) {
			connections.push({ pid, protocol: fields[0], state: fields[1], local: fields[4], remote: fields[5] });
		}
	}
	return { connections, unparsedOwnedRows };
}
