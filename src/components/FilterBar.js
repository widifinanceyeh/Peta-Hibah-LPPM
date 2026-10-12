import React from 'react';
import { norm, pecah, opsiKelompok, pilihanRelasi, teksNilai, KOSONG, benar } from '../utils/data';

// Pilihan filter: dari konfigurasi/relasi, ditambah nilai yang ada di data.
export function pilihanFilter(paket, field, rows) {
  let dasar = [];
  if (field.tipe === 'select') dasar = opsiKelompok(paket, field.sumber).map((o) => ({ nilai: o.nilai, label: o.label }));
  else if (field.tipe === 'relasi' || field.tipe === 'multirelasi') dasar = pilihanRelasi(paket, field);
  else if (field.tipe === 'checkbox') dasar = [{ nilai: 'true', label: 'Ya' }, { nilai: 'false', label: 'Tidak' }];
  const ada = new Set(dasar.map((d) => norm(d.nilai)));
  rows.forEach((r) => {
    const vals = field.tipe === 'multirelasi' ? pecah(r[field.header]) : [r[field.header]];
    vals.forEach((v) => {
      if (v === '' || v === null || v === undefined || field.tipe === 'checkbox') return;
      if (!ada.has(norm(v))) {
        ada.add(norm(v));
        dasar.push({ nilai: String(v), label: teksNilai(paket, field, v) });
      }
    });
  });
  return [...dasar, { nilai: KOSONG, label: '(Kosong)' }];
}

export function terapkanFilter(paket, fields, rows, filter) {
  const cari = norm(filter.cari);
  return rows.filter((r) => {
    for (const f of fields) {
      const pilih = filter[f.header];
      if (!pilih) continue;
      const v = r[f.header];
      const kosong = v === '' || v === null || v === undefined;
      if (pilih === KOSONG) {
        if (!kosong) return false;
        continue;
      }
      if (f.tipe === 'checkbox') {
        if (benar(v) !== (pilih === 'true')) return false;
      } else if (f.tipe === 'multirelasi') {
        if (!pecah(v).some((x) => norm(x) === norm(pilih))) return false;
      } else if (norm(v) !== norm(pilih)) return false;
    }
    if (cari) {
      const teks = fields.map((f) => norm(teksNilai(paket, f, r[f.header]))).join(' ') + ' ' + norm(r.ID);
      if (!teks.includes(cari)) return false;
    }
    return true;
  });
}

export default function FilterBar({ paket, fields, rows, filter, setFilter, jumlah }) {
  const fFilter = fields.filter((f) => f.filter);
  const aktif = Object.keys(filter).some((k) => filter[k]);
  return (
    <div className="filter-bar">
      <input
        id="filter-cari"
        type="search"
        className="input filter-cari"
        placeholder="Cari…"
        value={filter.cari || ''}
        onChange={(e) => setFilter({ ...filter, cari: e.target.value })}
      />
      {fFilter.map((f) => (
        <select
          key={f.header}
          id={'filter-' + f.header}
          className="input"
          value={filter[f.header] || ''}
          onChange={(e) => setFilter({ ...filter, [f.header]: e.target.value })}
          aria-label={'Filter ' + f.label}
        >
          <option value="">{f.label}: semua</option>
          {pilihanFilter(paket, f, rows).map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <span className="filter-jumlah">{jumlah} data</span>
      {aktif && (
        <button type="button" className="tombol-teks" onClick={() => setFilter({})}>
          Reset
        </button>
      )}
    </div>
  );
}
