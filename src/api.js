import { API_URL, TIMEOUT } from './config';

export class GalatData extends Error {}

function urlSiap() {
  return API_URL && /^https:\/\//.test(API_URL);
}

async function ambil(url, opsi) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { ...opsi, signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new TypeError('HTTP ' + res.status);
    const teks = await res.text();
    let json;
    try {
      json = JSON.parse(teks);
    } catch (e) {
      throw new TypeError('Balasan server bukan JSON. Periksa akses Web App (Anyone).');
    }
    if (!json.success) throw new GalatData(json.message || 'Permintaan ditolak server.');
    return json.data;
  } catch (e) {
    if (e.name === 'AbortError') throw new TypeError('Server tidak menjawab dalam batas waktu.');
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function susunUrl(params) {
  const q = new URLSearchParams(params);
  return API_URL + (API_URL.includes('?') ? '&' : '?') + q.toString();
}

export async function apiGet(action, params = {}) {
  if (!urlSiap()) throw new GalatData('URL server belum diisi di src/config.js.');
  const url = susunUrl({ action, ...params });
  try {
    return await ambil(url, { method: 'GET' });
  } catch (e) {
    if (e instanceof GalatData) throw e;
    return ambil(url, { method: 'GET' }); // ulang sekali untuk galat jaringan
  }
}

export async function apiPost(action, payload = {}) {
  if (!urlSiap()) throw new GalatData('URL server belum diisi di src/config.js.');
  const body = JSON.stringify({ action, ...payload });
  try {
    return await ambil(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
  } catch (e) {
    if (e instanceof GalatData) throw e;
    // Cadangan: kirim lewat GET ?p=
    return ambil(susunUrl({ action, p: JSON.stringify(payload) }), { method: 'GET' });
  }
}
