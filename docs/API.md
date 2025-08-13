## ProjectAtlas API (Initial Draft)

### Commands

| Command | Title | Description |
|---------|-------|-------------|
| `projectAtlas.open` | ProjectAtlas: Open | Opens the main visualization panel. |

### Message Types (Planned)

Extension -> Webview:
- INIT_STATE { version, workspace }
- GRAPH_UPDATE SymbolGraph
- MARKDOWN_RENDER { uri, html }

Webview -> Extension:
- REQUEST_SYMBOL_GRAPH { languages? }
- OPEN_FILE { uri, range? }

### Symbol Provider Contract
interface ISymbolProvider { languageIds: string[]; build(workspaceRoot: string): Promise<SymbolGraph>; }
