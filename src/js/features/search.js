// features/search.js
import { fetchPage, showList } from '../core/api.js';
import { playSound } from '../core/audio.js';
import { GENRES, SUGGESTIONS } from '../core/config.js';
import { S } from '../core/state.js';
import { $, SMOOTH, esc, jsArg, lsGet, lsSet } from '../core/utils.js';
import { clearActiveChips, filterByGenre } from './browse.js';
import { applyChrome, setNav, updateSearchClear } from '../ui/ui.js';

// ==================== SEARCH ====================
let searchTimer = null;
export function getRecent() { return lsGet('kstream_recent', []); }
export function addRecent(q) { const l = getRecent().filter(x => x.toLowerCase() !== q.toLowerCase()); l.unshift(q); lsSet('kstream_recent', l.slice(0, 8)); }
export function clearRecent() { try { localStorage.removeItem('kstream_recent'); } catch (e) {} renderRecent(); }
export function renderRecent() {
  const l = getRecent();
  $('recentWrap').classList.toggle('hidden', l.length === 0);
  $('recentList').innerHTML = l.map(q => `<button type="button" onclick="playSound('click'); runSearch(${jsArg(q)})">${esc(q)}</button>`).join('');
}
export function renderSearchSuggestions() {
  $('suggestList').innerHTML = SUGGESTIONS.map(q => `<button type="button" onclick="playSound('click'); runSearch(${jsArg(q)})">${esc(q)}</button>`).join('');
  $('svGenres').innerHTML = GENRES.map(g => `<button type="button" onclick="playSound('click'); filterByGenre(${jsArg(g)})">${esc(g)}</button>`).join('');
}
export function runSearch(q) { $('searchInput').value = q; updateSearchClear(); doSearch(); }
export function showSearchIdle() {
  $('searchView').classList.remove('has-results');
  $('sectionTitle').textContent = 'Pencarian';
  $('loadMoreWrap').classList.add('hidden');
  $('animeGrid').removeAttribute('aria-busy');
  $('animeGrid').innerHTML = `<div class="col-span-full ks-empty"><svg class="ico"><use href="#i-search"/></svg><p>Mau nonton apa hari ini?</p><small>Ketik judul anime di atas, atau pilih saran di bawah.</small></div>`;
}
export function showSearch() {
  S.currentView = 'search'; S.listReq++; if (S.listAbort) S.listAbort.abort(); S.currentLoader = null;
  setNav('search'); clearActiveChips(); applyChrome('search');
  $('heroSection').classList.add('hidden'); $('continueSection').classList.add('hidden'); $('loadMoreWrap').classList.add('hidden');
  $('backToHomeBtn').classList.remove('hidden');
  renderRecent();
  const q = $('searchInput').value.trim();
  if (q) doSearch(true); else showSearchIdle();
  window.scrollTo({ top: 0, behavior: SMOOTH });
  setTimeout(() => $('searchInput').focus({ preventScroll: true }), 60);
}
export async function doSearch(live = false) {
  const q = $('searchInput').value.trim();
  if (!q) { if (S.currentView !== 'search') return showSearch(); return showSearchIdle(); }
  S.currentView = 'search'; setNav('search'); applyChrome('search');
  $('heroSection').classList.add('hidden'); $('continueSection').classList.add('hidden');
  $('sectionTitle').textContent = `Hasil: "${q}"`;
  $('backToHomeBtn').classList.remove('hidden');
  $('searchView').classList.add('has-results');
  const ok = await showList(p => fetchPage(p, { search: q, sort: 'SEARCH_MATCH' }));
  if (ok) {
    if (!live) { addRecent(q); playSound('success'); }
    if (!$('animeGrid').children.length) showSearchIdle();
  }
}

export function submitSearch() { clearTimeout(searchTimer); doSearch(); }

export function initSearch() {
  $('searchInput').addEventListener('input', () => {
    updateSearchClear(); clearTimeout(searchTimer);
    const q = $('searchInput').value.trim();
    if (S.currentView !== 'search') return;
    if (!q) { S.listReq++; if (S.listAbort) S.listAbort.abort(); showSearchIdle(); return; }
    if (q.length >= 2) searchTimer = setTimeout(() => { if (S.currentView === 'search') doSearch(true); }, 450);
  });
}
