/**
 * Helpers to extract sync/peer signals from Bitcoin Core logs.
 * These are best-effort (logs are not a strict API) and are used as a
 * fast, early UX signal before RPC becomes reachable.
 */

export type BitcoinLogSignals = {
  stage?: 'headers-presync' | 'headers-sync' | 'blocks';
  stageHeight?: number;
  stageProgressPercent?: number;
  tipHeight?: number;
  peerIndex?: number;
  peerBestHeight?: number;
};

const HEADERS_PRESYNC_RE = /Pre-synchronizing blockheaders,\s*height:\s*(\d+)\s*\(~\s*([0-9.]+)%\)/i;
const HEADERS_SYNC_RE = /Synchronizing blockheaders,\s*height:\s*(\d+)\s*\(~\s*([0-9.]+)%\)/i;
const UPDATE_TIP_RE = /\bUpdateTip:\s+new best=[^\s]+\s+height=(\d+)\b/i;
const PEER_CONNECTED_RE = /New outbound-[^\s]+\s+v\d+\s+peer\s+connected:/i;
const PEER_INDEX_RE = /\bpeer=(\d+)\b/i;
const PEER_BLOCKS_RE = /\bblocks=(\d+)\b/i;

export function parseBitcoinLogLine(line: string): BitcoinLogSignals {
  const s = String(line ?? '').trim();
  if (!s) return {};

  const out: BitcoinLogSignals = {};

  const pre = s.match(HEADERS_PRESYNC_RE);
  if (pre) {
    const h = Number(pre[1]);
    const p = Number(pre[2]);
    out.stage = 'headers-presync';
    if (Number.isFinite(h)) out.stageHeight = h;
    if (Number.isFinite(p)) out.stageProgressPercent = p;
    return out;
  }

  const hs = s.match(HEADERS_SYNC_RE);
  if (hs) {
    const h = Number(hs[1]);
    const p = Number(hs[2]);
    out.stage = 'headers-sync';
    if (Number.isFinite(h)) out.stageHeight = h;
    if (Number.isFinite(p)) out.stageProgressPercent = p;
    return out;
  }

  const tip = s.match(UPDATE_TIP_RE);
  if (tip) {
    const h = Number(tip[1]);
    out.stage = 'blocks';
    if (Number.isFinite(h)) out.tipHeight = h;
    return out;
  }

  // Peer connected lines carry both peer index and their best-known chain height.
  if (PEER_CONNECTED_RE.test(s)) {
    const peerIdx = s.match(PEER_INDEX_RE);
    const peerBlocks = s.match(PEER_BLOCKS_RE);
    if (peerIdx) {
      const idx = Number(peerIdx[1]);
      if (Number.isFinite(idx)) out.peerIndex = idx;
    }
    if (peerBlocks) {
      const b = Number(peerBlocks[1]);
      if (Number.isFinite(b)) out.peerBestHeight = b;
    }
    return out;
  }

  return out;
}
