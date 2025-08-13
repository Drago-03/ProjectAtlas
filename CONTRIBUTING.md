# Contributing to ProjectAtlas

Thank you for your interest in contributing to ProjectAtlas! This guide will help you get started.

## Quick Start

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ProjectAtlas.git
   cd ProjectAtlas
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build and Test**

   ```bash
   npm run build
   npm test
   ```

4. **Start Development**

   - Open VS Code in the project directory
   - Press `F5` to launch the Extension Development Host
   - Or use `Ctrl+Shift+P` > "Developer: Reload Window" to reload changes

## Development Workflow

### Code Standards

- Use TypeScript for all source code
- Follow the existing code style (ESLint + Prettier configured)
- Add comments for complex logic and all public APIs
- Write unit tests for new functionality

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the coding standards
3. Test your changes thoroughly
4. Update documentation if needed
5. Update CHANGELOG.md with your changes
6. Commit with clear, descriptive messages

### Pull Request Process

1. Ensure all tests pass: `npm test`
2. Ensure code is properly formatted: `npm run format`
3. Ensure no linting errors: `npm run lint`
4. Update documentation for any API changes
5. Submit a pull request with a clear description of changes

## Project Structure

See [docs/basic_instructions.md](docs/basic_instructions.md) for detailed information about:

- Repository structure
- Setup instructions
- Coding standards
- Documentation requirements

## Getting Help

- Check existing [issues](https://github.com/Drago-03/ProjectAtlas/issues)
- Read the [documentation](docs/)
- Ask questions in issue discussions

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
