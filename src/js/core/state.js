// core/state.js

// State bersama antar modul (objek S dipakai supaya nilai bisa diubah dari modul mana pun)
export const animeStore = new Map();
export const S = {
  homeAnimes: [], homeHasNext: true,
  currentPage: 1, currentView: 'home', currentLoader: null,
  listReq: 0, listAbort: null,
  episodeCtx: { idMal: 0, title: '', totalEps: 12, coverImage: '' },
};
export const playerState = { idMal: 0, epNum: 1, totalEps: 12, title: '', coverImage: '' };
