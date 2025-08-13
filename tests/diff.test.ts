import { expect } from 'chai';
import { diffGraphs } from '../src/extension/diff';

describe('Symbol diff (internal)', () => {
  it('returns null when previous undefined', () => {
  const diff = diffGraphs(undefined, { nodes: [], edges: [] } as any);
    expect(diff).to.equal(null);
  });
  it('produces patch with new node', () => {
    const prev = { nodes: [{ id: 'a', kind: 'X', label: 'A' }], edges: [] };
    const next = { nodes: [{ id: 'a', kind: 'X', label: 'A' }, { id: 'b', kind: 'Y', label: 'B' }], edges: [] };
  const patch = diffGraphs(prev as any, next as any);
  expect(patch?.nodesAdded.map((n: any) => n.id)).to.deep.equal(['b']);
  expect(patch?.nodesRemoved).to.deep.equal([]);
  });
  it('detects node removal', () => {
    const prev = { nodes: [{ id: 'a', kind:'T', label:'A' }, { id:'b', kind:'T', label:'B'}], edges: [] };
    const next = { nodes: [{ id: 'a', kind:'T', label:'A'}], edges: [] };
  const patch = diffGraphs(prev as any, next as any);
    expect(patch?.nodesRemoved).to.deep.equal(['b']);
  });
  it('detects edge removal', () => {
    const prev = { nodes: [{ id: 'a', kind:'T', label:'A' }, { id:'b', kind:'T', label:'B'}], edges: [{ id:'a->b', from:'a', to:'b'}] };
    const next = { nodes: [{ id: 'a', kind:'T', label:'A' }, { id:'b', kind:'T', label:'B'}], edges: [] };
  const patch = diffGraphs(prev as any, next as any);
    expect(patch?.edgesRemoved).to.deep.equal(['a->b']);
  });
});

// harness handles restoration
