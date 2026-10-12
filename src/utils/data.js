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

// ---------- v1.1.0: pembacaan berbasis peran (kolom Peran di Cfg_Field) ----------
const urutF = (a, b) => a.urutan - b.urutan;

export function modulTipe(paket, tipe) {
  return (paket.modul || []).find((m) => m.tipe === tipe) || null;
}

export function fPeran(paket, idModul, peran) {
  return (paket.field || []).filter((f) => f.modul === idModul && f.peran === peran).sort(urutF)[0] || null;
}

export function fsPeran(paket, idModul, peran) {
  return (paket.field || []).filter((f) => f.modul === idModul && f.peran === peran).sort(urutF);
}

export function vp(paket, modul, row, peran) {
  if (!modul || !row) return '';
  const f = fPeran(paket, modul.id, peran);
  return f ? row[f.header] : '';
}

export function baris(paket, modul) {
  if (!modul) return [];
  const rows = [...((paket.data || {})[modul.id] || [])];
  const f = fPeran(paket, modul.id, 'urutan') || fPeran(paket, modul.id, 'tahun');
  if (f) rows.sort((a, b) => (Number(a[f.header]) || 0) - (Number(b[f.header]) || 0));
  return rows;
}

export function opsiNilai(paket, field, nilai) {
  return field ? cariOpsi(paket, field.sumber, nilai) : null;
}

export function warnaNilai(paket, field, nilai) {
  const o = opsiNilai(paket, field, nilai);
  return o ? o.warna || 'abu' : 'abu';
}

export function labelNilai(paket, field, nilai) {
  const o = opsiNilai(paket, field, nilai);
  return o ? o.label : String(nilai === null || nilai === undefined ? '' : nilai);
}

export function warnaStatus(paket, modul, row) {
  if (!modul) return 'abu';
  return warnaNilai(paket, fPeran(paket, modul.id, 'status'), vp(paket, modul, row, 'status'));
}

// Status berwarna hijau di Cfg_Opsi = sudah beres/siap.
export function beres(paket, modul, row) {
  return warnaStatus(paket, modul, row) === 'hijau';
}

export function terkaitTahap(paket, modulItem, modulTahap, idTahap) {
  if (!modulItem || !modulTahap) return [];
  const rel = fieldModul(paket, modulItem.id).find(
    (f) => (f.tipe === 'relasi' || f.tipe === 'multirelasi') && modulSumber(f) === modulTahap.id
  );
  if (!rel) return [];
  return baris(paket, modulItem).filter((r) =>
    rel.tipe === 'multirelasi' ? pecah(r[rel.header]).some((x) => norm(x) === norm(idTahap)) : norm(r[rel.header]) === norm(idTahap)
  );
}

export function hariIni() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

export function fmtRp(v) {
  const n = Number(v);
  if (v === '' || v === null || v === undefined || isNaN(n)) return String(v === null || v === undefined ? '' : v);
  if (Math.abs(n) >= 1e6) return 'Rp' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (Math.abs(n) >= 1e3) return 'Rp' + (n / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
  return 'Rp' + n.toLocaleString('id-ID');
}

export function angka(v) {
  const n = Number(v);
  return v === '' || v === null || v === undefined || isNaN(n) ? null : n;
}

// Tanda ⟳: ada dokumen sumber yang versinya lebih baru daripada tanggal terakhir dicek.
export function perluCek(paket, modul, row, idSumber) {
  const mD = modulTipe(paket, 'dokumen');
  if (!mD || !modul || !row) return false;
  const fPer = fPeran(paket, modul.id, 'periksa');
  if (!fPer) return false;
  const ids = idSumber || pecah(vp(paket, modul, row, 'sumber'));
  const versi = {};
  baris(paket, mD).forEach((d) => (versi[d.ID] = String(vp(paket, mD, d, 'versi') || '').slice(0, 10)));
  const terbaru = ids.map((id) => versi[id]).filter(Boolean).sort().pop();
  if (!terbaru) return false;
  const dicek = String(row[fPer.header] || '').slice(0, 10);
  return !dicek || terbaru > dicek;
}

export function namaDokumen(paket, id) {
  const mD = modulTipe(paket, 'dokumen');
  const d = baris(paket, mD).find((x) => x.ID === id);
  return d ? vp(paket, mD, d, 'singkat') || vp(paket, mD, d, 'judul') : id;
}
