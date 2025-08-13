// HTML generation for webview
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getWebviewHtml(ctx: vscode.ExtensionContext, webview: vscode.Webview): string {
  const buildRoot = vscode.Uri.joinPath(ctx.extensionUri, 'dist', 'webview');
  
  // Read the actual built index.html to get the correct asset names
  try {
    const htmlPath = path.join(ctx.extensionUri.fsPath, 'dist', 'webview', 'index.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Replace relative paths with webview URIs
      html = html.replace(/href="\.\/([^"]+)"/g, (match, filename) => {
        const fileUri = webview.asWebviewUri(vscode.Uri.joinPath(buildRoot, filename));
        return `href="${fileUri}"`;
      });
      
      html = html.replace(/src="\.\/([^"]+)"/g, (match, filename) => {
        const fileUri = webview.asWebviewUri(vscode.Uri.joinPath(buildRoot, filename));
        return `src="${fileUri}"`;
      });
      
      // Add nonce for security
      const nonce = getNonce();
      html = html.replace(/<script/g, `<script nonce="${nonce}"`);
      
      // Update CSP
      html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, 
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />`);
      
      return html;
    }
  } catch (error) {
    console.error('Failed to read built HTML:', error);
  }
  
  // Fallback: try to find assets dynamically
  const buildPath = path.join(ctx.extensionUri.fsPath, 'dist', 'webview');
  let scriptFile = '';
  let styleFile = '';
  
  try {
    const files = fs.readdirSync(buildPath);
    scriptFile = files.find(f => f.startsWith('index-') && f.endsWith('.js')) || 'index.js';
    styleFile = files.find(f => f.startsWith('index-') && f.endsWith('.css')) || 'index.css';
  } catch (error) {
    console.error('Failed to read webview directory:', error);
    scriptFile = 'index.js';
    styleFile = 'index.css';
  }
  
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(buildRoot, scriptFile));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(buildRoot, styleFile));
  const nonce = getNonce();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset='UTF-8'>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ProjectAtlas</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id='root'>Loading ProjectAtlas UI...</div>
  <script nonce='${nonce}' src='${scriptUri}'></script>
</body>
</html>`;
}

function getNonce(){
  let text='';
  const possible='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for(let i=0;i<32;i++){
    text+=possible.charAt(Math.floor(Math.random()*possible.length));
  }
  return text;
}
