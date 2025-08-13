import { expect } from 'chai';
// Capture messages posted by panel
const posted: any[] = [];
// Mock vscode before importing panel
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalLoad = (Module as any)._load;
let receive: (m:any)=>void = ()=>{};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._load = function(request: string) {
  if (request === 'vscode') {
    return {
      window: {
        activeTextEditor: undefined,
        createWebviewPanel: () => ({
          webview: {
            postMessage: (m:any)=>posted.push(m),
            onDidReceiveMessage: (cb:any)=>{ receive = cb; }
          },
          onDidDispose: () => {},
          reveal: () => {}
        }),
        ViewColumn: { Active: 1 }
      },
      Uri: { joinPath: () => ({}) },
      workspace: { openTextDocument: async ()=>({ getText:()=>''}) }
    };
  }
  return originalLoad.apply(this, arguments as any);
};
// Import after mock
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AtlasPanel } = require('../src/extension/panel');

describe('Mermaid panel integration', () => {
  it('renders diagram via message', async () => {
    AtlasPanel.createOrShow({ extensionUri: {}, extension: { packageJSON: {} } } as any);
    receive({ type:'RENDER_MERMAID', payload:{ code:'graph TD;A-->B;', theme:'default' } });
    await new Promise(r=>setTimeout(r,80));
    expect(posted.find(m=>m.type==='MERMAID_RESULT')).to.exist;
  });
});

// Restore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._load = originalLoad;
