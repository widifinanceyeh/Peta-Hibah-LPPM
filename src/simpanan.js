// Salinan data di perangkat (IndexedDB). Bila ditolak peramban, diam-diam diabaikan.
import { STORAGE_KEY } from './config';

const DB = STORAGE_KEY + '.db';
const STORE = 'paket';

function buka() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function baca() {
  const db = await buka();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get('utama');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function tulis(nilai) {
  const db = await buka();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).put(nilai, 'utama');
  } catch (e) {
    /* abaikan */
  }
}

export async function hapus() {
  const db = await buka();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).delete('utama');
  } catch (e) {
    /* abaikan */
  }
}
