import React, { useEffect, useState } from 'react';
import './styles.css';
import { DirectoryGraphView, WorkflowGraphView } from './Graphs';
import { patchSymbols } from './patch';

const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

interface InitState { version?: string; directory?: { nodes: { id:string; name:string; type:string; parent?:string }[] }; workflows?: { nodes:any[]; edges:any[] }; symbols?: any; }
interface MermaidRender { id:string; svg:string; }

export const App: React.FC = () => {
	const [init, setInit] = useState<InitState | null>(null);
	const [markdown, setMarkdown] = useState<string>('');
	const [mermaids, setMermaids] = useState<MermaidRender[]>([]);
	const [pendingMermaid, setPendingMermaid] = useState<string[]>([]);
	const [theme, setTheme] = useState<'default' | 'dark'>('default');
	const [mermaidErrors, setMermaidErrors] = useState<string[]>([]);
	useEffect(() => {
		const listener = (e: MessageEvent) => {
			const msg = e.data;
			switch (msg?.type) {
				case 'INIT_STATE': setInit(msg.payload); break;
				case 'MARKDOWN_RENDER': {
					setMarkdown(msg.payload.html);
					  const found = Array.from(msg.payload.html.matchAll(/<code class=\"language-mermaid\">([\s\S]*?)<\/code>/g)).map((m:any)=>decodeHtml(m[1]));
					if (found.length) setPendingMermaid(found);
					break;
				}
				case 'GRAPH_UPDATE': setInit(i => i ? { ...i, symbols: msg.payload }: i); break;
				case 'MERMAID_RESULT': setMermaids(list => [...list, msg.payload]); break;
				case 'MERMAID_ERROR': setMermaidErrors(errs => [...errs, msg.payload?.error || 'Unknown mermaid error']); break;
				case 'SYMBOL_PATCH': setInit(i => i ? { ...i, symbols: patchSymbols(i.symbols, msg.payload) }: i); break;
				case 'WORKFLOW_UPDATE': setInit(i => i ? { ...i, workflows: msg.payload } : i); break;
			}
		};
		window.addEventListener('message', listener);
		return () => window.removeEventListener('message', listener);
	}, []);
	useEffect(() => {
		if (pendingMermaid.length && vscodeApi) {
			pendingMermaid.forEach(code => vscodeApi.postMessage({ type:'RENDER_MERMAID', payload:{ code, theme }}));
			setPendingMermaid([]);
		}
	}, [pendingMermaid, theme]);

	const dirNodes = init?.directory?.nodes || [];
	const workflow = init?.workflows;

	function toggleTheme(){ setTheme(t => t==='default' ? 'dark':'default'); setMermaids([]); // re-render
		// re-request mermaid diagrams for new theme
		const codes = Array.from(markdown.matchAll(/<code class=\"language-mermaid\">([\s\S]*?)<\/code>/g)).map((m:any)=>decodeHtml(m[1]));
		setPendingMermaid(codes);
	}
	return (
		<div className="container">
			<h1>ProjectAtlas <span className="badge">{init?.version || '…'}</span> <button onClick={toggleTheme} className="btn-small">Theme:{theme}</button></h1>
			<div className="flex">
				<div className="panel scroll">
					<h2>README</h2>
						<div dangerouslySetInnerHTML={{ __html: markdown }} />
						{mermaids.length > 0 && <div>
							<h3>Diagrams</h3>
							{mermaids.map(m => <div key={m.id} dangerouslySetInnerHTML={{ __html: m.svg }} />)}
						</div>}
						{mermaidErrors.length>0 && <div className="error-block"><h3>Diagram Errors</h3><ul>{mermaidErrors.map((e,i)=><li key={i}>{e}</li>)}</ul></div>}
				</div>
				<div className="panel scroll">
					<h2>Directory ({dirNodes.length})</h2>
					<DirectoryGraphView nodes={dirNodes} />
				</div>
				<div className="panel">
					<h2>Symbols</h2>
					<p>{init?.symbols?.nodes?.length ?? 0} nodes</p>
					{workflow && <div>
						<h3>Workflows</h3>
						<WorkflowGraphView graph={workflow} />
					</div>}
				</div>
			</div>
		</div>
	);
};

function decodeHtml(str:string){ return str.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }
// Removed duplicate decodeHtml function
