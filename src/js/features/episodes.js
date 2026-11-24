// features/episodes.js
import { playSound } from '../core/audio.js';
import { EP_PAGE } from '../core/config.js';
import { S } from '../core/state.js';
import { $, lsGet, lsSet, syncScrollLock } from '../core/utils.js';
import { getHistory } from './history.js';
import { playEpisode } from './player.js';
import { hideModal, showModalFx, showToast } from '../ui/ui.js';

// ==================== EPISODE MODAL ====================
let epRange = 0;
export function getWatched(idMal) { const all = lsGet('kstream_watched', {}); return new Set(all[idMal] || []); }
export function markWatched(idMal, ep) {
  const all = lsGet('kstream_watched', {}); const set = new Set(all[idMal] || []);
  set.add(ep); all[idMal] = [...set]; lsSet('kstream_watched', all);
}
export function openEpisodeModal(idMal, title, totalEps, coverImage, jumpTo = null) {
  if (!(totalEps >= 1)) { showToast('Belum ada episode yang tayang', 'warn'); return; }
  const hist = getHistory().find(h => h.idMal === idMal);
  S.episodeCtx = { idMal, title, totalEps, coverImage, last: hist ? hist.epNum : null };
  if (jumpTo) return playEpisode(idMal, jumpTo, title, totalEps, coverImage);
  $('modalTitle').textContent = title;
  $('modalSubtitle').textContent = `${totalEps} Episode`;
  $('epPoster').src = coverImage || '';
  const last = S.episodeCtx.last && S.episodeCtx.last <= totalEps ? S.episodeCtx.last : null;
  S.episodeCtx.last = last;
  $('epContinueBtn').classList.toggle('hidden', !last);
  if (last) $('epContinueNum').textContent = last;
  $('epJump').max = totalEps; $('epJump').value = '';
  epRange = last ? Math.floor((last - 1) / EP_PAGE) : 0;
  renderEpRanges(); renderEpGrid();
  showModalFx('episodeModal'); $('episodeModal').classList.remove('hidden'); $('episodeModal').classList.add('flex');
  syncScrollLock(); scrollToLastEp();
}
export function renderEpRanges() {
  const total = S.episodeCtx.totalEps, box = $('epRanges');
  if (total <= EP_PAGE) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  const pages = Math.ceil(total / EP_PAGE);
  box.innerHTML = Array.from({ length: pages }, (_, p) => {
    const a = p * EP_PAGE + 1, b = Math.min(total, (p + 1) * EP_PAGE);
    return `<button type="button" class="${p === epRange ? 'is-active' : ''}" onclick="playSound('click'); setEpRange(${p})">${a}–${b}</button>`;
  }).join('');
  box.classList.remove('hidden');
  const act = box.querySelector('.is-active'); if (act) box.scrollLeft = act.offsetLeft - 16;
}
export function setEpRange(p) { epRange = p; renderEpRanges(); renderEpGrid(); }
export function renderEpGrid() {
  const { idMal, totalEps, last } = S.episodeCtx, watched = getWatched(idMal);
  const start = epRange * EP_PAGE + 1, end = Math.min(totalEps, start + EP_PAGE - 1);
  const grid = $('episodeList'); let html = '';
  for (let ep = start; ep <= end; ep++) {
    const cls = ep === last ? 'is-last' : watched.has(ep) ? 'is-watched' : '';
    html += `<button type="button" class="ks-tile ${cls}" style="--i:${Math.min(ep - start, 40)}" onclick="playSound('click'); pickEpisode(${ep})" aria-label="Episode ${ep}${ep === last ? ', terakhir ditonton' : watched.has(ep) ? ', sudah ditonton' : ''}"><small>EP</small><b>${ep}</b></button>`;
  }
  grid.innerHTML = html; grid.scrollTop = 0;
  scrollToLastEp();
}
export function scrollToLastEp() {
  const grid = $('episodeList'), t = grid.querySelector('.is-last');
  if (t && grid.clientHeight) grid.scrollTop = Math.max(0, t.offsetTop - grid.clientHeight / 2 + t.offsetHeight / 2);
}
export function pickEpisode(ep) { playEpisode(S.episodeCtx.idMal, ep, S.episodeCtx.title, S.episodeCtx.totalEps, S.episodeCtx.coverImage); }
export function continueFromModal() { if (S.episodeCtx.last) pickEpisode(S.episodeCtx.last); }
export function jumpEpisode() {
  const n = parseInt($('epJump').value, 10);
  if (n >= 1 && n <= S.episodeCtx.totalEps) return pickEpisode(n);
  const box = $('epJumpBox'); box.classList.remove('is-shake'); void box.offsetWidth; box.classList.add('is-shake');
  showToast(`Episode harus 1–${S.episodeCtx.totalEps}`, 'warn');
}
export function closeEpisodeModal() { hideModal('episodeModal'); }
