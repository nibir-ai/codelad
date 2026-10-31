/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRange } from '../../../../editor/common/core/range.js';
import { CallHierarchyItem, IncomingCall, OutgoingCall } from '../../callHierarchy/common/callHierarchy.js';

export const ATLAS_NODE_LIMIT = 80;
export const ATLAS_EDGE_LIMIT = 160;
const REQUEST_LIMIT = 200;
const SITE_LIMIT = 32;

export interface IAtlasNode {
	readonly id: string;
	readonly item: CallHierarchyItem;
	readonly column: number;
	incoming: boolean;
	outgoing: boolean;
}

export interface IAtlasEdge {
	readonly from: string;
	readonly to: string;
	readonly sites: IRange[];
	truncatedSites: boolean;
}

/** Provider-local IDs are not stable across calls; source selection ranges identify symbols. */
export function atlasNodeId(item: CallHierarchyItem): string {
	const range = item.selectionRange;
	return JSON.stringify([item.uri.toString(), range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn]);
}

/** A bounded snapshot of actual language-provider calls, never an inferred execution graph. */
export class AtlasGraph {
	readonly nodes = new Map<string, IAtlasNode>();
	readonly edges = new Map<string, IAtlasEdge>();
	readonly rootId: string;
	truncated = false;

	constructor(root: CallHierarchyItem, private readonly nodeLimit = ATLAS_NODE_LIMIT, private readonly edgeLimit = ATLAS_EDGE_LIMIT) {
		this.rootId = atlasNodeId(root);
		this.nodes.set(this.rootId, { id: this.rootId, item: root, column: 0, incoming: false, outgoing: false });
	}

	addIncoming(target: IAtlasNode, calls: readonly IncomingCall[]): void {
		this.truncated ||= calls.length > REQUEST_LIMIT;
		this.add(target, calls.slice(0, REQUEST_LIMIT).map(call => ({ item: call.from, ranges: call.fromRanges })), true);
		target.incoming = true;
	}

	addOutgoing(source: IAtlasNode, calls: readonly OutgoingCall[]): void {
		this.truncated ||= calls.length > REQUEST_LIMIT;
		this.add(source, calls.slice(0, REQUEST_LIMIT).map(call => ({ item: call.to, ranges: call.fromRanges })), false);
		source.outgoing = true;
	}

	private add(anchor: IAtlasNode, calls: readonly { item: CallHierarchyItem; ranges: readonly IRange[] }[], incoming: boolean): void {
		if (calls.length > REQUEST_LIMIT) {
			this.truncated = true;
		}
		for (const call of calls.slice(0, REQUEST_LIMIT)) {
			const id = atlasNodeId(call.item);
			const from = incoming ? id : anchor.id;
			const to = incoming ? anchor.id : id;
			const edgeId = JSON.stringify([from, to]);
			if ((!this.nodes.has(id) && this.nodes.size >= this.nodeLimit) || (!this.edges.has(edgeId) && this.edges.size >= this.edgeLimit)) {
				this.truncated = true;
				continue;
			}
			if (!this.nodes.has(id)) {
				this.nodes.set(id, { id, item: call.item, column: anchor.column + (incoming ? -1 : 1), incoming: false, outgoing: false });
			}
			let edge = this.edges.get(edgeId);
			if (!edge) {
				edge = { from, to, sites: [], truncatedSites: false };
				this.edges.set(edgeId, edge);
			}
			edge.truncatedSites ||= call.ranges.length > SITE_LIMIT;
			for (const range of call.ranges.slice(0, SITE_LIMIT)) {
				if (edge.sites.some(site => site.startLineNumber === range.startLineNumber && site.startColumn === range.startColumn && site.endLineNumber === range.endLineNumber && site.endColumn === range.endColumn)) {
					continue;
				}
				if (edge.sites.length >= SITE_LIMIT) {
					edge.truncatedSites = true;
					break;
				}
				edge.sites.push({ ...range });
			}
		}
	}
}

/** Filter only loaded relationships; the anchor remains visible for orientation. */
export function filterAtlasGraph(graph: AtlasGraph, query: string, incoming: boolean, outgoing: boolean, changedOnly: boolean, changed: ReadonlySet<string>): { nodes: IAtlasNode[]; edges: IAtlasEdge[] } {
	const reachable = new Set([graph.rootId]);
	for (const reverse of [true, false]) {
		if (reverse ? !incoming : !outgoing) {
			continue;
		}
		const visited = new Set([graph.rootId]);
		const queue = [graph.rootId];
		for (let index = 0; index < queue.length; index++) {
			for (const edge of graph.edges.values()) {
				if ((reverse ? edge.to : edge.from) !== queue[index]) {
					continue;
				}
				const next = reverse ? edge.from : edge.to;
				if (!visited.has(next)) {
					visited.add(next);
					reachable.add(next);
					queue.push(next);
				}
			}
		}
	}
	const search = query.trim().toLowerCase();
	const nodes = [...graph.nodes.values()].filter(node => node.id === graph.rootId || (reachable.has(node.id) && (!changedOnly || changed.has(node.item.uri.toString())) && `${node.item.name} ${node.item.uri.path}`.toLowerCase().includes(search)));
	const ids = new Set(nodes.map(node => node.id));
	return { nodes, edges: [...graph.edges.values()].filter(edge => ids.has(edge.from) && ids.has(edge.to)) };
}

export interface IAtlasPlacement {
	readonly node: IAtlasNode;
	readonly x: number;
	readonly y: number;
}

/** Stable directed columns keep the anchor and already loaded symbol positions understandable. */
export function layoutAtlasGraph(nodes: readonly IAtlasNode[]): { placements: IAtlasPlacement[]; width: number; height: number } {
	const columns = new Map<number, IAtlasNode[]>();
	for (const node of nodes) {
		const column = columns.get(node.column) ?? [];
		column.push(node);
		columns.set(node.column, column);
	}
	const keys = [...columns.keys()].sort((a, b) => a - b);
	const rows = Math.max(1, ...[...columns.values()].map(column => column.length));
	const height = rows * 88 + 80;
	const placements = keys.flatMap((key, index) => columns.get(key)!.map((node, row, column) => ({ node, x: 40 + index * 260, y: 40 + (rows - column.length) * 44 + row * 88 })));
	return { placements, width: Math.max(1, keys.length) * 260 + 40, height };
}
