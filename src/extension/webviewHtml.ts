// HTML generation for webview
import * as vscode from 'vscode';
export function getWebviewHtml(ctx: vscode.ExtensionContext, webview: vscode.Webview): string {
  const buildRoot = vscode.Uri.joinPath(ctx.extensionUri, 'dist', 'webview');
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(buildRoot, 'assets', 'index.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(buildRoot, 'assets', 'index.css'));
  const nonce = getNonce();
  return `<!DOCTYPE html><html lang="en"><head><meta charset='UTF-8'><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" /><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ProjectAtlas</title><link rel="stylesheet" href="${styleUri}" /></head><body><div id='root'>Loading ProjectAtlas UI...</div><script nonce='${nonce}' src='${scriptUri}'></script></body></html>`;
}
function getNonce(){let text='';const possible='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';for(let i=0;i<32;i++){text+=possible.charAt(Math.floor(Math.random()*possible.length));}return text;}
