// Global vscode module stub for tests (loaded via mocha --require)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalLoad = Module._load;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Module._load = function(request: string, parent: any, isMain: boolean) {
  if (request === 'vscode') {
    return {
      workspace: {
        workspaceFolders: [],
        findFiles: async () => [],
        onDidSaveTextDocument: () => ({ dispose() {} }),
        createFileSystemWatcher: () => ({ onDidChange() {}, onDidCreate() {}, onDidDelete() {}, dispose() {} })
      },
      commands: { registerCommand: () => ({ dispose() {} }) }
    };
  }
  return originalLoad.apply(this, arguments);
};
