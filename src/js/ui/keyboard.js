// ui/keyboard.js
import { getA11yTop, isOpen } from '../core/utils.js';
import { closeDetail } from '../features/detail.js';
import { closeEpisodeModal } from '../features/episodes.js';
import { changeEpisode, closePlayerModal, exitFs, isPseudoFs } from '../features/player.js';
import { showSearch } from '../features/search.js';

// ==================== KEYBOARD ====================
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && e.key !== 'Escape') return;
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !getA11yTop()) { e.preventDefault(); return showSearch(); }
  if (e.key === 'Escape' && isPseudoFs()) return exitFs();
  if (e.key === 'Escape') { // tutup modal paling atas dulu: episode (65) > player (60) > detail (50)
    if (isOpen('episodeModal')) return closeEpisodeModal();
    if (isOpen('playerModal')) return closePlayerModal();
    if (isOpen('detailModal')) return closeDetail();
  }
  if (isOpen('playerModal') && !isOpen('episodeModal')) {
    if (e.key === 'ArrowLeft') changeEpisode(-1);
    if (e.key === 'ArrowRight') changeEpisode(1);
  }
});
