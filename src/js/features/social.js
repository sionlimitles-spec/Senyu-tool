// features/social.js
import { COMMENT_PAGE } from '../core/config.js';
import { getDeviceId, getSavedName, rpc, saveName } from '../core/supabase.js';
import { $, esc } from '../core/utils.js';
import { showToast } from '../ui/ui.js';

// ==================== LIKE, RATING, KOMENTAR (Supabase) ====================
const ctx = { mal: 0, req: 0, busy: false, oldestId: null, summary: null };

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(s)) return '';
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 2592000) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function resetSocial() {
  ctx.mal = 0; ctx.req++; ctx.busy = false; ctx.oldestId = null; ctx.summary = null;
  const w = $('socialWrap'); if (w) w.classList.add('hidden');
}

// dipanggil dari openDetail; idMal kosong = anime tanpa ID MAL, blok sosial disembunyikan
export async function openSocial(idMal) {
  resetSocial();
  if (!idMal) return;
  ctx.mal = idMal;
  const my = ++ctx.req;
  $('socialWrap').classList.remove('hidden');
  $('commentName').value = getSavedName();
  $('commentList').innerHTML = '<p class="text-xs font-bold text-ink/50">Memuat…</p>';
  $('commentMoreWrap').classList.add('hidden');
  renderSummary({ likes: 0, liked: false, rating_avg: 0, rating_count: 0, my_rating: null, comments: 0 }, true);
  try {
    const [summary, comments] = await Promise.all([
      rpc('anime_social', { p_mal: idMal, p_device: getDeviceId() }),
      rpc('list_comments', { p_mal: idMal, p_device: getDeviceId(), p_before: null, p_limit: COMMENT_PAGE }),
    ]);
    if (my !== ctx.req) return;
    renderSummary(summary, false);
    $('commentList').innerHTML = '';
    appendComments(comments);
  } catch (err) {
    if (my !== ctx.req) return;
    renderSummary(ctx.summary || { likes: 0, liked: false, rating_avg: 0, rating_count: 0, my_rating: null, comments: 0 }, true);
    $('commentList').innerHTML = '<p class="text-xs font-bold text-blood">Gagal memuat komentar &amp; rating. Tutup lalu buka lagi untuk mencoba ulang.</p>';
  }
}

function renderSummary(s, disabled) {
  ctx.summary = s;
  const likeBtn = $('likeBtn');
  likeBtn.disabled = !!disabled;
  likeBtn.setAttribute('aria-pressed', String(!!s.liked));
  likeBtn.classList.toggle('ks-btn--pink', !!s.liked);
  $('likeIcon').setAttribute('href', s.liked ? '#i-heart-fill' : '#i-heart');
  $('likeCount').textContent = String(s.likes);
  const mine = s.my_rating || 0;
  $('ratingStars').innerHTML = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" ${disabled ? 'disabled' : ''} aria-label="Beri ${n} bintang" aria-pressed="${mine === n}" onclick="playSound('click'); rateAnime(${n})" class="ks-star ${n <= mine ? 'text-pink' : 'text-ink/25'}"><svg class="ico"><use href="#i-star"/></svg></button>`
  ).join('');
  const avg = Number(s.rating_avg) || 0;
  $('ratingInfo').textContent = s.rating_count > 0
    ? `${avg.toFixed(1)}/5 · ${s.rating_count} rating${mine ? ` · rating kamu ${mine}` : ''}`
    : 'Belum ada rating';
  $('commentCount').textContent = `(${s.comments})`;
}

export async function toggleLike() {
  if (!ctx.mal || ctx.busy) return;
  const mal = ctx.mal, my = ctx.req;
  ctx.busy = true;
  try {
    const s = await rpc('toggle_like', { p_mal: mal, p_device: getDeviceId() });
    if (my !== ctx.req) return;
    renderSummary(s, false);
  } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
  finally { if (my === ctx.req) ctx.busy = false; }
}

