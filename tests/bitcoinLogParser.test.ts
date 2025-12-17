import { parseBitcoinLogLine } from '../src/utils/bitcoinLogParser';

describe('parseBitcoinLogLine', () => {
  it('parses pre-sync header progress', () => {
    const line = 'K2025-12-13T16:09:40Z Pre-synchronizing blockheaders, height: 2000 (~0.22%)';
    const s = parseBitcoinLogLine(line);
    expect(s.stage).toBe('headers-presync');
    expect(s.stageHeight).toBe(2000);
    expect(s.stageProgressPercent).toBeCloseTo(0.22, 5);
  });

  it('parses syncing header progress', () => {
    const line = 'H2025-12-13T18:24:40Z Synchronizing blockheaders, height: 45982 (~5.26%)';
    const s = parseBitcoinLogLine(line);
    expect(s.stage).toBe('headers-sync');
    expect(s.stageHeight).toBe(45982);
    expect(s.stageProgressPercent).toBeCloseTo(5.26, 5);
  });

  it('parses UpdateTip height', () => {
    const line = 'UpdateTip: new best=0000000000000000000 height=151982 version=0x20000000 log2_work=68.5 tx=123456 date=2025-12-13T18:24:40Z progress=0.12345 cache=12.3MiB(12345txo)';
    const s = parseBitcoinLogLine(line);
    expect(s.stage).toBe('blocks');
    expect(s.tipHeight).toBe(151982);
  });

  it('parses peer connected line', () => {
    const line = 'f2025-12-13T16:09:48Z New outbound-full-relay v1 peer connected: version: 70016, blocks=927738, peer=2';
    const s = parseBitcoinLogLine(line);
    expect(s.peerIndex).toBe(2);
    expect(s.peerBestHeight).toBe(927738);
  });

  it('returns empty for unrelated lines', () => {
    expect(parseBitcoinLogLine('hello world')).toEqual({});
  });
});
