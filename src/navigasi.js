import { STORAGE_KEY } from './config';
import { prefBaca, prefTulis } from './utils/pref';

const KUNCI = STORAGE_KEY + '.halaman';

export function bacaHash() {
  return decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
}

export function halamanTerakhir() {
  return prefBaca(KUNCI, '');
}

export function pindah(id) {
  prefTulis(KUNCI, id);
  if (bacaHash() === id) return;
  window.history.pushState(null, '', '#' + encodeURIComponent(id));
}

export function gantiTanpaRiwayat(id) {
  prefTulis(KUNCI, id);
  window.history.replaceState(null, '', '#' + encodeURIComponent(id));
}

export function dengarkan(cb) {
  const h = () => {
    const id = bacaHash();
    prefTulis(KUNCI, id);
    cb(id);
  };
  window.addEventListener('popstate', h);
  window.addEventListener('hashchange', h);
  return () => {
    window.removeEventListener('popstate', h);
    window.removeEventListener('hashchange', h);
  };
}
