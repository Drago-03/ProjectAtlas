// Shared harness to import extension with a mocked 'vscode' module.
// Avoids each test monkey patching Module._load repeatedly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalLoad = Module._load;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Module._load = function(request: string, parent: any, isMain: boolean) {
  if (request === 'vscode') {
    return { workspace: { workspaceFolders: [] }, commands: { registerCommand: () => ({ dispose(){} }) } };
  }
  return originalLoad.apply(this, arguments as any);
};
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ext = require('../src/extension/extension');
// Restore immediately
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Module._load = originalLoad;
export const __test = ext.__test;
