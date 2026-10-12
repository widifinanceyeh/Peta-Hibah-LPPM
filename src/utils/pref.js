// Preferensi tampilan di localStorage. Gagal baca/tulis tidak menghentikan aplikasi.
export function prefBaca(kunci, bawaan) {
  try {
    const v = window.localStorage.getItem(kunci);
    return v === null ? bawaan : JSON.parse(v);
  } catch (e) {
    return bawaan;
  }
}

export function prefTulis(kunci, nilai) {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch (e) {
    /* abaikan */
  }
}

export function prefHapus(kunci) {
  try {
    window.localStorage.removeItem(kunci);
  } catch (e) {
    /* abaikan */
  }
}
