// core/api.js
import { playSound } from './audio.js';
import { ANILIST_API, MEDIA_FIELDS } from './config.js';
import { S } from './state.js';
import { $, announce } from './utils.js';
import { renderAnimeCards, showSkeletons } from '../ui/cards.js';

// ==================== API ====================
export function newListSignal() { if (S.listAbort) S.listAbort.abort(); S.listAbort = new AbortController(); return S.listAbort.signal; }
export async function fetchAniList(query, variables, signal) {
  const res = await fetch(ANILIST_API, {
    signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error('Network Error');
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}
// Satu fungsi untuk semua daftar (home, sort, genre, search, musim) + paginasi + filter konten dewasa
export async function fetchPage(page, { sort = 'POPULARITY_DESC', genre, search, season, seasonYear } = {}) {
  const decl = ['$page: Int', '$sort: [MediaSort]'];
  const args = ['type: ANIME', 'isAdult: false', 'sort: $sort'];
  const vars = { page, sort: [sort] };
  if (genre) { decl.push('$genre: String'); args.push('genre: $genre'); vars.genre = genre; }
  if (search) { decl.push('$search: String'); args.push('search: $search'); vars.search = search; }
  if (season) {
    decl.push('$season: MediaSeason', '$seasonYear: Int');
    args.push('season: $season', 'seasonYear: $seasonYear');
    vars.season = season; vars.seasonYear = seasonYear;
  }
  const q = `query(${decl.join(', ')}) { Page(page: $page, perPage: 24) { pageInfo { hasNextPage } media(${args.join(', ')}) { ${MEDIA_FIELDS} } } }`;
  const data = await fetchAniList(q, vars, S.listAbort ? S.listAbort.signal : undefined);
  return data.Page;
}
// Tampilkan daftar dari loader(page); mengabaikan respons basi bila user sudah pindah tampilan
export async function showList(loader) {
  S.currentPage = 1; S.currentLoader = loader;
  const my = ++S.listReq; newListSignal();
  $('loadMoreWrap').classList.add('hidden');
  showSkeletons(); syncPressed();
  try {
    const page = await loader(1);
    if (my !== S.listReq) return false;
    renderAnimeCards(page.media);
    $('loadMoreWrap').classList.toggle('hidden', !page.pageInfo.hasNextPage);
    announce(`${page.media.length} anime dimuat`);
    return true;
  } catch (err) {
    if (err.name === 'AbortError') return false;
    if (my === S.listReq) showListError(() => showList(loader));
    return false;
  }
}
export function showListError(retry) {
  window.__retry = retry;
  $('animeGrid').innerHTML = `<div role="alert" class="col-span-full text-center py-12 bg-white border-4 border-ink shadow-brutal">
    <p class="font-display text-xl mb-4 uppercase">Gagal memuat data</p>
    <button type="button" class="ks-btn ks-btn--yellow ks-btn--reload" onclick="playSound('click'); window.__retry()"><svg class="ico"><use href="#i-reload"/></svg>Coba Lagi</button></div>`;
  $('animeGrid').removeAttribute('aria-busy');
}
export function syncPressed() { document.querySelectorAll('.sort-tab,.genre-chip').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('chip-active'))); }
