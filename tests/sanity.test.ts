import { expect } from 'chai';

describe('Sanity', () => {
  it('runs a basic assertion', () => {
    expect(1+1).to.equal(2);
  });
  it('debug executes', () => {
    // eslint-disable-next-line no-console
    console.log('SANITY TEST RAN');
    expect(true).to.be.true;
  });
});
