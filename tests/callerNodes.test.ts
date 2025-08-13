import { expect } from 'chai';
import { diffGraphs } from '../src/extension/diff';

/** This is a lightweight test that simulates a before/after symbol graph where new caller nodes appear. */

describe('caller node diff', () => {
  it('produces added caller node and call edge', () => {
    const before = { nodes: [{id:'fileA::foo', kind:'Function'}], edges: [] };
    const after = {
      nodes: [
        {id:'fileA::foo', kind:'Function'},
        {id:'fileA::caller:Symbol(Function)foo', kind:'Caller'},
      ],
      edges: [ { id:'fileA::caller:Symbol(Function)foo->fileA::foo', from:'fileA::caller:Symbol(Function)foo', to:'fileA::foo', kind:'calls'} ]
    };
    const patch = diffGraphs(before as any, after as any)!;
    expect(patch.nodesAdded.map(n=>n.id)).to.include('fileA::caller:Symbol(Function)foo');
  expect(patch.edgesAdded.map(e=>e.id)).to.include('fileA::caller:Symbol(Function)foo->fileA::foo');
  // Debug output to confirm mocha executed
  // eslint-disable-next-line no-console
  console.log('Caller diff patch:', patch);
  });
});
