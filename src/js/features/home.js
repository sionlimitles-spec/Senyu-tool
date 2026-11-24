// features/home.js
import { fetchPage, showListError } from '../core/api.js';
import { playSound } from '../core/audio.js';
import { S, animeStore } from '../core/state.js';
import { $, animeTitle, epCount, esc, formatScore, stripHtml } from '../core/utils.js';
import { openDetail } from './detail.js';
import { openEpisodeModal } from './episodes.js';
import { renderContinueWatching } from './history.js';
import { renderAnimeCards, showSkeletons } from '../ui/cards.js';
import { showToast } from '../ui/ui.js';

let heroList = [], heroIndex = 0;
let heroUserPaused = false, heroHover = false, heroOffscreen = false;

// ==================== HOME ====================
export const trendingLoader = p => fetchPage(p, { sort: 'TRENDING_DESC' });

export async function loadHome() {
  renderContinueWatching();
  showSkeletons();
  const my = ++S.listReq;
  try {
    const page = await trendingLoader(1);
    if (my !== S.listReq) return;
    S.homeAnimes = page.media; S.homeHasNext = page.pageInfo.hasNextPage;
    S.homeAnimes.forEach(a => animeStore.set(a.id, a));
    heroList = S.homeAnimes.filter(a => a.bannerImage).slice(0, 4);
    if (heroList.length === 0) heroList = S.homeAnimes.slice(0, 3);
    heroIndex = 0;
    S.currentView = 'home'; S.currentPage = 1; S.currentLoader = trendingLoader;
    if (heroList.length > 0) {
      $('heroSection').classList.remove('hidden');
      setHero(heroList[0]);
      renderHeroDots();
      startHeroRotation();
    }
    renderAnimeCards(S.homeAnimes);
    $('loadMoreWrap').classList.toggle('hidden', !S.homeHasNext);
  } catch (err) {
    if (my === S.listReq && err.name !== 'AbortError') showListError(() => loadHome());
  }
}

export function setHero(anime) {
  const title = animeTitle(anime);
  $('heroBgImg').src = anime.bannerImage || anime.coverImage.extraLarge;
  $('heroPoster').src = anime.coverImage.extraLarge;
  $('heroPoster').alt = title;
  $('heroTitle').textContent = title;
  const d = stripHtml(anime.description);
  $('heroDesc').textContent = d.length > 220 ? d.slice(0, 220).trimEnd() + '...' : d;
  $('heroScoreText').textContent = formatScore(anime.averageScore);
  $('heroGenres').innerHTML = (anime.genres || []).slice(0, 3).map(g => `<span>${esc(g)}</span>`).join('');
  const meta = [anime.format, anime.seasonYear, anime.episodes ? `${anime.episodes} EPS` : null].filter(Boolean);
  $('heroMeta').textContent = meta.join(' • ') || 'ANIME';
  $('heroRank').textContent = String(heroIndex + 1).padStart(2, '0');
  $('heroPlayBtn').onclick = () => {
    playSound('click'); animeStore.set(anime.id, anime);
    if (anime.idMal) openEpisodeModal(anime.idMal, title, epCount(anime), anime.coverImage.extraLarge);
    else showToast('ID MAL tidak tersedia', 'error');
  };
  $('heroDetailBtn').onclick = () => { playSound('click'); openDetail(anime.id); };
  // restart animasi masuk + Ken Burns
  const inner = $('heroInner'), bg = $('heroBgImg');
  inner.classList.remove('is-swap'); bg.classList.remove('kb'); void inner.offsetWidth;
  inner.classList.add('is-swap'); bg.classList.add('kb');
}
export function renderHeroDots() {
  $('heroDots').innerHTML = heroList.map((_, i) => `<button type="button" onclick="playSound('click'); goHero(${i})" aria-label="Slide ${i + 1}"></button>`).join('');
  $('heroTotal').textContent = String(heroList.length).padStart(2, '0');
  updateHeroDots();
}
export function updateHeroDots() {
  const segs = document.querySelectorAll('#heroDots button');
  segs.forEach((d, i) => { d.classList.remove('is-active', 'is-done'); if (i < heroIndex) d.classList.add('is-done'); });
  const act = segs[heroIndex]; if (act) { void act.offsetWidth; act.classList.add('is-active'); }
  $('heroIdx').textContent = String(heroIndex + 1).padStart(2, '0');
}
export function goHero(i) { heroIndex = i; setHero(heroList[i]); updateHeroDots(); }
export function heroStep(dir) { if (heroList.length <= 1) return; goHero((heroIndex + dir + heroList.length) % heroList.length); }
export function nextHero() {
  if (heroList.length <= 1 || $('heroSection').classList.contains('hidden')) return;
  goHero((heroIndex + 1) % heroList.length);
}
export function startHeroRotation() {} // rotasi digerakkan oleh animasi progress (animationend)
export function updateHeroPause() {
  $('heroSection').classList.toggle('is-paused', heroUserPaused || heroHover || heroOffscreen);
}
export function toggleHeroPause() {
  heroUserPaused = !heroUserPaused;
  const b = $('heroPause'); b.setAttribute('aria-pressed', heroUserPaused);
  b.setAttribute('aria-label', heroUserPaused ? 'Putar pergantian slide' : 'Jeda pergantian slide');
  $('heroPauseIcon').setAttribute('href', heroUserPaused ? '#i-play' : '#i-pause');
  updateHeroPause();
}
// geser kiri/kanan di hero
(function () {
  let x0 = null;
  document.addEventListener('touchstart', e => { x0 = e.target.closest('#heroSection') ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) heroStep(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

export function initHero() {
  $('heroDots').addEventListener('animationend', e => { if (e.animationName === 'ks-fill') nextHero(); });
  const hs = $('heroSection');
  hs.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { heroHover = true; updateHeroPause(); } });
  hs.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { heroHover = false; updateHeroPause(); } });
  hs.addEventListener('focusin', () => { heroHover = true; updateHeroPause(); });
  hs.addEventListener('focusout', () => { heroHover = false; updateHeroPause(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { heroOffscreen = !es[0].isIntersecting; updateHeroPause(); }).observe(hs);
}
