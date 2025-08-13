// Extension activation & command registration
import * as vscode from 'vscode';
import { AtlasPanel } from './panel';
import { TypeScriptProvider } from '../symbolProviders/typescriptProvider';
import { buildDirectoryGraph } from './fsGraph';
import { MarkdownRenderer } from './markdown';
import { MermaidRenderer } from './mermaid';
import { WorkflowParser } from './workflow';
import { SymbolGraph } from '../symbolProviders/types';
import { diffGraphs, SymbolGraphPatch } from './diff';

const symbolProviders = [new TypeScriptProvider()]; // future: push more providers
let lastSymbolGraph: SymbolGraph | undefined;
let lastWorkflowGraph: { nodes:any[]; edges:any[] } | undefined;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('projectAtlas.open', async () => {
    const panel = AtlasPanel.createOrShow(context);
    // Initial state push
    sendInit(panel, context);
    // Rebuild symbols on file save
    let debounceTimer: NodeJS.Timeout | undefined;
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const graph = await buildSymbolGraph();
          const patch = diffGraphs(lastSymbolGraph, graph);
          lastSymbolGraph = graph;
            if (patch) {
              panel.postMessage({ type: 'SYMBOL_PATCH', payload: patch });
            } else {
              panel.postMessage({ type: 'GRAPH_UPDATE', payload: graph });
            }
        }, 200);
      })
    );
      // Workflow graph watcher (cache + incremental update trigger)
      const wfWatcher = vscode.workspace.createFileSystemWatcher('**/.github/workflows/*.{yml,yaml}');
      const rebuild = async () => {
        const parser = new WorkflowParser();
        const wf = await parseWorkflows(parser);
        lastWorkflowGraph = wf;
        panel.postMessage({ type: 'WORKFLOW_UPDATE', payload: wf });
      };
      wfWatcher.onDidChange(rebuild);
      wfWatcher.onDidCreate(rebuild);
      wfWatcher.onDidDelete(rebuild);
      context.subscriptions.push(wfWatcher);
  });
  context.subscriptions.push(disposable);
}
export function deactivate() {}

async function buildSymbolGraph(): Promise<SymbolGraph> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  const aggregate: SymbolGraph = { nodes: [], edges: [], diagnostics: [] };
  for (const p of symbolProviders) {
    try {
      const g = await p.build(root);
      aggregate.nodes.push(...g.nodes);
      aggregate.edges.push(...g.edges);
      if (g.diagnostics) aggregate.diagnostics?.push(...g.diagnostics);
    } catch (e: any) {
      aggregate.diagnostics?.push(`Provider ${p.constructor.name} failed: ${e.message}`);
    }
  }
  return aggregate;
}


async function sendInit(panel: AtlasPanel, ctx: vscode.ExtensionContext) {
  const md = new MarkdownRenderer();
  const mermaid = new MermaidRenderer();
  const workflow = new WorkflowParser();
  const dirGraph = await buildDirectoryGraph();
  // Use cached workflow graph if available (populated by watcher) otherwise parse now
  const workflowGraph = lastWorkflowGraph || await parseWorkflows(workflow);
  const symbolGraph = await buildSymbolGraph();
  lastSymbolGraph = symbolGraph;
  panel.postMessage({
    type: 'INIT_STATE',
    payload: {
      version: ctx.extension.packageJSON?.version,
      directory: dirGraph,
      workflows: workflowGraph,
      symbols: symbolGraph,
      capabilities: { markdown: true, mermaid: true, workflow: true },
    },
  });
  // Pre-render README if present
  const readme = vscode.workspace.workspaceFolders && await vscode.workspace.findFiles('README.md', '**/node_modules/**', 1);
  if (readme && readme[0]) {
    const doc = await vscode.workspace.openTextDocument(readme[0]);
    const html = md.render(doc.getText());
    panel.postMessage({ type: 'MARKDOWN_RENDER', payload: { uri: doc.uri.toString(), html } });
  }
}

// (Testing of diff logic now via diff.ts directly)

async function parseWorkflows(parser: WorkflowParser) {
  const files = await vscode.workspace.findFiles('.github/workflows/*.y?(a)ml');
  const aggregate = { nodes: [], edges: [] } as { nodes: any[]; edges: any[] };
  for (const f of files) {
    try {
      const g = await parser.parseFile(f);
      // prefix ids with filename to avoid collisions
      const prefix = f.path.split('/').pop();
  aggregate.nodes.push(...g.nodes.map((n: any) => ({ ...n, id: `${prefix}:${n.id}` })));
  aggregate.edges.push(...g.edges.map((e: any) => ({ ...e, id: `${prefix}:${e.id}`, from: `${prefix}:${e.from}`, to: `${prefix}:${e.to}` })));
    } catch {
      // ignore parse errors
    }
  }
  return aggregate;
}
