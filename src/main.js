// Entry point: CSS, font lokal, modul, lalu jalankan aplikasi
import './css/tailwind.css';
import './css/base.css';
import './css/kstream.css';
import './css/extras.css';
import '@fontsource/anton/400.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/permanent-marker/400.css';

import { updateMuteBtn } from './js/core/audio.js';
import { $ } from './js/core/utils.js';
import { renderGenreChips } from './js/features/browse.js';
import { initHero, loadHome } from './js/features/home.js';
import { initPlayer } from './js/features/player.js';
import { initSearch, renderSearchSuggestions } from './js/features/search.js';
import { showToast, updateWlBadge } from './js/ui/ui.js';

import * as core_api from './js/core/api.js';
import * as core_audio from './js/core/audio.js';
import * as core_state from './js/core/state.js';
import * as core_utils from './js/core/utils.js';
import * as features_browse from './js/features/browse.js';
import * as features_detail from './js/features/detail.js';
import * as features_episodes from './js/features/episodes.js';
import * as features_history from './js/features/history.js';
import * as features_home from './js/features/home.js';
import * as features_nav from './js/features/nav.js';
import * as features_player from './js/features/player.js';
import * as features_search from './js/features/search.js';
import * as features_social from './js/features/social.js';
import * as features_watchlist from './js/features/watchlist.js';
import * as ui_cards from './js/ui/cards.js';
import * as ui_keyboard from './js/ui/keyboard.js';
import * as ui_ui from './js/ui/ui.js';

// Atribut onclick="..." di HTML butuh fungsi global, jadi semua fungsi modul dipasang ke window
Object.assign(window, core_api, core_audio, core_state, core_utils, features_browse, features_detail, features_episodes, features_history, features_home, features_nav, features_player, features_search, features_social, features_watchlist, ui_cards, ui_keyboard, ui_ui);

function initApp() {
  renderGenreChips(); updateMuteBtn(); updateWlBadge(false);
  renderSearchSuggestions();
  try { $('mastDate').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase(); } catch (e) {}
  initSearch(); initHero(); initPlayer();
  const y = $('year'); if (y) y.textContent = new Date().getFullYear();
  loadHome();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
// error tak terduga ditampilkan sebagai toast (membantu pelaporan bug)
let errToasts = 0;
window.addEventListener('error', e => { if (errToasts++ < 3) showToast('Error: ' + (e.message || 'tidak diketahui'), 'error'); });
window.addEventListener('unhandledrejection', e => { if (e.reason && e.reason.name === 'AbortError') return; if (errToasts++ < 3) showToast('Error: ' + ((e.reason && e.reason.message) || 'gagal'), 'error'); });
