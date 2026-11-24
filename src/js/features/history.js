// features/history.js
import { playSound } from '../core/audio.js';
import { S } from '../core/state.js';
import { $, esc, jsArg, lsGet, lsSet } from '../core/utils.js';
import { openEpisodeModal } from './episodes.js';
import { showToast } from '../ui/ui.js';

// ==================== HISTORY ====================
export function getHistory() { return lsGet('kstream_history', []); }
export function saveHistory(item) {
  let list = getHistory().filter(h => h.idMal !== item.idMal);
  list.unshift({ ...item, timestamp: Date.now() });
  lsSet('kstream_history', list.slice(0, 15)); // gagal simpan tidak boleh menghentikan pemutaran
  renderContinueWatching();
}
export function clearHistory() { if (!confirm('Hapus riwayat?')) return; try { localStorage.removeItem('kstream_history'); } catch (e) {} $('continueSection').classList.add('hidden'); showToast('Riwayat dihapus', 'info'); }
export function renderContinueWatching() {
  const list = getHistory();
  if (list.length === 0) { $('continueSection').classList.add('hidden'); return; }
  if (S.currentView === 'home') $('continueSection').classList.remove('hidden');
  $('continueGrid').innerHTML = list.slice(0, 8).map(h => `
    <div role="button" tabindex="0" aria-label="Lanjutkan ${esc(h.title)} episode ${Number(h.epNum)}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}" onclick="playSound('click'); resumeWatch(${Number(h.idMal)}, ${jsArg(h.title || '')}, ${Number(h.epNum)}, ${Number(h.totalEps)}, ${jsArg(h.coverImage || '')})" class="shrink-0 w-40 md:w-48 cursor-pointer group">
      <div class="relative aspect-[2/3] border-3 border-ink shadow-brutal-sm overflow-hidden card-hover">
        <img src="${esc(h.coverImage)}" class="w-full h-full object-cover" loading="lazy" alt="">
        <div class="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent"></div>
        <div class="absolute bottom-2 left-2 right-2"><div class="bg-yellow border-2 border-ink px-1.5 py-0.5 text-[10px] font-bold inline-block shadow-brutal-sm">EP ${Number(h.epNum)}/${Number(h.totalEps)}</div></div>
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="w-12 h-12 bg-pink border-3 border-white flex items-center justify-center rounded-full"><svg class="ico" style="font-size:24px;color:#fff;margin-left:2px"><use href="#i-play"/></svg></div>
        </div>
      </div>
      <p class="text-[11px] font-bold mt-2 line-clamp-2">${esc(h.title)}</p>
    </div>`).join('');
}
export function resumeWatch(idMal, title, epNum, totalEps, coverImage) { openEpisodeModal(idMal, title, totalEps, coverImage, epNum); }
