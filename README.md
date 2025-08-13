# ProjectAtlas  
### Comprehensive Proposal for a Two-Week MVP Deliverable  

ProjectAtlas will be a Visual Studio Code extension that renders **every significant artifact in a workspace—documents, workflows, folder structures, symbols and call graphs—inside a single, interactive canvas**. The MVP must be feature-complete yet lightweight, entirely offline and delivered in fourteen days. [${DIA-SOURCE}](code.visualstudio.com/api/extension-guides/webview)

---

## 1  Vision & Value  

Developers juggle Markdown previews, diagram generators, workflow visualisers and code-map plug-ins. ProjectAtlas collapses that tooling sprawl into one extension, offering:  

- Instant previews of documentation and diagrams.  
- Clickable maps of directory trees and workflow pipelines.  
- Live call-graph and symbol insights across multiple languages.  
- A unified UX that never leaves VS Code or sends data to the cloud. [${DIA-SOURCE}](github.com/microsoft/vscode-extension-samples)

---

## 2  Functional Scope  

### 2.1 File-Type Visualisation  

| Format | File Extensions | Renderer / Library | Key Features |  
|--------|-----------------|--------------------|--------------|  
| **Markdown** | .md, .markdown | marked + highlight.js | GFM tables, emojis, `{latex}` math, fenced Mermaid blocks |  
| **Mermaid** | .mmd, fenced ```mermaid``` | mermaid.js | Theme switch, zoom/pan |  
| **YAML / JSON Workflows** | .yaml, .yml, .json, .workflow | js-yaml + custom D3 flowchart | Detect GitHub Actions, Azure Pipelines; show job order & triggers |  
| **Plain Text & Logs** | .* | Raw viewer with syntax highlight where possible | Large-file virtualisation |  

### 2.2 Workspace & Dependency Graphs  

- Force-directed and hierarchical views of folders/files.  
- Edge types: **contains**, **imports**, **Markdown links**, **workflow job dependencies**.  
- Click a node to open the file; hover shows metadata (size, last commit). [${DIA-SOURCE}](d3js.org)

### 2.3 Code-Symbol & Call-Graph Visualisation  

| Language | File Extensions | Provider | Initial Coverage |  
|----------|-----------------|----------|------------------|  
| **TypeScript / JavaScript** | .ts, .tsx, .js, .jsx, .mjs, .cjs | TypeScript compiler API (`ts-morph`) | Full symbol tree, calls, imports, inheritance |  
| **Python** | .py | Pyright AST (WebWorker) | Functions, classes, imports, call graph (best-effort) |  
| **Go** | .go | go/packages via WASM | Packages, funcs, method sets |  
| **Java** | .java | JavaParser (WASM) | Classes, interfaces, inheritance edges |  
| **C#** | .cs | Roslyn WASM | Namespaces, classes, methods, properties |  

All providers output a common `{ nodes, edges }` schema consumed by the Graph Engine, enabling future plug-ins for languages such as Rust or Kotlin.  

---

## 3  Technical Architecture  

| Layer | Responsibilities | Tech |  
|-------|------------------|------|  
| **Extension Host** | Activation events, commands (`projectAtlas.open`), file-system walker, AST cache, settings | TypeScript (ES2022) |  
| **Webview SPA** | UI, state management, rendering pipelines | Vite + React + Redux Toolkit |  
| **Renderers** | Markdown, Mermaid, Workflow, Directory, Symbol graphs | marked, mermaid.js, js-yaml, D3 |  
| **Symbol Providers** | Language-specific AST extraction | ts-morph, Pyright, go/packages, JavaParser, Roslyn |  
| **Graph Engine** | Progressive D3 simulation, virtual scrolling, minimap | D3-v7 with WebGL fallback |  

A message bridge (`window.acquireVsCodeApi`) carries diff patches; only changed nodes re-render (<50 ms target). Strict CSP blocks remote scripts; all assets are bundled. [${DIA-SOURCE}](code.visualstudio.com/api/extension-guides/webview)

---

## 4  Two-Week Execution Plan  

| Day | Milestone | Principal Tasks | Deliverable |  
|----|-----------|-----------------|-------------|  
| 1 | Kick-off & Scaffold | Confirm spec, initialise repo with `yo code`, set up CI, Dev Container | Bare VSIX skeleton |  
| 2-3 | Webview Core | Build HTML shell, configure CSP, implement `projectAtlas.open`, live reload handshake | Webview loads local bundle |  
| 4-5 | Markdown & Mermaid | Integrate marked, highlight.js, mermaid; enable split preview & fenced block detection | Docs/diagram preview |  
| 6-7 | Workflow Renderer | Parse YAML/JSON, construct D3 flowchart, click-to-source | CI/CD visualiser |  
| 8-9 | Directory Graph | Recursive `workspace.findFiles`, adjacency builder, D3 force-layout | Interactive project map |  
| 10-11 | TypeScript Symbol Graph | Implement `TypeScriptProvider`, containment tree, call graph, navigation | TS/JS insight view |  
| 12 | Multi-Language Hook | Create `ISymbolProvider` interface, stub Python/Go providers | Extensible provider API |  
| 13 | UX Polish | Theme sync, search/filter palette, settings GUI, keyboard shortcuts | Feature-complete beta |  
| 14 | QA & Release | Unit + E2E tests, accessibility audit, docs, GIF demo, `vsce publish` | v0.1.0 on Marketplace |  

Daily stand-ups and nightly builds guard scope; non-critical niceties (e.g., complexity metrics, heat-maps) are queued for v0.2.

---

## 5  Team & Budget  

- **2 Senior Full-Stack Devs** (TypeScript, React, compiler APIs)  
- **1 QA / Accessibility Engineer**  
- **0.5 Technical Writer / DevRel**  

Cost: **2.5 FTE × 2 weeks × $2 000 = $10 000** plus 10 % contingency → **≈ $11 000**.

---

## 6  Risks & Mitigations  

- **Compressed Schedule:** Freeze scope after Day 3; nightly CI ensures continuous integration.  
- **Large Repos:** Incremental parsing, virtual scrolling, graph clustering.  
- **Language Edge-Cases:** Providers mark uncertain edges “experimental”; user toggle in settings.  
- **Bundle Size:** Tree-shaking, code-splitting; VSIX target <5 MB. [${DIA-SOURCE}](code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

## 7  Deliverables  

1. **VSIX Package:** `projectatlas-0.1.0.vsix`  
2. **Documentation:** README, quick-start, API guide.  
3. **Marketing Assets:** GIF preview, Marketplace description, social-media copy.  
4. **CI Pipeline:** GitHub Actions for lint, test, package.  

---

## 8  Future Roadmap (Post-MVP)  

- **v0.2:** Complexity heat-map, Git diff overlays, Rust/Kotlin providers.  
- **v1.0:** PlantUML & AsciiDoc renderers, collaborative graph sharing, export to PNG/SVG.  
- **v2.0:** Public extension API so third-party authors can add custom renderers and symbol providers.  

---

## 9  Conclusion  

In just two weeks, ProjectAtlas will give VS Code users a **panoramic, interactive atlas** of their entire codebase—documents, diagrams, workflows, directories and call graphs—without external dependencies. This unified perspective accelerates onboarding, debugging and architecture reviews, setting a new standard for in-editor visualisation. [${DIA-SOURCE}](github.com/microsoft/vscode-languageserver-node)
