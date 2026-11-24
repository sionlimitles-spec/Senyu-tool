// features/detail.js
import { fetchAniList } from '../core/api.js';
import { playSound } from '../core/audio.js';
import { DETAIL_FIELDS } from '../core/config.js';
import { animeStore } from '../core/state.js';
import { $, animeTitle, epCount, esc, formatScore, stripHtml, syncScrollLock } from '../core/utils.js';
import { openEpisodeModal } from './episodes.js';
import { openSocial, resetSocial } from './social.js';
import { isInWatchlist, toggleWatchlistById } from './watchlist.js';
import { hideModal, showModalFx, showToast } from '../ui/ui.js';

let detailCurrentAnime = null;

// ==================== DETAIL ====================
export async function openDetail(animeId) {
  const base = animeStore.get(animeId); if (!base) return;
  detailCurrentAnime = base;
  $('detailBanner').src = base.bannerImage || base.coverImage.extraLarge;
  $('detailCover').src = base.coverImage.extraLarge;
  $('detailTitle').textContent = animeTitle(base);
  $('detailDesc').textContent = stripHtml(base.description) || 'Memuat sinopsis…';
  $('detailMeta').innerHTML = `
    <span class="px-2 py-0.5 bg-yellow border-2 border-ink shadow-brutal-sm">★ ${formatScore(base.averageScore)}</span>
    ${base.format ? `<span class="px-2 py-0.5 bg-white border-2 border-ink shadow-brutal-sm">${esc(base.format)}</span>` : ''}
    ${base.seasonYear ? `<span class="px-2 py-0.5 bg-white border-2 border-ink shadow-brutal-sm">${esc(base.seasonYear)}</span>` : ''}
    ${base.episodes ? `<span class="px-2 py-0.5 bg-pink text-white border-2 border-ink shadow-brutal-sm">${esc(base.episodes)} EPS</span>` : ''}
    <span class="px-2 py-0.5 bg-white border-2 border-ink shadow-brutal-sm">${esc(base.status || '')}</span>`;
  $('detailGenres').innerHTML = (base.genres || []).map(g => `<span class="px-2 py-1 bg-white border-2 border-ink text-xs font-bold shadow-brutal-sm">${esc(g)}</span>`).join('');
  $('detailStudios').textContent = '';
  $('detailRecsWrap').classList.add('hidden');
  updateDetailBookmarkUI();
  openSocial(base.idMal);
  showModalFx('detailModal'); $('detailModal').classList.remove('hidden'); $('detailModal').classList.add('flex');
  $('detailModal').scrollTop = 0;
  syncScrollLock();
  try {
    const gql = `query($id: Int) { Media(id: $id, type: ANIME) { ${DETAIL_FIELDS} } }`;
    const data = await fetchAniList(gql, { id: animeId });
    if (!detailCurrentAnime || detailCurrentAnime.id !== animeId) return; // modal sudah ditutup / pindah anime
    // perbarui status & jadwal tayang (data watchlist/riwayat bisa basi) supaya episode belum rilis tidak muncul
    const m = data.Media;
    if (m.description && !base.description) base.description = m.description;
    $('detailDesc').textContent = stripHtml(base.description) || 'Sinopsis belum tersedia.';
    if (m.bannerImage && !base.bannerImage) { base.bannerImage = m.bannerImage; $('detailBanner').src = m.bannerImage; }
    Object.assign(base, { status: m.status ?? base.status, episodes: m.episodes ?? base.episodes, nextAiringEpisode: m.nextAiringEpisode });
    animeStore.set(base.id, base);
    const studios = data.Media.studios.nodes.map(s => s.name).join(', ');
    if (studios) $('detailStudios').textContent = `Studio: ${studios}`;
    const recs = data.Media.recommendations.nodes.map(r => r.mediaRecommendation).filter(r => r && !(r.isAdult));
    if (recs.length > 0) {
      // simpan ke store supaya klik rekomendasi bisa membuka detail
      recs.forEach(r => animeStore.set(r.id, { ...(animeStore.get(r.id) || {}), ...r }));
      $('detailRecs').innerHTML = recs.map(r => {
        const rt = animeTitle(r);
        return `<div role="button" tabindex="0" aria-label="${esc(rt)}" onclick="event.stopPropagation(); playSound('click'); openDetail(${Number(r.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}" class="cursor-pointer group">
          <div class="aspect-[2/3] border-3 border-ink overflow-hidden card-hover"><img src="${esc(r.coverImage.large)}" class="w-full h-full object-cover" loading="lazy" alt="${esc(rt)}"></div>
          <p class="text-[10px] font-bold mt-1.5 line-clamp-2">${esc(rt)}</p></div>`;
      }).join('');
      $('detailRecsWrap').classList.remove('hidden');
    }
  } catch (err) {
    // gagal ambil detail: jangan biarkan teks "Memuat sinopsis…" menggantung
    if (detailCurrentAnime && detailCurrentAnime.id === animeId && !stripHtml(base.description)) $('detailDesc').textContent = 'Sinopsis belum tersedia.';
  }
}
export function closeDetail() { detailCurrentAnime = null; resetSocial(); hideModal('detailModal'); }
export function watchFromDetail() {
  if (!detailCurrentAnime) return;
  const a = detailCurrentAnime;
  if (!a.idMal) { showToast('ID MAL tidak tersedia', 'error'); return; }
  closeDetail();
  openEpisodeModal(a.idMal, animeTitle(a), epCount(a), a.coverImage.extraLarge);
}
export function toggleWatchlistFromDetail() { if (detailCurrentAnime) toggleWatchlistById(detailCurrentAnime.id); }
export function updateDetailBookmarkUI() {
  if (!detailCurrentAnime) return;
  const inWL = isInWatchlist(detailCurrentAnime.idMal);
  $('detailBookmarkText').textContent = inWL ? 'TERSIMPAN' : 'SIMPAN';
  $('detailBookmarkBtn').classList.toggle('ks-btn--pink', inWL);
  $('detailBookmarkIcon').setAttribute('href', inWL ? '#i-bookmark-fill' : '#i-bookmark');
}
