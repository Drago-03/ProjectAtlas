// Custom Mocha runner to avoid loader interference issues.
console.log('[runner] start');
const Mocha = require('mocha');
console.log('[runner] mocha loaded');
const glob = require('glob');
console.log('[runner] glob loaded');
// Provide a global stub for 'vscode' so extension modules can be imported in tests without the real API.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalLoad = Module._load;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Module._load = function(request, parent, isMain) {
  if (request === 'vscode') {
    return {
      workspace: { workspaceFolders: [], findFiles: async () => [], onDidSaveTextDocument: () => ({ dispose(){} }), createFileSystemWatcher: () => ({ onDidChange() {}, onDidCreate() {}, onDidDelete() {}, dispose() {} }) },
      commands: { registerCommand: () => ({ dispose() {} }) }
    };
  }
  return originalLoad.apply(this, arguments);
};
console.log('[runner] loader patched');

const mocha = new Mocha({ reporter: 'spec' });
// Disabled testSetup pending stabilization of jsdom in custom runner
// try { require('../dist/tests/testSetup.js'); console.log('[runner] testSetup loaded'); } catch(e) { console.error('[runner] failed to load testSetup', e); }
const files = glob.sync('dist/tests/**/*.test.js');
console.log('Discovered test files:', files.length);
files.forEach(f => { console.log('Adding test file', f); mocha.addFile(f); });
console.log('[runner] starting mocha run');
mocha.run(failures => {
  // restore loader
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Module._load = originalLoad;
  process.exitCode = failures ? 1 : 0;
});
