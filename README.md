<div align="center">
	<img src="media/icon.png" width="96" alt="ProjectAtlas Logo" />
	<h1>ProjectAtlas</h1>
	<p><strong>An offline, unified workspace atlas for VS Code: docs, diagrams, workflows, directories, symbols & call graphs.</strong></p>

	<p>
		<a href="https://github.com/Drago-03/ProjectAtlas/actions"><img alt="CI" src="https://img.shields.io/badge/ci-pending-lightgrey" /></a>
		<img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
		<img alt="Status" src="https://img.shields.io/badge/status-beta-orange" />
		<img alt="VS Code" src="https://img.shields.io/badge/vscode%20engine-%3E=1.85.0-1f6feb" />
	</p>
</div>

---

## Table of Contents
1. Features
2. Quick Start
3. Commands
4. Visuals & Graph Model
5. Symbol Patch Protocol
6. Configuration
7. Performance Notes
8. Roadmap
9. Contributing
10. Publishing / Release Process
11. License & Credits
12. Contributors

---

## 1. Features

| Area | Capability | Details |
|------|------------|---------|
| Markdown | Render + inline Mermaid | `marked` + `highlight.js`; fenced ```mermaid``` blocks auto-render |
| Mermaid | Theme aware diagrams | Light/Dark toggle triggers re-render |
| Workflows | GitHub Actions graph | Job dependency DAG (needs chains) with live watcher |
| Directory | Interactive tree/force graph | Folder and file nodes, click-to-open |
| Symbols | TypeScript/JavaScript symbols | Functions, file nodes, import & call edges (ts-morph) |
| Incremental Updates | Patch model | `{nodesAdded,nodesRemoved,edgesAdded,edgesRemoved}` diff merging |
| Error Handling | Mermaid errors surfaced | Fallback placeholder + error list |
| Offline | No network required | All libraries bundled locally |

---

## 2. Quick Start

### Install (when published)
1. Open VS Code marketplace, search for “ProjectAtlas”.
2. Click Install.
3. Run the command: `ProjectAtlas: Open`.

### Dev / Local Build
```bash
git clone https://github.com/Drago-03/ProjectAtlas.git
cd ProjectAtlas
npm install
npm run build
# Press F5 in VS Code to launch Extension Development Host
```

---

## 3. Commands

| Command ID | Title | Description |
|------------|-------|-------------|
| `projectAtlas.open` | ProjectAtlas: Open | Opens the atlas webview panel |

---

## 4. Visuals & Graph Model

All internal visualisations share a common structure:
```ts
interface GraphNode { id: string; label?: string; kind?: string; file?: string; }
interface GraphEdge { id: string; from: string; to: string; kind: string; }
interface SymbolGraph { nodes: GraphNode[]; edges: GraphEdge[]; diagnostics?: string[] }
```

Edge kinds currently emitted:
| Kind | Source |
|------|--------|
| `imports` | TypeScript import declarations |
| `calls` | Inferred per-file call edges to function declarations |
| `depends` | Workflow job `needs` relationships |
| `contains` | (Directory tree internal usage) |

---

## 5. Symbol Patch Protocol

To avoid shipping the entire symbol graph on every save, a structural diff is computed:
```ts
interface SymbolGraphPatch {
	nodesAdded: GraphNode[];
	nodesRemoved: string[]; // node IDs
	edgesAdded: GraphEdge[];
	edgesRemoved: string[]; // edge IDs
}
```
Client merge strategy (webview): add `nodesAdded`, remove by id, then apply edge additions/removals idempotently. An empty patch (all arrays empty) means “no structural change” but is still valid.

---

## 6. Configuration (Planned)
| Setting | Description | Default |
|---------|-------------|---------|
| `projectAtlas.symbols.enable` | Enable symbol extraction | true |
| `projectAtlas.symbols.languages` | Language allowlist | `["typescript","javascript"]` |
| `projectAtlas.mermaid.themeSync` | Sync with VS Code theme | true |
| `projectAtlas.performance.debounceMs` | Debounce interval for rebuild | 200 |

Future settings will be contributed via `contributes.configuration` when stabilized.

---

## 7. Performance Notes
| Concern | Mitigation |
|---------|------------|
| Repeated symbol rebuilds | 200ms debounce on save events |
| Large TypeScript projects | Project cache (currently simplified recreate; future incremental) |
| Mermaid in non-DOM test env | DOM guard returns placeholder SVG |
| Workflow churn | Cached last workflow graph; watcher sends `WORKFLOW_UPDATE` |

---

## 8. Roadmap
| Version | Items |
|---------|-------|
| 0.2 | Python / Go provider stubs, search/filter UI |
| 0.3 | Rich call graph (per-function caller nodes), collapse/expand groups |
| 0.4 | Export diagrams (SVG/PNG), PlantUML support |
| 0.5 | Multi-repo / workspace multi-root aggregation |
| 1.0 | Extension API: custom symbol providers & render plugins |

---

## 9. Contributing
```bash
git clone https://github.com/Drago-03/ProjectAtlas.git
cd ProjectAtlas
npm install
npm run build   # build extension + webview
npm test        # run unit tests (currently limited; harness under refactor)
```
Please open issues with reproduction steps. PRs should include: description, before/after notes, and test (when feasible).

Guidelines:
* Keep bundles lean – prefer dynamic feature toggles to additional heavy deps.
* Isolate language providers; avoid coupling UI state to extraction logic.
* Use the symbol patch protocol for incremental updates.

---

## 10. Publishing / Release Process
1. Update `VERSION` and `docs/CHANGELOG.md`.
2. Run `npm run build` → verify `dist/` contains extension & webview assets.
3. Run lint & tests: `npm run lint && npm test`.
4. Package: `npx vsce package` (ensure you have a Personal Access Token for publishing if needed).
5. Publish: `npx vsce publish` (publisher id must be set; update `publisher` in package.json).
6. Create a GitHub Release tagging the version.

CI (planned) will automate lint/test/package on PRs and attach VSIX as an artifact.

---

## 11. License & Credits
MIT License. Uses third-party libraries: React, D3, mermaid, marked, highlight.js, ts-morph, js-yaml.

---

## 12. Contributors
| Name | Role |
|------|------|
| @Drago-03 | Maintainer / Architect |
| (You?) | Contributor – open a PR! |

<sub>Badges and some sections will update as CI & release automation are added.</sub>

