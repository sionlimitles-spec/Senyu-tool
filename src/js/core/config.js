// core/config.js

// Konfigurasi & konstanta
export const ANILIST_API = 'https://graphql.anilist.co';
// true = fullscreen bawaan MegaPlay dimatikan; fullscreen lewat tombol kita (wrapper) supaya tombol episode tetap tampil.
// Set false jika ingin tombol fullscreen di dalam video berfungsi lagi.
export const LOCK_FULLSCREEN = true;
export const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mahou Shoujo','Mecha','Music','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'];
export const SUGGESTIONS = ['Naruto', 'One Piece', 'Jujutsu Kaisen', 'Frieren', 'Attack on Titan', 'Demon Slayer', 'Spy x Family', 'Blue Lock'];
export const EP_PAGE = 50;
export const MEDIA_FIELDS = `
  id idMal title { romaji english } coverImage { extraLarge large } bannerImage
  averageScore status format genres description episodes seasonYear
  nextAiringEpisode { episode }
`;
