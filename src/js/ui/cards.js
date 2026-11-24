// ui/cards.js
import { playSound } from '../core/audio.js';
import { animeStore } from '../core/state.js';
import { $, SMOOTH, animeTitle, announce, esc, formatScore } from '../core/utils.js';
import { openDetail } from '../features/detail.js';
import { isInWatchlist, toggleWatchlistById } from '../features/watchlist.js';

// ==================== CARDS ====================
// Layar sentuh: tap 1 = pratinjau (armed), tap 2 = buka detail. Mouse: hover lalu 1 klik. Keyboard: Enter langsung.
const FINE_POINTER = matchMedia('(hover:hover) and (pointer:fine)');
let armedCard = null, armedTimer = null;
export function disarmCard() { clearTimeout(armedTimer); if (armedCard) { armedCard.classList.remove('is-armed'); armedCard = null; } }
export function cardTap(e, el, id) {
  const direct = FINE_POINTER.matches || e.detail === 0 || (typeof e.pointerType === 'string' && e.pointerType === 'mouse');
  if (direct || el === armedCard) { disarmCard(); playSound('click'); openDetail(id); return; }
  disarmCard();
  armedCard = el; el.classList.add('is-armed');
  playSound('hover');
  const box = el.querySelector('.card-hover');
  if (box && SMOOTH !== 'auto') {
    const r = box.getBoundingClientRect(), d = document.createElement('span');
    d.className = 'ks-rip'; d.style.left = (e.clientX - r.left) + 'px'; d.style.top = (e.clientY - r.top) + 'px';
    box.appendChild(d); setTimeout(() => d.remove(), 650);
  }
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (x) {} }
  announce('Pratinjau. Ketuk lagi untuk membuka detail');
  armedTimer = setTimeout(disarmCard, 5000);
}
document.addEventListener('click', e => { if (armedCard && !armedCard.contains(e.target)) disarmCard(); }, true);

export const wlBtnClass = inWL => `absolute bottom-2 right-2 z-20 w-8 h-8 border-2 border-ink ${inWL ? 'bg-pink text-white' : 'bg-white text-ink'} shadow-brutal-sm btn-brutal flex items-center justify-center hover:bg-yellow hover:text-ink`;

export function renderAnimeCards(animes, append = false) {
  const grid = $('animeGrid');
  if (!append) {
    if (!animes || animes.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center font-display text-xl py-10 bg-white border-4 border-ink shadow-brutal">TIDAK ADA ANIME DITEMUKAN.</div>`;
      return;
    }
    grid.innerHTML = '';
  }
  const html = animes.map((raw, idx) => {
    // merge: data minim (mis. dari watchlist) tidak boleh menimpa data lengkap di store
    const anime = { ...(animeStore.get(raw.id) || {}), ...raw };
    animeStore.set(anime.id, anime);
    const title = animeTitle(anime);
    const statusBadge = anime.status === 'FINISHED' ? 'bg-cyan' : anime.status === 'RELEASING' ? 'bg-acid' : 'bg-gray-300';
    const statusText = anime.status === 'FINISHED' ? 'COMPLETE' : anime.status === 'RELEASING' ? 'ONGOING' : 'UPCOMING';
    const inWL = isInWatchlist(anime.idMal);
    const formatBadge = anime.format ? `<span class="px-1.5 py-0.5 bg-white border-2 border-ink font-bold text-[9px] shadow-brutal-sm">${esc(anime.format)}</span>` : '';
    const yearBadge = anime.seasonYear ? `<span class="px-1.5 py-0.5 bg-white border-2 border-ink font-bold text-[9px] shadow-brutal-sm">${esc(anime.seasonYear)}</span>` : '';
    const c = anime.coverImage;
    const srcset = c.large && c.extraLarge ? `srcset="${esc(c.large)} 230w, ${esc(c.extraLarge)} 460w" sizes="(max-width:640px) 46vw, (max-width:1024px) 25vw, 200px"` : '';
    return `
      <div class="ks-card cursor-pointer group flex flex-col h-full reveal" style="animation-delay:${Math.min(idx*40, 400)}ms"
           onclick="cardTap(event, this, ${Number(anime.id)})">
        <div class="relative border-4 border-ink bg-white aspect-[2/3] card-hover">
          <img src="${esc(c.large || c.extraLarge)}" ${srcset} width="230" height="325" alt="" decoding="async" class="w-full h-full object-cover" loading="lazy">
          <button type="button" class="card-main" aria-label="${esc(title)}, skor ${formatScore(anime.averageScore)}, ${statusText.toLowerCase()}. Buka detail"></button>
          <div class="absolute top-2 left-2 right-2 flex justify-between items-start gap-1 z-10 pointer-events-none">
            <span class="px-1.5 py-0.5 ${statusBadge} text-ink font-bold text-[9px] border-2 border-ink uppercase shadow-brutal-sm transform -rotate-2">${statusText}</span>
            <span class="px-1.5 py-0.5 bg-yellow border-2 border-ink font-bold text-[10px] flex items-center gap-1 shadow-brutal-sm transform rotate-2">★ ${formatScore(anime.averageScore)}</span>
          </div>
          <button type="button" onclick="event.stopPropagation(); playSound('click'); toggleWatchlistById(${Number(anime.id)})"
                  class="${wlBtnClass(inWL)}" title="Watchlist" aria-label="${inWL ? 'Hapus dari' : 'Tambah ke'} watchlist: ${esc(title)}" aria-pressed="${inWL}">
            <svg class="ico" style="font-size:16px"><use href="#i-${inWL ? 'bookmark-fill' : 'bookmark'}"/></svg>
          </button>
          <div class="ks-ov" aria-hidden="true">
            <div class="ks-ov__play"><svg class="ico"><use href="#i-play"/></svg></div>
            <span class="ks-ov__tag">TAP LAGI ▸ BUKA</span>
          </div>
        </div>
        <div class="ks-titlebox mt-3 bg-white border-3 border-ink p-2.5 shadow-brutal-sm">
          <h4 class="font-display text-[13px] leading-tight line-clamp-2 text-ink uppercase">${esc(title)}</h4>
          <div class="flex gap-1 mt-1.5 flex-wrap">${formatBadge}${yearBadge}</div>
        </div>
      </div>
    `;
  }).join('');
  grid.insertAdjacentHTML('beforeend', html); grid.removeAttribute('aria-busy');
}

export function showSkeletons() {
  $('animeGrid').setAttribute('aria-busy', 'true');
  $('animeGrid').innerHTML = Array.from({ length: 12 }).map(() => `
    <div class="flex flex-col h-full animate-pulse">
      <div class="border-4 border-ink aspect-[2/3] bg-gray-300"></div>
      <div class="mt-3 border-3 border-ink p-2.5 bg-white"><div class="h-3 bg-gray-300 mb-1.5"></div><div class="h-3 bg-gray-300 w-2/3"></div></div>
    </div>
  `).join('');
}
