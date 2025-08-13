import { ISymbolProvider, SymbolGraph } from './types';
abstract class Stub implements ISymbolProvider { abstract languageIds: string[]; constructor(private label: string) {} async build(): Promise<SymbolGraph> { return { nodes: [], edges: [], diagnostics: [`${this.label} provider not implemented`] }; } }
export class PythonProvider extends Stub { languageIds = ['python']; constructor(){ super('Python'); } }
export class GoProvider extends Stub { languageIds = ['go']; constructor(){ super('Go'); } }
export class JavaProvider extends Stub { languageIds = ['java']; constructor(){ super('Java'); } }
export class CSharpProvider extends Stub { languageIds = ['csharp']; constructor(){ super('C#'); } }
