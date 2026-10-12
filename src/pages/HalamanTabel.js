import React, { useEffect, useMemo, useState } from 'react';
import FilterBar, { terapkanFilter } from '../components/FilterBar';
import Tabel from '../components/Tabel';
import { fieldModul } from '../utils/data';
import { prefBaca, prefTulis } from '../utils/pref';
import { STORAGE_KEY } from '../config';

export function kunciLebar(idModul) {
  return STORAGE_KEY + '.lebar.' + idModul;
}

export default function HalamanTabel({ paket, modul, modeBaca, onBuka, onTambah }) {
  const fields = useMemo(() => fieldModul(paket, modul.id), [paket, modul.id]);
  const kunciFilter = STORAGE_KEY + '.filter.' + modul.id;
  const [filter, setFilterState] = useState(() => prefBaca(kunciFilter, {}));
  const [lebar, setLebar] = useState(() => prefBaca(kunciLebar(modul.id), {}));

  // Komponen dipasang ulang (key) saat modul berganti atau lebar direset.
  useEffect(() => {
    prefTulis(kunciLebar(modul.id), lebar);
  }, [lebar, modul.id]);

  const setFilter = (f) => {
    setFilterState(f);
    prefTulis(kunciFilter, f);
  };

  const semua = useMemo(() => {
    const rows = [...((paket.data || {})[modul.id] || [])];
    const fUrut = fields.find((f) => f.tipe === 'number');
    if (fUrut) rows.sort((a, b) => (Number(a[fUrut.header]) || 0) - (Number(b[fUrut.header]) || 0));
    return rows;
  }, [paket, modul.id, fields]);
  const rows = useMemo(() => terapkanFilter(paket, fields, semua, filter), [paket, fields, semua, filter]);

  return (
    <div className="halaman">
      <header className="halaman-kepala halaman-kepala-baris">
        <div>
          <h1>{modul.judul}</h1>
          {modul.deskripsi && <p className="halaman-deskripsi">{modul.deskripsi}</p>}
        </div>
        {!modeBaca && modul.tambah && (
          <button type="button" className="tombol tombol-utama" onClick={onTambah}>
            Tambah
          </button>
        )}
      </header>
      <FilterBar paket={paket} fields={fields} rows={semua} filter={filter} setFilter={setFilter} jumlah={rows.length} />
      <Tabel
        paket={paket}
        fields={fields}
        rows={rows}
        lebar={lebar}
        setLebar={setLebar}
        onBuka={(r) => onBuka(modul, r)}
        labelAksi={modeBaca ? 'Lihat' : 'Buka'}
      />
      <p className="petunjuk">Klik ganda baris untuk membuka isi penuh. Seret tepi kepala kolom untuk mengubah lebar.</p>
    </div>
  );
}
