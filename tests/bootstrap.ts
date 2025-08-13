// Unified test bootstrap: sets NODE_PATH so local vscode stub is resolved naturally.
import * as path from 'path';
const stubPath = path.resolve(process.cwd(), 'testRuntime');
const existing = process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '';
process.env.NODE_PATH = existing + stubPath;
// Re-initialize module paths after changing NODE_PATH
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('module').Module._initPaths();

// jsdom environment
try {
  if (!(global as any).window) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    try { (global as any).navigator = { userAgent: 'node.js' }; } catch {}
  }
} catch {}
