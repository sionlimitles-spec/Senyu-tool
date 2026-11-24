// core/utils.js

// Helper umum
export const $ = id => document.getElementById(id);
// ==================== HELPERS ====================
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const jsArg = v => esc(JSON.stringify(v)); // aman dipakai di atribut onclick="..."
export const formatScore = s => s ? (s / 10).toFixed(1) : 'N/A';
export function stripHtml(s) {
  if (!s) return '';
  const doc = new DOMParser().parseFromString(String(s).replace(/<br\s*\/?>/gi, ' '), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
export const animeTitle = a => a.title.english || a.title.romaji;
// Jumlah episode yang SUDAH tayang (episode berikutnya yang dijadwalkan belum dihitung).
// 0 = belum ada yang tayang.
export const epCount = a => {
  if (a.status === 'NOT_YET_RELEASED') return 0;
  const next = a.nextAiringEpisode && a.nextAiringEpisode.episode;
  if (next) return Math.max(next - 1, 0);
  return a.episodes || 12;
};
export function lsGet(k, fb) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? fb; } catch (e) { return fb; } }
export function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
export const SMOOTH = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
export function announce(msg) { const r = $('srStatus'); if (r) { r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 50); } }
export const isOpen = id => { const c = $(id).classList; return !c.contains('hidden') && !c.contains('is-out'); };
let a11yTop = null, a11yReturn = null;
export function syncScrollLock() {
  const top = isOpen('episodeModal') ? 'episodeModal' : isOpen('playerModal') ? 'playerModal' : isOpen('detailModal') ? 'detailModal' : null;
  document.body.style.overflow = top ? 'hidden' : '';
  // latar belakang dinonaktifkan (inert): fokus keyboard dan screen reader tidak bocor keluar modal
  [...document.body.children].forEach(el => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'svg' || el.id === 'toastContainer' || el.id === 'srStatus') return;
    el.inert = !!top && el.id !== top;
  });
  if (top !== a11yTop) {
    if (!a11yTop && top) a11yReturn = document.activeElement;
    a11yTop = top;
    if (top) setTimeout(() => {
      const m = $(top), f = m.querySelector('[data-autofocus]') || m.querySelector('button:not([disabled]),input,[tabindex="0"]');
      if (f) f.focus({ preventScroll: true });
    }, 40);
    else if (a11yReturn && document.contains(a11yReturn)) { a11yReturn.focus({ preventScroll: true }); a11yReturn = null; }
  }
}
export const getA11yTop = () => a11yTop;
