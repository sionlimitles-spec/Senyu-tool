// features/nav.js
import { S } from '../core/state.js';
import { $, SMOOTH } from '../core/utils.js';
import { clearActiveChips } from './browse.js';
import { getHistory } from './history.js';
import { loadHome, trendingLoader } from './home.js';
import { renderAnimeCards } from '../ui/cards.js';
import { applyChrome, setNav, showToast, updateSearchClear } from '../ui/ui.js';

// ==================== NAV ====================
export function goHome() {
  $('searchInput').value = '';
  S.currentView = 'home'; S.listReq++; if (S.listAbort) S.listAbort.abort(); setNav('home'); applyChrome('home'); updateSearchClear(); // batalkan permintaan yang masih berjalan
  clearActiveChips();
  const tt = document.querySelector('.sort-tab[data-sort="TRENDING_DESC"]'); if (tt) tt.classList.add('chip-active');
  $('sectionTitle').textContent = 'Trending Anime';
  $('backToHomeBtn').classList.add('hidden'); $('loadMoreWrap').classList.add('hidden');
  if (S.homeAnimes.length > 0) {
    S.currentPage = 1; S.currentLoader = trendingLoader;
    $('heroSection').classList.remove('hidden');
    $('continueSection').classList.toggle('hidden', getHistory().length === 0);
    renderAnimeCards(S.homeAnimes);
    $('loadMoreWrap').classList.toggle('hidden', !S.homeHasNext);
    window.scrollTo({ top: 0, behavior: SMOOTH });
  } else loadHome();
}

// ==================== LOAD MORE ====================
export async function loadMore() {
  if (!S.currentLoader) return;
  const my = S.listReq, loader = S.currentLoader, page = S.currentPage + 1;
  const btn = $('loadMoreBtn'); btn.textContent = 'MEMUAT...'; btn.disabled = true;
  try {
    const res = await loader(page);
    if (my === S.listReq) {
      S.currentPage = page;
      renderAnimeCards(res.media, true);
      $('loadMoreWrap').classList.toggle('hidden', !res.pageInfo.hasNextPage);
    }
  } catch (e) { showToast('Gagal memuat halaman berikutnya', 'error'); }
  btn.textContent = 'MUAT LEBIH BANYAK ↓'; btn.disabled = false;
}
