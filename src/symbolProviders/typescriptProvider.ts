// Minimal TypeScript/JavaScript symbol provider
import { Project, SyntaxKind, Node, CallExpression, ImportDeclaration, FunctionDeclaration } from 'ts-morph';
import { ISymbolProvider, SymbolGraph } from './types';
import * as path from 'path';

export class TypeScriptProvider implements ISymbolProvider {
	languageIds = ['typescript', 'javascript'];
	private static projectCache: Project | undefined;

	async build(workspaceRoot: string): Promise<SymbolGraph> {
		// debug
		if (process.env.ATLAS_DEBUG) {
			// eslint-disable-next-line no-console
			console.log('[TypeScriptProvider] build root', workspaceRoot);
		}
		const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');
		if (!TypeScriptProvider.projectCache) {
			TypeScriptProvider.projectCache = new Project({ tsConfigFilePath: tsconfigPath, skipAddingFilesFromTsConfig: false });
		} else {
			// Simplicity & compatibility: always recreate project per build (moderate cost acceptable for tests)
			TypeScriptProvider.projectCache = new Project({ tsConfigFilePath: tsconfigPath, skipAddingFilesFromTsConfig: false });
		}
		const project = TypeScriptProvider.projectCache;
		const nodes: SymbolGraph['nodes'] = [];
		const edges: SymbolGraph['edges'] = [];

		// Collect function declarations for call edge mapping (symbol-based)
		const functionMap = new Map<string, string>(); // symbolId -> nodeId
		for (const source of project.getSourceFiles()) {
			const fileId = source.getFilePath();
				source.forEachChild((child: Node) => {
				const kind = SyntaxKind[child.getKind()];
				// getName not present on all nodes
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const name = (child as any).getName?.() || kind;
				const id = `${fileId}::${name}`;
				nodes.push({ id, kind, label: name, file: fileId });
					if (child.getKind() === SyntaxKind.FunctionDeclaration && name) {
						const sym = (child as FunctionDeclaration).getSymbol();
						if (sym) {
							functionMap.set(sym.getFullyQualifiedName(), id);
						}
				}
			});
			// import edges (file level)
			for (const imp of source.getImportDeclarations()) {
				const spec = (imp as ImportDeclaration).getModuleSpecifierValue();
				const edgeId = `${fileId}->import:${spec}`;
				edges.push({ id: edgeId, from: fileId, to: spec, kind: 'imports' });
			}
		}
		// Call edges: scan of call expressions referencing known functions; create per-function caller pseudo nodes
		for (const source of project.getSourceFiles()) {
			const fileId = source.getFilePath();
			source.forEachDescendant(node => {
				if (node.getKind() === SyntaxKind.CallExpression) {
					const call = node as CallExpression;
					const exprSymbol = call.getExpression().getSymbol();
					if (exprSymbol) {
						const fq = exprSymbol.getFullyQualifiedName();
						const callee = functionMap.get(fq);
						if (callee) {
							// Determine owning function for caller context
							const func = call.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) as FunctionDeclaration | undefined;
							let caller: string;
							if (func) {
								const fnSym = func.getSymbol();
								const fnFq = fnSym?.getFullyQualifiedName();
								caller = fnFq ? `${fileId}::caller:${fnFq}` : `${fileId}::(file)`;
								if (!nodes.find(n => n.id === caller)) {
									nodes.push({ id: caller, kind: 'Caller', label: `(caller) ${(func as any).getName?.()||'anon'}`, file: fileId });
								}
							} else {
								caller = `${fileId}::(file)`;
								if (!nodes.find(n => n.id === caller)) {
									nodes.push({ id: caller, kind: 'File', label: `(file) ${fileId.split('/').pop()}`, file: fileId });
								}
							}
							const edgeId = `${caller}->${callee}`;
							if (!edges.find(e => e.id === edgeId)) edges.push({ id: edgeId, from: caller, to: callee, kind: 'calls' });
						}
					}
				}
			});
		}
		return { nodes, edges };
	}
}