// klik bintang yang sama = hapus rating
export async function rateAnime(n) {
  if (!ctx.mal || ctx.busy) return;
  const mal = ctx.mal, my = ctx.req;
  const score = (ctx.summary && ctx.summary.my_rating === n) ? 0 : n;
  ctx.busy = true;
  try {
    const s = await rpc('set_rating', { p_mal: mal, p_device: getDeviceId(), p_score: score });
    if (my !== ctx.req) return;
    renderSummary(s, false);
    showToast(score ? `Rating ${score} bintang tersimpan` : 'Rating dihapus', 'success');
  } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
  finally { if (my === ctx.req) ctx.busy = false; }
}

function commentHtml(c) {
  const id = Number(c.id);
  return `<article class="bg-white border-3 border-ink shadow-brutal-sm p-3" data-cid="${id}">
    <div class="flex items-center justify-between gap-2 text-xs font-bold">
      <span class="truncate">${esc(c.author)}</span>
      <span class="text-ink/50 shrink-0">${esc(timeAgo(c.created_at))}</span>
    </div>
    <p class="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words">${esc(c.body)}</p>
    ${c.mine ? `<button type="button" onclick="playSound('click'); deleteComment(${id})" class="mt-2 text-xs font-bold text-blood underline">Hapus</button>` : ''}
  </article>`;
}
function appendComments(list) {
  const box = $('commentList');
  if (list.length === 0 && !box.children.length) box.innerHTML = '<p class="text-xs font-bold text-ink/50">Belum ada komentar. Jadilah yang pertama.</p>';
  box.insertAdjacentHTML('beforeend', list.map(commentHtml).join(''));
  if (list.length) ctx.oldestId = list[list.length - 1].id;
  $('commentMoreWrap').classList.toggle('hidden', list.length < COMMENT_PAGE);
}

export async function loadMoreComments() {
  if (!ctx.mal || ctx.busy || ctx.oldestId == null) return;
  const mal = ctx.mal, my = ctx.req;
  ctx.busy = true;
  try {
    const list = await rpc('list_comments', { p_mal: mal, p_device: getDeviceId(), p_before: ctx.oldestId, p_limit: COMMENT_PAGE });
    if (my !== ctx.req) return;
    appendComments(list);
  } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
  finally { if (my === ctx.req) ctx.busy = false; }
}

export async function submitComment(e) {
  e.preventDefault();
  if (!ctx.mal || ctx.busy) return;
  const mal = ctx.mal, my = ctx.req;
  const author = $('commentName').value.trim(), body = $('commentBody').value.trim();
  if (!author || !body) { showToast('Nama dan komentar wajib diisi', 'warn'); return; }
  ctx.busy = true; $('commentSubmit').disabled = true;
  try {
    const c = await rpc('add_comment', { p_mal: mal, p_device: getDeviceId(), p_author: author, p_body: body });
    if (my !== ctx.req) return;
    saveName(author);
    $('commentBody').value = '';
    const box = $('commentList');
    if (!box.querySelector('[data-cid]')) box.innerHTML = '';
    box.insertAdjacentHTML('afterbegin', commentHtml(c));
    if (ctx.oldestId == null) ctx.oldestId = c.id;
    if (ctx.summary) renderSummary({ ...ctx.summary, comments: ctx.summary.comments + 1 }, false);
    showToast('Komentar terkirim', 'success');
  } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
  finally { if (my === ctx.req) ctx.busy = false; $('commentSubmit').disabled = false; }
}

export async function deleteComment(id) {
  if (!ctx.mal || ctx.busy) return;
  const my = ctx.req;
  ctx.busy = true;
  try {
    const ok = await rpc('delete_comment', { p_id: Number(id), p_device: getDeviceId() });
    if (my !== ctx.req) return;
    if (!ok) { showToast('Komentar tidak bisa dihapus', 'error'); return; }
    const el = $('commentList').querySelector(`[data-cid="${Number(id)}"]`); if (el) el.remove();
    if (!$('commentList').querySelector('[data-cid]')) $('commentList').innerHTML = '<p class="text-xs font-bold text-ink/50">Belum ada komentar. Jadilah yang pertama.</p>';
    if (ctx.summary) renderSummary({ ...ctx.summary, comments: Math.max(0, ctx.summary.comments - 1) }, false);
  } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
  finally { if (my === ctx.req) ctx.busy = false; }
}
