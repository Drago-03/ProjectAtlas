// Shared graph schema
export interface GraphNode { id: string; kind: string; label: string; file?: string; range?: { start: number; end: number }; }
export interface GraphEdge { id: string; from: string; to: string; kind: string; }
export interface SymbolGraph { nodes: GraphNode[]; edges: GraphEdge[]; diagnostics?: string[]; }
export interface ISymbolProvider { languageIds: string[]; build(workspaceRoot: string): Promise<SymbolGraph>; }
