# ProjectAtlas – Basic Instructions

Welcome to the ProjectAtlas repository! This document provides step-by-step instructions for setting up, developing, and maintaining a clean, well-documented codebase for the ProjectAtlas VS Code extension. Follow these guidelines to ensure consistency, clarity, and ease of contribution.

---

## 1. Repository Structure

The root directory should remain uncluttered. Each major component and resource must reside in its own dedicated folder. The recommended structure is:

```
/ProjectAtlas
│
├── .vscode/                  # VS Code workspace settings
├── src/                      # Extension source code (TypeScript)
│   ├── extension/            # Extension activation, commands, API
│   ├── webview/              # React (Vite) SPA for rendering UI
│   └── symbolProviders/      # Language-specific symbol extraction
├── media/                    # Static assets (images, icons, CSS)
├── docs/                     # Documentation files
│   ├── basic_instructions.md
│   ├── API.md
│   └── architecture.md
├── tests/                    # Unit and integration tests
├── CHANGELOG.md              # Project changelog
├── VERSION                   # Current version (e.g., 0.1.0-beta)
├── package.json              # Node.js project metadata
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration for webview
├── .gitignore                # Files and folders to ignore in Git
├── README.md                 # Project overview and quick start
└── LICENSE                   # Open source license (MIT)
```

---

## 2. Setting Up the Project

1. **Clone the Repository:**
   ```
   git clone https://github.com/your-org/ProjectAtlas.git
   cd ProjectAtlas
   ```

2. **Install Dependencies:**
   ```
   npm install
   ```

3. **Build the Extension:**
   ```
   npm run build
   ```

4. **Open in VS Code:**
   - Launch VS Code in the project directory.
   - Press `F5` to open a new Extension Development Host window.

---

## 3. Coding Standards

- **TypeScript Only:** All source code must be written in TypeScript.
- **Component Placement:** Each module/component must be placed in its relevant directory.
- **Commenting:**  
  - Every file should begin with a brief comment describing its purpose.
  - All functions, classes, and significant code blocks must have descriptive comments explaining their logic and usage.
- **Naming:** Use clear, descriptive, and consistent names for files, variables, and functions.
- **Imports:** Prefer absolute imports based on the project root for clarity.
- **Formatting:** Follow Prettier and ESLint rules for formatting and linting.

---

## 4. Documentation

- **README.md:**  
  - Overview, features, installation, usage, and contribution guidelines.
- **docs/basic_instructions.md:**  
  - This file, providing setup and contribution basics.
- **docs/API.md:**  
  - Detailed API documentation for extension commands, settings, and message passing.
- **docs/architecture.md:**  
  - High-level and low-level architectural diagrams and explanations.
- **CHANGELOG.md:**  
  - Every release must be documented with version, date, and changes.
- **VERSION:**  
  - A single line with the current release version (e.g., `0.1.0-beta`).

---

## 5. Extension Accessibility & Usage

- The extension must be discoverable via the VS Code command palette as "ProjectAtlas: Open".
- All features (Markdown/Mermaid/YAML/JSON/symbol graphs) should be accessible from the main UI.
- No feature should require manual configuration beyond initial install.
- The extension must work out of the box on Windows, macOS, and Linux.

---

## 6. Contribution Guidelines

- Fork the repository and create a feature branch for your changes.
- Write clear, well-commented code.
- Update documentation and changelog for every user-facing or internal change.
- Ensure all tests pass before submitting a pull request.
- Reviewers will check for code clarity, documentation, and adherence to the project structure.

---

## 7. Versioning

- Follow [Semantic Versioning](https://semver.org/).
- The initial release is `0.1.0-beta`, as recorded in the VERSION file and CHANGELOG.md.

---

## 8. Changelog Example (CHANGELOG.md)

```
## [0.1.0-beta] - 2025-08-13
### Added
- Initial beta release of ProjectAtlas
- Live preview for Markdown, Mermaid, YAML/JSON workflows
- Directory and dependency graph visualisation
- Symbol and call-graph extraction for TypeScript/JavaScript
- Extensible architecture for future language support
```

---

## 9. Best Practices

- Keep the root directory clean—no stray files or scripts.
- Place all assets, tests, and docs in their respective folders.
- Use meaningful commit messages.
- Maintain up-to-date documentation and changelog.
- Prioritize code readability and maintainability.

---

By following these instructions, you will help ensure that ProjectAtlas remains a robust, accessible, and well-maintained open-source project.