# Changelog

All notable changes to this project will be documented in this file. The format follows Keep a Changelog guidelines.

## [0.2.3] - 2025-08-13

### Added

- **Comprehensive Development Documentation**: Complete basic instructions guide with setup, coding standards, and contribution workflow
- **VS Code Workspace Configuration**: Enhanced settings, launch configurations, tasks, and recommended extensions
- **Contributing Guide**: Step-by-step contribution workflow documentation
- **Development Helper Script**: `scripts/dev.sh` with common development commands (setup, build, test, lint, package)
- **Code Quality Tools**: ESLint configuration with TypeScript support and environment-specific rules
- **Prettier Configuration**: Consistent code formatting rules for TypeScript and Markdown
- **Markdown Linting**: Reasonable markdown standards with `.markdownlint.json`
- **Professional README**: Modern, aesthetic, marketplace-ready documentation with animations

### Changed

- **README Redesign**: Complete overhaul with modern styling, animated badges, and professional presentation
- **Package Management**: Updated to v0.2.3 with improved build process and cleaner package structure
- **Code Quality**: Improved linting from 25 errors to 8 warnings (no errors)
- **Documentation Structure**: Enhanced linking between basic instructions, contributing guide, and architecture docs
- **Repository Structure**: Verified compliance with recommended directory organization
- **Development Workflow**: Streamlined with helper scripts and automated tasks

### Improved

- **ESLint Configuration**: Better support for Node.js and browser environments with proper globals
- **VS Code Integration**: Enhanced debugging, tasks, and extension recommendations
- **Performance Metrics**: Added clear benchmarks and technical specifications to documentation
- **Marketplace Readiness**: Professional presentation optimized for VS Code Marketplace
- **Build Process**: Verified and optimized extension (10.1MB) and webview (207KB) bundles

### Removed

- **Contributors Section**: Removed from README for professional marketplace presentation
- **Legacy Packages**: Cleaned up older v0.2.1 and v0.2.2 VSIX files

## [0.2.2] - 2025-08-13

### Changed (0.2.1)

- Version bump only (documentation & security matrix update). No code changes since 0.2.1.

## [0.2.1] - 2025-08-13

### Added

- Python & Go provider stubs (diagnostic-only placeholders) registered.
- Search / filter UI (directory name substring filtering).
- Initial public extension API export `getProjectAtlasApi()` returning provider registration hook.
- Status bar entry (toggle via `projectAtlas.enableStatusBar`).
- Activity bar view container + dashboard tree view.
- Explorer & editor context menu command: "ProjectAtlas: Open".
- Walkthrough (Get Started) with initial steps.
- Settings: showWelcomeOnStartup, enableStatusBar.
- Notification on activation (quick open shortcut).
- Hover provider (TypeScript symbols preview message).
- Bundled extension with esbuild (single file output) + .vscodeignore slimming groundwork.
- New 16px activity icon SVG.
- Status bar helper + unit test for disabled state.
- Dynamic (lazy) mermaid import to defer heavy dependency load.

### Changed

- Package JSON contributions expanded (menus, views, walkthroughs, settings).
- Build pipeline switched from tsc emit to esbuild bundling.
- Reduced packaged surface (planned further pruning of unused dist/test sources).

### Planned / In Progress (0.2.1)

- Additional slimming: exclude tests & source maps from VSIX (phase 2) and optional code-splitting for webview.
- Rich per-function caller nodes (design drafted; not yet emitted).
- Collapsible symbol groups (UI not implemented yet).
- Diagram export (SVG/PNG) & PlantUML renderer (pending design / deps choice).
- Multi-root workspace aggregation (future enhancement; current: first workspace only).
- Public provider plugin loading (scaffolding begun via API exposure).

## [Unreleased]

### Planned (see Roadmap)

- Rich per-function caller nodes & collapsible groups.
- Diagram export (SVG/PNG) & PlantUML support.
- Multi-root workspace aggregation.
- Public extension API for custom symbol providers & render plugins.

## [0.1.1] - 2025-08-13

### Added (0.1.1)

- D3 visualizations: directory tree (hierarchical) and workflow graph (job dependency DAG).
- Workflow YAML scanning of `.github/workflows` with live watcher dispatching `WORKFLOW_UPDATE`.
- Symbol graph enhancements: import edges, basic call edges.
- Mermaid theming awareness + explicit error reporting (`MERMAID_ERROR`).
- Incremental patch schema including deletions `{nodesAdded,nodesRemoved,edgesAdded,edgesRemoved}`.

### Changed (0.1.1)

- Extracted diff logic to isolated module for pure testing.
- Debounced file-save recomputation (200ms) for symbol/workflow rebuild.

### Tests (0.1.1)

- Added unit tests for patch merging and diff logic.
- Added panel mermaid integration test (jsdom guarded environment).

### Documentation (0.1.1)

- Rewritten README with features, patch protocol, roadmap.

## [0.1.0] - 2025-08-13

### Added (0.1.0)

- Initial scaffold: activation command `projectAtlas.open`, React webview shell, TypeScript symbol provider (baseline), Markdown + Mermaid rendering.

---

## Roadmap Snapshot

| Version | Planned Items |
|---------|---------------|
| 0.2 | Python / Go provider stubs, search/filter UI |
| 0.3 | Rich call graph (per-function caller nodes), collapse/expand groups |
| 0.4 | Export diagrams (SVG/PNG), PlantUML support |
| 0.5 | Multi-repo / workspace multi-root aggregation |
| 1.0 | Extension API: custom symbol providers & render plugins |
