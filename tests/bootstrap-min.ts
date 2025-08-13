// Minimal bootstrap: only set NODE_PATH for local vscode stub.
import * as path from 'path';
const stubPath = path.resolve(process.cwd(), 'testRuntime');
const existing = process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '';
process.env.NODE_PATH = existing + stubPath;
require('module').Module._initPaths();
