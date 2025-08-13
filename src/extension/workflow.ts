import * as yaml from 'js-yaml';
import * as vscode from 'vscode';
export interface WorkflowNode { id: string; label: string; type: string; }
export interface WorkflowEdge { id: string; from: string; to: string; kind: string; }
export interface WorkflowGraph { nodes: WorkflowNode[]; edges: WorkflowEdge[]; }
export class WorkflowParser { parse(text: string): WorkflowGraph { try { const doc:any = yaml.load(text); const nodes:WorkflowNode[]=[]; const edges:WorkflowEdge[]=[]; if (doc && doc.jobs && typeof doc.jobs==='object') { for (const [jobName, jobSpec] of Object.entries<any>(doc.jobs)) { nodes.push({ id: jobName, label: jobName, type: 'job' }); const needs = jobSpec?.needs; if (Array.isArray(needs)) { for (const dep of needs) { edges.push({ id: `${dep}->${jobName}`, from: dep, to: jobName, kind: 'depends' }); } } else if (typeof needs==='string') { edges.push({ id: `${needs}->${jobName}`, from: needs, to: jobName, kind: 'depends' }); } } } return { nodes, edges }; } catch { return { nodes: [], edges: [] }; } } async parseFile(uri: vscode.Uri): Promise<WorkflowGraph> { const doc = await vscode.workspace.openTextDocument(uri); return this.parse(doc.getText()); }}
