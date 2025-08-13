#!/bin/bash

# ProjectAtlas Development Helper Script
# This script provides common development commands

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[ProjectAtlas]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Help function
show_help() {
    echo "ProjectAtlas Development Helper"
    echo ""
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Install dependencies and build the project"
    echo "  build     - Build the extension and webview"
    echo "  test      - Run all tests"
    echo "  lint      - Run linting and formatting checks"
    echo "  fix       - Fix linting and formatting issues"
    echo "  clean     - Clean build outputs"
    echo "  package   - Create a VSIX package"
    echo "  dev       - Start development mode (build + watch)"
    echo "  help      - Show this help message"
}

# Setup function
setup() {
    print_step "Setting up ProjectAtlas development environment..."
    npm install
    npm run build
    print_success "Setup complete! You can now run 'npm test' or press F5 in VS Code."
}

# Build function
build() {
    print_step "Building ProjectAtlas..."
    npm run build
    print_success "Build complete!"
}

# Test function
test() {
    print_step "Running tests..."
    npm test
    print_success "All tests passed!"
}

# Lint function
lint() {
    print_step "Running linting checks..."
    
    print_step "Running TypeScript/JavaScript linting..."
    if npm run lint; then
        print_success "TypeScript/JavaScript linting passed!"
    else
        print_warning "TypeScript/JavaScript linting found issues (warnings are acceptable)"
    fi
    
    print_step "Running Markdown linting..."
    if npm run lint:md; then
        print_success "Markdown linting passed!"
    else
        print_warning "Markdown linting found issues (some are acceptable)"
    fi
    
    print_success "Linting complete!"
}

# Fix function
fix() {
    print_step "Fixing linting and formatting issues..."
    npm run format
    print_success "Formatting complete!"
}

# Clean function
clean() {
    print_step "Cleaning build outputs..."
    npm run clean
    print_success "Clean complete!"
}

# Package function
package() {
    print_step "Creating VSIX package..."
    npm run package
    print_success "Package created!"
}

# Development mode
dev() {
    print_step "Starting development mode..."
    print_warning "This will run in watch mode. Press Ctrl+C to stop."
    npm run watch
}

# Main script logic
case "${1:-help}" in
    setup)
        setup
        ;;
    build)
        build
        ;;
    test)
        test
        ;;
    lint)
        lint
        ;;
    fix)
        fix
        ;;
    clean)
        clean
        ;;
    package)
        package
        ;;
    dev)
        dev
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
