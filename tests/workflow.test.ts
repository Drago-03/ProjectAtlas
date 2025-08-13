import { WorkflowParser } from '../src/extension/workflow';
import { strict as assert } from 'assert';

describe('WorkflowParser', () => {
  const parser = new WorkflowParser();
  it('parses empty yaml', () => {
    const g = parser.parse('');
    assert.equal(g.nodes.length, 0);
  });
  it('parses single job', () => {
    const g = parser.parse('jobs:\n  build:\n    runs-on: ubuntu-latest');
    assert.equal(g.nodes.length, 1);
  });
  it('parses needs array', () => {
  const g = parser.parse('jobs:\n  a: {}\n  b:\n    needs: [a]\n');
  assert.equal(g.nodes.length, 2, 'expected two job nodes');
  assert.equal(g.edges.length, 1, JSON.stringify(g));
  });
});
