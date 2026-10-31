/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { URI } from '../../../../../base/common/uri.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { SymbolKind } from '../../../../../editor/common/languages.js';
import { CallHierarchyItem } from '../../../callHierarchy/common/callHierarchy.js';
import { AtlasGraph, atlasNodeId, filterAtlasGraph, layoutAtlasGraph } from '../../browser/atlasGraph.js';

function item(name: string, line = 1): CallHierarchyItem {
	return { _sessionId: 'test', _itemId: name, name, kind: SymbolKind.Function, uri: URI.file(`/workspace/${name}.ts`), range: { startLineNumber: line, startColumn: 1, endLineNumber: line + 10, endColumn: 1 }, selectionRange: { startLineNumber: line, startColumn: 10, endLineNumber: line, endColumn: 10 + name.length } };
}

suite('Codelad Atlas graph', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('incoming and outgoing reports deduplicate the same real edge and call sites', () => {
		const root = item('root');
		const child = item('child');
		const graph = new AtlasGraph(root);
		graph.addOutgoing(graph.nodes.get(graph.rootId)!, [{ to: child, fromRanges: [root.selectionRange, root.selectionRange] }]);
		const node = graph.nodes.get(atlasNodeId(child))!;
		graph.addIncoming(node, [{ from: { ...root, _sessionId: 'new-provider-session' }, fromRanges: [root.selectionRange] }]);
		assert.deepStrictEqual({ nodes: graph.nodes.size, edges: graph.edges.size, sites: [...graph.edges.values()].map(edge => edge.sites.length), direction: [...graph.edges.values()].map(edge => [graph.nodes.get(edge.from)!.item.name, graph.nodes.get(edge.to)!.item.name]) }, { nodes: 2, edges: 1, sites: [1], direction: [['root', 'child']] });
	});

	test('cycles and recursion terminate filtering without duplicating source symbols', () => {
		const root = item('root');
		const other = item('other');
		const graph = new AtlasGraph(root);
		graph.addOutgoing(graph.nodes.get(graph.rootId)!, [{ to: root, fromRanges: [] }, { to: other, fromRanges: [] }]);
		graph.addOutgoing(graph.nodes.get(atlasNodeId(other))!, [{ to: root, fromRanges: [] }]);
		const view = filterAtlasGraph(graph, '', true, true, false, new Set());
		assert.deepStrictEqual({ nodes: view.nodes.length, edges: view.edges.length, layoutFinite: layoutAtlasGraph(view.nodes).placements.every(placement => Number.isFinite(placement.x) && Number.isFinite(placement.y)) }, { nodes: 2, edges: 3, layoutFinite: true });
	});

	test('node, edge, provider-result and call-site budgets disclose truncation', () => {
		const root = item('root');
		const graph = new AtlasGraph(root, 3, 2);
		graph.addOutgoing(graph.nodes.get(graph.rootId)!, Array.from({ length: 5000 }, (_, index) => ({ to: item(`child${index}`), fromRanges: Array.from({ length: 50 }, (_, line) => ({ ...root.selectionRange, startLineNumber: line + 1, endLineNumber: line + 1 })) })));
		assert.deepStrictEqual({ nodes: graph.nodes.size, edges: graph.edges.size, truncated: graph.truncated, sites: [...graph.edges.values()].map(edge => [edge.sites.length, edge.truncatedSites]) }, { nodes: 3, edges: 2, truncated: true, sites: [[32, true], [32, true]] });
	});

	test('direction, name/path and SCM filters operate on loaded data and retain the anchor', () => {
		const root = item('root');
		const before = item('caller');
		const after = item('callee');
		const graph = new AtlasGraph(root);
		graph.addIncoming(graph.nodes.get(graph.rootId)!, [{ from: before, fromRanges: [] }]);
		graph.addOutgoing(graph.nodes.get(graph.rootId)!, [{ to: after, fromRanges: [] }]);
		const names = (query: string, incoming: boolean, outgoing: boolean, changedOnly: boolean) => filterAtlasGraph(graph, query, incoming, outgoing, changedOnly, new Set([before.uri.toString()])).nodes.map(node => node.item.name);
		assert.deepStrictEqual([names('', true, false, false), names('callee.ts', true, true, false), names('', true, true, true), names('no match', true, true, false)], [['root', 'caller'], ['root', 'callee'], ['root', 'caller'], ['root']]);
	});

	test('same-named symbols at distinct source locations remain distinct', () => {
		const root = item('root');
		const graph = new AtlasGraph(root);
		graph.addOutgoing(graph.nodes.get(graph.rootId)!, [{ to: item('method', 1), fromRanges: [] }, { to: item('method', 20), fromRanges: [] }]);
		const layout = layoutAtlasGraph([...graph.nodes.values()]);
		assert.deepStrictEqual({ nodes: graph.nodes.size, distinct: new Set(layout.placements.map(placement => `${placement.x}:${placement.y}`)).size }, { nodes: 3, distinct: 3 });
	});
});
