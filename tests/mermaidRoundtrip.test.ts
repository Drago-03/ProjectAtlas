import { expect } from 'chai';
// Direct mermaid renderer smoke test (bypasses panel to avoid vscode complexity)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MermaidRenderer } = require('../src/extension/mermaid');

describe('Mermaid renderer', () => {
  it('renders a simple graph', async () => {
    if (typeof (global as any).document === 'undefined') {
      // Environment lacks DOM; skip
      return;
    }
    const r = new MermaidRenderer();
    const svg = await r.render('graph TD; A-->B;');
    expect(svg).to.contain('<svg');
  });
});
