// Fungsi bantu membaca paket konfigurasi dan data. Tanpa nilai bisnis.
export const PEMISAH = ' | ';
export const KOSONG = '__kosong__';

export function norm(v) {
  return String(v === null || v === undefined ? '' : v).trim().replace(/\s+/g, ' ').toLowerCase();
}

export function fieldModul(paket, idModul) {
  return (paket.field || []).filter((f) => f.modul === idModul).sort((a, b) => a.urutan - b.urutan);
}

export function modulById(paket, id) {
  return (paket.modul || []).find((m) => m.id === id) || null;
}

export function opsiKelompok(paket, kelompok) {
  return (paket.opsi || []).filter((o) => o.kelompok === kelompok);
}

export function cariOpsi(paket, kelompok, nilai) {
  return opsiKelompok(paket, kelompok).find((o) => norm(o.nilai) === norm(nilai)) || null;
}

export function pecah(v) {
  return String(v === null || v === undefined ? '' : v)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Field judul sebuah modul: field wajib pertama bertipe teks; cadangan ID.
export function fieldJudul(paket, idModul) {
  const fs = fieldModul(paket, idModul);
  return (
    fs.find((f) => f.wajib && (f.tipe === 'text' || f.tipe === 'textarea')) ||
    fs.find((f) => f.tipe === 'text') || { header: 'ID', label: 'ID', tipe: 'readonly' }
  );
}

export function modulSumber(field) {
  return field && field.sumber && field.sumber.indexOf('sheet:') === 0 ? field.sumber.slice(6) : null;
}

export function pilihanRelasi(paket, field) {
  const idSumber = modulSumber(field);
  if (!idSumber) return [];
  const fj = fieldJudul(paket, idSumber);
  const fsUrut = fieldModul(paket, idSumber).find((f) => f.tipe === 'number');
  const rows = [...((paket.data || {})[idSumber] || [])];
  if (fsUrut) rows.sort((a, b) => (Number(a[fsUrut.header]) || 0) - (Number(b[fsUrut.header]) || 0));
  return rows.map((r) => ({ nilai: String(r.ID), label: r[fj.header] || String(r.ID) }));
}

export function labelRelasi(paket, field, nilai) {
  const p = pilihanRelasi(paket, field).find((x) => norm(x.nilai) === norm(nilai));
  return p ? p.label : nilai;
}

export function formatTanggal(paket, v) {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(v);
  const pola = (paket.app && paket.app.format_tanggal) || 'dd/MM/yyyy';
  return pola.replace('yyyy', m[1]).replace('MM', m[2]).replace('dd', m[3]);
}

export function formatAngka(v) {
  const n = Number(v);
  if (v === '' || v === null || v === undefined || isNaN(n)) return String(v === null || v === undefined ? '' : v);
  return n.toLocaleString('id-ID');
}

export function teksNilai(paket, field, nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return '';
  switch (field.tipe) {
    case 'select': {
      const o = cariOpsi(paket, field.sumber, nilai);
      return o ? o.label : String(nilai);
    }
    case 'relasi':
      return labelRelasi(paket, field, nilai);
    case 'multirelasi':
      return pecah(nilai).map((x) => labelRelasi(paket, field, x)).join(', ');
    case 'checkbox':
      return nilai === true || norm(nilai) === 'true' ? 'Ya' : '';
    case 'date':
      return formatTanggal(paket, nilai);
    default:
      return typeof nilai === 'number' ? formatAngka(nilai) : String(nilai);
  }
}

export function benar(v) {
  return v === true || norm(v) === 'true';
}
