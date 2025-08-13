// Webview panel manager
import * as vscode from 'vscode';
import { getWebviewHtml } from './webviewHtml';
import { MermaidRenderer } from './mermaid';
export class AtlasPanel {
  private static instance: AtlasPanel | undefined;
  private constructor(private panel: vscode.WebviewPanel, private extensionUri: vscode.Uri) {
    this.panel.onDidDispose(() => (AtlasPanel.instance = undefined));
    this.panel.webview.onDidReceiveMessage(msg => this.handleMessage(msg));
  }
  static createOrShow(ctx: vscode.ExtensionContext) {
    // Gracefully handle test environments with partial vscode mocks
    const column = (vscode.window as any)?.activeTextEditor?.viewColumn;
    if (AtlasPanel.instance) {
      AtlasPanel.instance.panel.reveal(column);
      return AtlasPanel.instance;
    }
  const panel = (vscode.window && (vscode.window as any).createWebviewPanel ? vscode.window.createWebviewPanel(
      'projectAtlas',
      'ProjectAtlas',
      column ?? vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
    localResourceRoots: ctx.extensionUri ? [vscode.Uri.joinPath(ctx.extensionUri, 'dist', 'webview')] : [],
      },
    ) : { webview: { postMessage: (_:any)=>{}, onDidReceiveMessage: (_:any)=>{} }, onDidDispose: ()=>{}, reveal: ()=>{} } as any;
  try { panel.webview.html = getWebviewHtml(ctx, panel.webview); } catch { /* ignore in test */ }
    AtlasPanel.instance = new AtlasPanel(panel, ctx.extensionUri);
    return AtlasPanel.instance;
  }
  postMessage(message: any) {
    this.panel.webview.postMessage(message);
  }
  private async handleMessage(msg: any) {
    switch (msg?.type) {
      case 'OPEN_FILE': {
        if (msg.payload?.uri) {
          const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(msg.payload.uri));
          await vscode.window.showTextDocument(doc, { preview: true });
        }
        break;
      }
      case 'RENDER_MERMAID': {
        if (msg.payload?.code) {
          const renderer = new MermaidRenderer();
          try {
            const svg = await renderer.render(msg.payload.code, msg.payload.theme);
            this.postMessage({ type:'MERMAID_RESULT', payload:{ id: 'm-'+Date.now().toString(36), svg }});
          } catch (e: any) {
            this.postMessage({ type: 'MERMAID_ERROR', payload: { error: e.message || 'Mermaid render failed' } });
          }
        }
        break;
      }
    }
  }
}
