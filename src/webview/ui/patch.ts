// Symbol graph patch merge utility
// Patch schema: { nodesAdded:[], nodesRemoved:[], edgesAdded:[], edgesRemoved:[] }
export function patchSymbols(base: any, patch: any) {
  if (!base) return { nodes: patch.nodesAdded || [], edges: patch.edgesAdded || [] };
  if (patch) {
    if (patch.nodesAdded) {
      const map = new Map(base.nodes.map((n: any) => [n.id, n]));
      for (const n of patch.nodesAdded) map.set(n.id, n);
      base.nodes = Array.from(map.values());
    }
    if (patch.nodesRemoved) {
      const removeSet = new Set(patch.nodesRemoved);
      base.nodes = base.nodes.filter((n: any) => !removeSet.has(n.id));
    }
    if (patch.edgesAdded) {
      const mapE = new Map(base.edges.map((e: any) => [e.id, e]));
      for (const e of patch.edgesAdded) mapE.set(e.id, e);
      base.edges = Array.from(mapE.values());
    }
    if (patch.edgesRemoved) {
      const remE = new Set(patch.edgesRemoved);
      base.edges = base.edges.filter((e: any) => !remE.has(e.id));
    }
  }
  return { ...base };
}
