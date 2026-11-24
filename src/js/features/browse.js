// features/browse.js
import { fetchPage, showList } from '../core/api.js';
import { playSound } from '../core/audio.js';
import { GENRES } from '../core/config.js';
import { S } from '../core/state.js';
import { $, SMOOTH, esc, jsArg } from '../core/utils.js';
import { goHome } from './nav.js';
import { applyChrome, setNav } from '../ui/ui.js';

// ==================== GENRE/SORT ====================
export function clearActiveChips() {
  document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('chip-active'));
  document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('chip-active'));
}
export function renderGenreChips() {
  $('genreChips').innerHTML = GENRES.map(g => `<button onclick="playSound('click'); filterByGenre(${jsArg(g)})" data-genre="${esc(g)}" class="genre-chip shrink-0 px-3 py-1.5 bg-white border-2 border-ink font-bold text-xs shadow-brutal-sm btn-brutal-sm uppercase hover:bg-yellow">${esc(g)}</button>`).join('');
}
export async function filterByGenre(genre) {
  S.currentView = 'genre'; setNav('home'); applyChrome('genre');
  clearActiveChips();
  document.querySelectorAll('.genre-chip').forEach(c => c.classList.toggle('chip-active', c.dataset.genre === genre));
  $('heroSection').classList.add('hidden'); $('continueSection').classList.add('hidden');
  $('sectionTitle').textContent = `Genre: ${genre}`;
  $('backToHomeBtn').classList.remove('hidden');
  if (await showList(p => fetchPage(p, { genre, sort: 'POPULARITY_DESC' }))) window.scrollTo({ top: 400, behavior: SMOOTH });
}
export function seasonOpts() {
  const now = new Date(), m = now.getMonth() + 1;
  const season = m <= 3 ? 'WINTER' : m <= 6 ? 'SPRING' : m <= 9 ? 'SUMMER' : 'FALL';
  return { season, seasonYear: now.getFullYear(), sort: 'POPULARITY_DESC' };
}
export async function changeSort(sort, btn) {
  if (sort === 'TRENDING_DESC') return goHome();
  S.currentView = 'sort'; setNav('home'); applyChrome('sort');
  clearActiveChips(); btn.classList.add('chip-active');
  const titles = { SEASONAL: 'Anime Musim Ini', POPULARITY_DESC: 'Paling Populer', SCORE_DESC: 'Rating Tertinggi', START_DATE_DESC: 'Rilis Terbaru' };
  $('sectionTitle').textContent = titles[sort] || 'Anime';
  $('backToHomeBtn').classList.add('hidden'); $('heroSection').classList.add('hidden'); $('continueSection').classList.add('hidden');
  const opts = sort === 'SEASONAL' ? seasonOpts() : { sort };
  await showList(p => fetchPage(p, opts));
}
