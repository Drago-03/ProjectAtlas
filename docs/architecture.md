# ProjectAtlas Architecture Overview

Layers:

1. Extension Host - Registers commands; computes graphs (directory, workflows, symbols) and diffs; debounced rebuild (200ms).
2. Webview (React + D3) - Renders Markdown, diagrams, directory tree (hierarchical), workflow force graph, symbol metrics.
3. Symbol Providers - Extract language constructs to a unified graph (TypeScript provider with import + call edges; stubs for others).
4. Renderers - Markdown (marked + highlight.js), Mermaid (theme-aware), Workflow (YAML parser), Directory (recursive FS), D3 Graph modules.


Patch Schema:
Symbol graph updates stream as `{ nodesAdded, nodesRemoved, edgesAdded, edgesRemoved }` enabling O(k) merge where k is delta size.

Messaging Channel:
`INIT_STATE`, `MARKDOWN_RENDER`, `SYMBOL_PATCH`, `GRAPH_UPDATE`, `RENDER_MERMAID`, `MERMAID_RESULT`, `MERMAID_ERROR`.

Security: Strict CSP, local bundled assets only.
Performance: Reused ts-morph Project, debounced rebuild, incremental patches reduce UI re-render cost.
