import * as vscode from 'vscode';

export function createStatusBarItem(context: vscode.ExtensionContext): vscode.StatusBarItem | undefined {
  if (!vscode.workspace.getConfiguration('projectAtlas').get<boolean>('enableStatusBar')) return;
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);
  status.text = '$(graph) Atlas';
  status.tooltip = 'Open ProjectAtlas';
  status.command = 'projectAtlas.open';
  status.show();
  context.subscriptions.push(status);
  return status;
}
