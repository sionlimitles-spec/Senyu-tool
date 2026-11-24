// ui/ui.js
import { S } from '../core/state.js';
import { $, SMOOTH, syncScrollLock } from '../core/utils.js';
import { showSearchIdle } from '../features/search.js';
import { getWatchlist } from '../features/watchlist.js';

// ==================== UI HELPERS ====================
export function updateWlBadge(bump) {
  const n = getWatchlist().length;
  document.querySelectorAll('.js-wl-badge').forEach(b => {
    b.textContent = n > 99 ? '99+' : n;
    b.classList.toggle('is-zero', n === 0);
    if (bump && n > 0) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  });
}
export function setNav(name) { document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('is-active', b.dataset.nav === name)); }
export function updateSearchClear() { $('searchClear').classList.toggle('hidden', !$('searchInput').value); }
export function clearSearch() {
  $('searchInput').value = ''; updateSearchClear();
  S.listReq++; if (S.listAbort) S.listAbort.abort();
  showSearchIdle(); $('searchInput').focus();
}
// bagian layar yang tampil sesuai tampilan aktif
export function applyChrome(view) {
  $('searchView').classList.toggle('hidden', view !== 'search');
  $('filterSection').classList.toggle('hidden', view === 'search' || view === 'watchlist');
  if (view !== 'search') $('searchView').classList.remove('has-results');
}

// ==================== TOAST ====================
export function showToast(msg, type = 'info') {
  const colors = { info: 'bg-cyan text-ink', success: 'bg-acid text-ink', error: 'bg-blood text-white', warn: 'bg-yellow text-ink' };
  const el = document.createElement('div');
  el.className = `${colors[type]} px-4 py-3 border-3 border-ink font-bold shadow-brutal text-sm text-center toast-anim pointer-events-auto`;
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-20px)';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

export function hideModal(id, cb) {
  const m = $(id); if (m.classList.contains('hidden')) { cb && cb(); return; }
  const tok = m._tok = (m._tok || 0) + 1;
  m.classList.add('is-out');
  setTimeout(() => {
    if (m._tok !== tok) return;
    m.classList.add('hidden'); m.classList.remove('flex', 'is-out');
    cb && cb(); syncScrollLock();
  }, SMOOTH === 'auto' ? 0 : 220);
}
export function showModalFx(id) { const m = $(id); m._tok = (m._tok || 0) + 1; m.classList.remove('is-out'); }
