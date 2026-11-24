// features/watchlist.js
import { S, animeStore } from '../core/state.js';
import { $, lsGet, lsSet } from '../core/utils.js';
import { clearActiveChips } from './browse.js';
import { updateDetailBookmarkUI } from './detail.js';
import { renderAnimeCards, wlBtnClass } from '../ui/cards.js';
import { applyChrome, setNav, showToast, updateWlBadge } from '../ui/ui.js';

// ==================== WATCHLIST ====================
export function getWatchlist() { return lsGet('kstream_watchlist', []); }
export function saveWatchlist(l) { if (!lsSet('kstream_watchlist', l)) showToast('Penyimpanan browser penuh/nonaktif', 'error'); }
export function isInWatchlist(idMal) { if (!idMal) return false; return getWatchlist().some(a => a.idMal === idMal); }
export function toggleWatchlistById(animeId) {
  const anime = animeStore.get(animeId); if (!anime) return;
  if (!anime.idMal) { showToast('Tidak bisa disimpan', 'error'); return; }
  const list = getWatchlist();
  const idx = list.findIndex(a => a.idMal === anime.idMal);
  if (idx >= 0) { list.splice(idx, 1); saveWatchlist(list); showToast('Dihapus dari watchlist', 'warn'); }
  else { list.unshift({ ...anime }); saveWatchlist(list); showToast('Ditambahkan ke watchlist', 'success'); } // simpan data lengkap
  const inWL = isInWatchlist(anime.idMal);
  document.querySelectorAll(`button[onclick*="toggleWatchlistById(${animeId})"]`).forEach(btn => {
    btn.className = wlBtnClass(inWL); btn.setAttribute('aria-pressed', inWL);
    const use = btn.querySelector('use'); if (use) use.setAttribute('href', inWL ? '#i-bookmark-fill' : '#i-bookmark');
  });
  updateDetailBookmarkUI(); updateWlBadge(true);
  if (S.currentView === 'watchlist') showWatchlist();
}
export function showWatchlist() {
  S.currentView = 'watchlist'; S.listReq++; if (S.listAbort) S.listAbort.abort(); S.currentLoader = null; setNav('watchlist'); applyChrome('watchlist');
  clearActiveChips();
  const list = getWatchlist();
  $('heroSection').classList.add('hidden'); $('continueSection').classList.add('hidden');
  $('sectionTitle').textContent = `Watchlist (${list.length})`;
  $('backToHomeBtn').classList.remove('hidden'); $('loadMoreWrap').classList.add('hidden');
  if (list.length === 0) {
    $('animeGrid').innerHTML = `<div class="col-span-full text-center py-16 bg-white border-4 border-ink shadow-brutal">
      <div class="w-16 h-16 mx-auto mb-4 bg-yellow border-3 border-ink flex items-center justify-center shadow-brutal"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg></div>
      <p class="font-display text-xl mb-2 uppercase">Watchlist Kosong</p>
      <p class="text-sm text-ink/50 font-bold">Tambahkan anime favoritmu untuk ditonton nanti.</p></div>`;
    return;
  }
  renderAnimeCards(list.map(a => ({ ...a, id: a.id || a.idMal })));
}
