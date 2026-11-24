// core/api.js
import { playSound } from './audio.js';
import { ANILIST_API, CACHE_MAX, CACHE_TTL, LIST_FIELDS } from './config.js';
import { S } from './state.js';
import { $, announce } from './utils.js';
import { renderAnimeCards, showSkeletons } from '../ui/cards.js';

// ==================== CACHE ====================
const cache = new Map();
const cacheKey = (query, vars) => query + '\u0000' + JSON.stringify(vars);
function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > CACHE_TTL) { cache.delete(key); return null; }
  return hit.v;
}
function writeCache(key, v) {
  cache.set(key, { t: Date.now(), v });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

// ==================== API ====================
export function newListSignal() { if (S.listAbort) S.listAbort.abort(); S.listAbort = new AbortController(); return S.listAbort.signal; }
async function rawFetch(query, variables, signal, retried = false) {
  const res = await fetch(ANILIST_API, {
    signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  // AniList membatasi ~90 req/menit: satu retry sopan saat 429
  if (res.status === 429 && !retried) {
    const wait = Math.min(Number(res.headers.get('Retry-After') || 2) * 1000, 5000);
    await new Promise(r => setTimeout(r, wait));
    return rawFetch(query, variables, signal, true);
  }
  if (!res.ok) throw new Error(`Network Error (${res.status})`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}
export async function fetchAniList(query, variables, signal) {
  const key = cacheKey(query, variables);
  const hit = readCache(key);
  if (hit) return hit;
  const data = await rawFetch(query, variables, signal || (S.listAbort ? S.listAbort.signal : undefined));
  writeCache(key, data);
  return data;
}
// Satu fungsi untuk semua daftar (home, sort, genre, search, musim) + paginasi + filter konten dewasa
export async function fetchPage(page, { sort = 'POPULARITY_DESC', genre, search, season, seasonYear, withDescription = false } = {}) {
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
  const q = `query(${decl.join(', ')}) { Page(page: $page, perPage: 24) { pageInfo { hasNextPage } media(${args.join(', ')}) { ${LIST_FIELDS}${withDescription ? ' description' : ''} } } }`;
  const data = await fetchAniList(q, vars);
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
