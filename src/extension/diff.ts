import { SymbolGraph } from '../symbolProviders/types';

export interface SymbolGraphPatch { nodesAdded: any[]; nodesRemoved: string[]; edgesAdded: any[]; edgesRemoved: string[]; }

export function diffGraphs(prev: SymbolGraph | undefined, next: SymbolGraph): SymbolGraphPatch | null {
  if (!prev) return null;
  const prevNodeMap = new Map(prev.nodes.map(n => [n.id, n]));
  const nextNodeMap = new Map(next.nodes.map(n => [n.id, n]));
  const prevEdgeMap = new Map(prev.edges.map(e => [e.id, e]));
  const nextEdgeMap = new Map(next.edges.map(e => [e.id, e]));

  const nodesAdded = next.nodes.filter(n => !prevNodeMap.has(n.id));
  const nodesRemoved = [...prevNodeMap.keys()].filter(id => !nextNodeMap.has(id));
  const edgesAdded = next.edges.filter(e => !prevEdgeMap.has(e.id));
  const edgesRemoved = [...prevEdgeMap.keys()].filter(id => !nextEdgeMap.has(id));

  if (!nodesAdded.length && !nodesRemoved.length && !edgesAdded.length && !edgesRemoved.length) return { nodesAdded: [], nodesRemoved: [], edgesAdded: [], edgesRemoved: [] };
  return { nodesAdded, nodesRemoved, edgesAdded, edgesRemoved };
}
