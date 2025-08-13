// Local vscode stub module for tests (no monkey patching Module._load needed)
module.exports = {
  workspace: {
    workspaceFolders: [],
    findFiles: async () => [],
    onDidSaveTextDocument: () => ({ dispose() {} }),
    createFileSystemWatcher: () => ({ onDidChange() {}, onDidCreate() {}, onDidDelete() {}, dispose() {} }),
    openTextDocument: async () => ({ getText: () => '' })
  },
  window: {
    activeTextEditor: undefined,
    createWebviewPanel: () => ({
      webview: { postMessage: () => false, onDidReceiveMessage: () => {} },
      onDidDispose: () => {},
      reveal: () => {}
    }),
    showTextDocument: async () => {}
  },
  commands: { registerCommand: () => ({ dispose() {} }), getCommands: async () => ['projectAtlas.open'] },
  Uri: { joinPath: (...parts) => ({ fsPath: parts.join('/'), toString: () => parts.join('/') }), parse: v => ({ toString: () => v }) }
};
