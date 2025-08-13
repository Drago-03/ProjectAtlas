import { expect } from 'chai';
import { TypeScriptProvider } from '../src/symbolProviders/typescriptProvider';
import * as fs from 'fs';
import * as path from 'path';

describe('TypeScriptProvider import edges', () => {
  const tempRoot = path.join(process.cwd(), 'temp_ts_import_project');
  before(() => {
    if (!fs.existsSync(tempRoot)) fs.mkdirSync(tempRoot);
    fs.writeFileSync(path.join(tempRoot, 'a.ts'), 'export function foo(){}');
    fs.writeFileSync(path.join(tempRoot, 'b.ts'), 'import { foo } from "./a"; foo();');
    fs.writeFileSync(path.join(tempRoot, 'tsconfig.json'), JSON.stringify({ compilerOptions:{ module:"commonjs", target:"ES2022" }, include:["**/*.ts"] }));
  });
  it('produces an import edge', async () => {
    const provider = new TypeScriptProvider();
    const graph = await provider.build(tempRoot);
    const importEdge = graph.edges.find(e => e.kind === 'imports');
    expect(importEdge).to.exist;
  });
});
