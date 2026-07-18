import manifest from './music-manifest.json';

// public/Muzik/ altındaki dosyalar (build-time manifest). Runtime'da relative
// "/Muzik/..." ile çalınır (vite base:'./' ile GitHub Pages uyumlu).
export const LOCAL_MUSIC_LIBRARY = manifest.map((m) => ({
  id: m.id,
  title: m.title,
  path: m.file,
  // base:'./' olduğu için kök-relative path kullanılır; fetch edilirken
  // index.html ile aynı dizinden çözülür.
  url: './' + m.file,
  originalName: m.originalName,
}));

export const getMusicUrlById = (id) => {
  const item = LOCAL_MUSIC_LIBRARY.find((m) => m.id === id);
  return item ? item.url : null;
};
export const getMusicProxyUrl = async () => '';
