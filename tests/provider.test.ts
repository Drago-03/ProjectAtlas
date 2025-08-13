import { TypeScriptProvider } from '../src/symbolProviders/typescriptProvider';
import { strict as assert } from 'assert';
import * as path from 'path';

describe('TypeScriptProvider', () => {
  it('builds a graph (no crash)', async () => {
    const provider = new TypeScriptProvider();
    const graph = await provider.build(path.resolve('.'));
    assert.ok(Array.isArray(graph.nodes));
  });
});
