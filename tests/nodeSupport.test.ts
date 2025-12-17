import { getNodeSupportedModes, isNodeModeSupported } from '../src/core/nodeSupport';

describe('nodeSupport runtime mode matrix', () => {
  it('should not advertise deprecated geth light mode for ethereum', () => {
    const modes = getNodeSupportedModes('ethereum');
    // Ethereum is a primary supported chain; ensure it is supported and does not include light.
    expect(modes.length).toBeGreaterThan(0);
    expect(modes).not.toContain('light');
    expect(isNodeModeSupported('ethereum', 'light')).toBe(false);
  });

  it('should not advertise light mode for bnb', () => {
    const modes = getNodeSupportedModes('bnb');
    expect(modes.length).toBeGreaterThan(0);
    expect(modes).not.toContain('light');
    expect(isNodeModeSupported('bnb', 'light')).toBe(false);
  });

  it('should not advertise light mode for bitcoin', () => {
    const modes = getNodeSupportedModes('bitcoin');
    expect(modes.length).toBeGreaterThan(0);
    expect(modes).not.toContain('light');
    expect(isNodeModeSupported('bitcoin', 'light')).toBe(false);
  });
});
