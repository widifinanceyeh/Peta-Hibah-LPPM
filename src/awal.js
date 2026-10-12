import { apiGet } from './api';
import { APP_VERSION } from './config';
import * as simpanan from './simpanan';

// Salinan perangkat dari versi aplikasi lain dibuang.
export async function bacaSalinan() {
  const s = await simpanan.baca();
  if (!s || s.appVersion !== APP_VERSION || !s.paket) {
    if (s) await simpanan.hapus();
    return null;
  }
  return s.paket;
}

export function simpanSalinan(paket) {
  return simpanan.tulis({ appVersion: APP_VERSION, paket, waktu: Date.now() });
}

export async function tarikInit(paksa) {
  const params = paksa ? { nocache: '1', t: String(Date.now()) } : {};
  const paket = await apiGet('init', params);
  await simpanSalinan(paket);
  return paket;
}

export async function cekVersi() {
  const r = await apiGet('versi');
  return r && r.versi;
}
