## [0.1.0-beta] - 2025-08-13

### Added (Initial)

- Initial scaffold of ProjectAtlas extension (command, webview React base, TypeScript symbol provider stub).

---

## [0.1.1-beta] - 2025-08-13

### Added (Enhancements)

- D3 visualizations: directory tree (hierarchical) and workflow (force graph).
- Workflow YAML scanning (.github/workflows) aggregated into webview.
- Symbol graph enhancements: import edges, call edges (basic symbol resolution).
- Mermaid theming toggle with error reporting channel (MERMAID_ERROR).
- Incremental patch schema with deletions `{ nodesAdded, nodesRemoved, edgesAdded, edgesRemoved }`.

### Changed

- Refactored diff logic to produce structured patch; updated client merge logic.
- Reused ts-morph Project instance for faster rebuilds; debounced file-save recomputation (200ms).

### Tests

- Added patchSymbols unit tests and panel mermaid integration test (via jsdom).

### Documentation

- README updated with patch schema & new edge types.
