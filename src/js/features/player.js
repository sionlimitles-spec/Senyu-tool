// features/player.js
import { playSound } from '../core/audio.js';
import { LOCK_FULLSCREEN } from '../core/config.js';
import { playerState } from '../core/state.js';
import { $, syncScrollLock } from '../core/utils.js';
import { closeEpisodeModal, markWatched } from './episodes.js';
import { saveHistory } from './history.js';
import { hideModal, showModalFx, showToast } from '../ui/ui.js';

let subHintShown = false;

// ==================== PLAYER ====================
export function playEpisode(idMal, epNum, title, totalEps, coverImage) {
  closeEpisodeModal();
  playerState.idMal = idMal; playerState.epNum = epNum;
  playerState.totalEps = totalEps; playerState.title = title;
  playerState.coverImage = coverImage;

  showModalFx('playerModal'); $('playerModal').classList.remove('hidden'); $('playerModal').classList.add('flex');
  syncScrollLock();
  $('playerTitle').textContent = title;
  saveHistory({ idMal, title, epNum, totalEps, coverImage }); markWatched(idMal, epNum);
  loadVideo();
  if (!subHintShown) { subHintShown = true; showToast('Subtitle: pilih lewat ikon CC di dalam video', 'info'); }
}

// Iframe dibuat ulang total, bukan cuma ganti src
export function loadVideo() {
  clearTimeout(window.playerTimeout); // timer lama harus mati sebelum timer baru dibuat
  const { idMal, epNum } = playerState;
  $('playerLoading').classList.remove('hidden');
  $('playerError').classList.add('hidden');
  $('playerError').classList.remove('flex');
  updatePlayerNav();

  const container = $('videoContainer');
  container.querySelectorAll('iframe').forEach(f => f.remove());

  const url = `https://megaplay.buzz/stream/mal/${idMal}/${epNum}/sub?_t=${Date.now()}`;

  const iframe = document.createElement('iframe');
  iframe.id = 'videoFrame';
  iframe.title = `Pemutar video ${playerState.title} episode ${epNum}`;
  iframe.className = 'w-full h-full border-0 absolute inset-0';
  if (!LOCK_FULLSCREEN) iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture' + (LOCK_FULLSCREEN ? '' : '; fullscreen'));
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.src = url;

  let loaded = false;
  iframe.onload = () => {
    if (loaded) return; loaded = true;
    clearTimeout(window.playerTimeout);
    $('playerLoading').classList.add('hidden');
  };
  container.appendChild(iframe);

  window.playerTimeout = setTimeout(() => {
    if (loaded || !iframe.isConnected) return;
    $('playerLoading').classList.add('hidden');
    $('playerError').classList.remove('hidden');
    $('playerError').classList.add('flex');
  }, 15000);
}

export function updatePlayerNav() {
  const { epNum, totalEps } = playerState;
  const label = `EP ${epNum} / ${totalEps}`;
  $('playerEpInfo').textContent = label;
  $('dockEpLabel').textContent = label;
  $('overlayEp').textContent = label;
  $('dockPrevBtn').disabled = epNum <= 1;
  $('dockNextBtn').disabled = epNum >= totalEps;
  $('overlayPrevBtn').classList.toggle('hidden', epNum <= 1);
  $('overlayNextBtn').classList.toggle('hidden', epNum >= totalEps);
}

// ---- Fullscreen: yang di-fullscreen adalah #videoWrap (bukan iframe), jadi tombol prev/next ikut tampil ----
export const fsWrap = () => $('videoWrap');
export const isRealFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
export const isPseudoFs = () => fsWrap().classList.contains('pseudo-fs');
export const isFs = () => isRealFs() || isPseudoFs();
let fsIdleTimer = null;
export function fsRestartTimer() { clearTimeout(fsIdleTimer); if (isFs()) fsIdleTimer = setTimeout(fsHideUI, 5000); }
export function fsShowUI() { fsWrap().classList.remove('ui-idle'); fsRestartTimer(); }
export function fsHideUI() { if (isFs()) fsWrap().classList.add('ui-idle'); }
export function updateFsUI() {
  const on = isFs();
  fsWrap().classList.toggle('is-fs', on);
  $('fsBtnText').textContent = on ? 'Keluar' : 'Layar Penuh';
  $('fsIcon').setAttribute('href', on ? '#i-fs-exit' : '#i-fs-enter');
  if (on) fsShowUI(); else { clearTimeout(fsIdleTimer); fsWrap().classList.remove('ui-idle'); }
}
export async function enterFs() {
  const w = fsWrap(), req = w.requestFullscreen || w.webkitRequestFullscreen;
  if (req) {
    try {
      await req.call(w);
      try { await screen.orientation.lock('landscape'); } catch (e) {}
      return;
    } catch (e) {}
  }
  w.classList.add('pseudo-fs'); // fallback (mis. iPhone): layar penuh via CSS
  updateFsUI();
}
export function exitFs() {
  fsWrap().classList.remove('pseudo-fs');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
  try { screen.orientation.unlock(); } catch (e) {}
  updateFsUI();
}
export function toggleFullscreen() { playSound('click'); isFs() ? exitFs() : enterFs(); }
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, updateFsUI));

export function changeEpisode(dir) {
  const newEp = playerState.epNum + dir;
  if (newEp >= 1 && newEp <= playerState.totalEps) {
    playerState.epNum = newEp;
    loadVideo();
    saveHistory({ idMal: playerState.idMal, title: playerState.title, epNum: newEp, totalEps: playerState.totalEps, coverImage: playerState.coverImage });
    markWatched(playerState.idMal, newEp); if (isFs()) fsShowUI();
    playSound('click');
  }
}
export function closePlayerModal() {
  if (isFs()) exitFs();
  $('videoContainer').querySelectorAll('iframe').forEach(f => f.remove());
  clearTimeout(window.playerTimeout);
  hideModal('playerModal');
}

export function initPlayer() {
  // Layar penuh: kontrol sembunyi setelah 5 detik tanpa sentuhan
  const w = fsWrap();
  w.addEventListener('pointerdown', () => { if (isFs() && !w.classList.contains('ui-idle')) fsRestartTimer(); }, true);
  w.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && isFs()) fsShowUI(); });
  // Ketukan di dalam iframe tidak sampai ke halaman, tapi window kehilangan fokus -> anggap aktivitas
  window.addEventListener('blur', () => setTimeout(() => {
    if (isFs() && document.activeElement && document.activeElement.tagName === 'IFRAME') {
      if (!w.classList.contains('ui-idle')) fsRestartTimer();
      try { window.focus(); } catch (e) {}
    }
  }, 0));
}
