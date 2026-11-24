// core/config.js

// Konfigurasi & konstanta
export const ANILIST_API = 'https://graphql.anilist.co';

// Cache respons AniList (in-memory). 5 menit cukup untuk sesi browsing.
export const CACHE_TTL = 5 * 60 * 1000;
export const CACHE_MAX = 200;

// true = fullscreen bawaan MegaPlay dimatikan; fullscreen lewat tombol kita (wrapper) supaya tombol episode tetap tampil.
// Set false jika ingin tombol fullscreen di dalam video berfungsi lagi.
export const LOCK_FULLSCREEN = true;
export const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mahou Shoujo','Mecha','Music','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'];
export const SUGGESTIONS = ['Naruto', 'One Piece', 'Jujutsu Kaisen', 'Frieren', 'Attack on Titan', 'Demon Slayer', 'Spy x Family', 'Blue Lock'];
export const EP_PAGE = 50;
// Supabase proyek Sion-tool-01. Key publishable memang aman di klien; tabel dikunci RLS, akses hanya lewat fungsi RPC.
export const SUPABASE_URL = 'https://xkmridijfezrykvryiga.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_LHc0WQIxkgwwaDv8-xftVg_6a2gYibT';
export const COMMENT_PAGE = 20;

// Field daftar: TANPA description (HTML terberat di payload). Home meminta description sendiri untuk hero.
export const LIST_FIELDS = `
  id idMal title { romaji english } coverImage { extraLarge large } bannerImage
  averageScore status format genres episodes seasonYear
  nextAiringEpisode { episode }
`;
// Field detail: baru diambil saat modal detail dibuka.
export const DETAIL_FIELDS = `
  ${LIST_FIELDS}
  description
  studios(isMain: true) { nodes { name } }
  recommendations(sort: RATING_DESC, perPage: 6) { nodes { mediaRecommendation { ${LIST_FIELDS} isAdult } } }
`;
