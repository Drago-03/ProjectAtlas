import { expect } from 'chai';
import { patchSymbols } from '../src/webview/ui/patch';

describe('patchSymbols utility', () => {
  it('applies additions', () => {
    const base = { nodes: [{ id:'a'}], edges: [] };
    const patch = { nodesAdded:[{ id:'b'}], nodesRemoved:[], edgesAdded:[], edgesRemoved:[] };
    const result = patchSymbols(base, patch);
  expect(result.nodes.map((n:any)=>n.id).sort()).to.deep.equal(['a','b']);
  });
  it('applies removals', () => {
    const base = { nodes: [{ id:'a'},{id:'b'}], edges: [{id:'e1'}] };
    const patch = { nodesAdded:[], nodesRemoved:['b'], edgesAdded:[], edgesRemoved:[] };
    const result = patchSymbols(base, patch);
  expect(result.nodes.map((n:any)=>n.id)).to.deep.equal(['a']);
  });
  it('adds and removes edges', () => {
    const base = { nodes: [], edges: [{id:'e1'}] };
    const patch = { nodesAdded:[], nodesRemoved:[], edgesAdded:[{id:'e2'}], edgesRemoved:['e1'] };
    const result = patchSymbols(base, patch);
  expect(result.edges.map((e:any)=>e.id)).to.deep.equal(['e2']);
  });
});
