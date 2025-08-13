import * as vscode from 'vscode';
import * as path from 'path';
export interface DirNode { id: string; name: string; path: string; type: 'file' | 'dir'; parent?: string; }
export interface DirGraph { nodes: DirNode[]; }
export async function buildDirectoryGraph(): Promise<DirGraph> { const root = vscode.workspace.workspaceFolders?.[0]; if (!root) return { nodes: [] }; const nodes: DirNode[] = []; async function walk(dir: vscode.Uri, parent?: string) { const entries = await vscode.workspace.fs.readDirectory(dir); for (const [name, fileType] of entries) { const full = vscode.Uri.joinPath(dir, name); const id = full.fsPath; const isDir = fileType === vscode.FileType.Directory; nodes.push({ id, name, path: id, type: isDir ? 'dir':'file', parent }); if (isDir) await walk(full, id); } } await walk(root.uri); return { nodes }; }
