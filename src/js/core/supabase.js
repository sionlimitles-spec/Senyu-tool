// core/supabase.js
import { SUPABASE_KEY, SUPABASE_URL } from './config.js';
import { lsGet, lsSet } from './utils.js';

// ==================== SUPABASE (REST/RPC, tanpa library) ====================
const DEVICE_KEY = 'sionnime_device';
const NAME_KEY = 'sionnime_name';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let deviceId = null;

// ID perangkat acak disimpan di localStorage; identitas like/rating/komentar tanpa login
export function getDeviceId() {
  if (deviceId) return deviceId;
  const saved = lsGet(DEVICE_KEY, null);
  deviceId = (typeof saved === 'string' && UUID_RE.test(saved)) ? saved : crypto.randomUUID();
  if (deviceId !== saved) lsSet(DEVICE_KEY, deviceId);
  return deviceId;
}
export const getSavedName = () => { const n = lsGet(NAME_KEY, ''); return typeof n === 'string' ? n : ''; };
export const saveName = n => lsSet(NAME_KEY, n);

export async function rpc(fn, args, signal) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    let msg = 'Network Error';
    try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}
