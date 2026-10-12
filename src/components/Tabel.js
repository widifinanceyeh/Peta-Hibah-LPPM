import React, { memo, useRef, useState } from 'react';
import Nilai from './Nilai';

const Baris = memo(function Baris({ paket, row, kolom, lebar, terbuka, onToggle, onBuka, labelAksi }) {
  return (
    <tr
      className={terbuka ? 'baris-buka' : ''}
      onDoubleClick={(e) => {
        if (e.target.closest('button, a, input, select, textarea')) return;
        onToggle(row.ID);
      }}
    >
      {kolom.map((f, i) => (
        <td
          key={f.header}
          className={f.sticky && i === kolom.findIndex((k) => k.sticky) ? 'lekat-kiri' : ''}
          style={{ width: lebar[f.header] || f.lebar, maxWidth: lebar[f.header] || f.lebar }}
        >
          <div className="sel-isi">
            <Nilai paket={paket} field={f} nilai={row[f.header]} />
          </div>
        </td>
      ))}
      <td className="lekat-kanan kolom-aksi">
        <button type="button" className="tombol-kecil" onClick={() => onBuka(row)}>
          {labelAksi}
        </button>
      </td>
    </tr>
  );
});

export default function Tabel({ paket, fields, rows, lebar, setLebar, onBuka, labelAksi }) {
  const kolom = fields.filter((f) => f.tabel);
  const [terbuka, setTerbuka] = useState(null);
  const tarik = useRef(null);

  const mulaiTarik = (e, f) => {
    e.preventDefault();
    e.stopPropagation();
    const awal = e.clientX;
    const lebarAwal = lebar[f.header] || f.lebar;
    tarik.current = true;
    const gerak = (ev) => {
      const w = Math.max(60, Math.round(lebarAwal + ev.clientX - awal));
      setLebar((l) => ({ ...l, [f.header]: w }));
    };
    const lepas = () => {
      tarik.current = false;
      window.removeEventListener('pointermove', gerak);
      window.removeEventListener('pointerup', lepas);
    };
    window.addEventListener('pointermove', gerak);
    window.addEventListener('pointerup', lepas);
  };

  const toggle = (id) => setTerbuka((t) => (t === id ? null : id));
  const total = kolom.reduce((s, f) => s + (lebar[f.header] || f.lebar), 0) + 90;
  const idxLekat = kolom.findIndex((k) => k.sticky);

  return (
    <div className="tabel-wadah">
      <table className="tabel" style={{ width: total }}>
        <thead>
          <tr>
            {kolom.map((f, i) => (
              <th
                key={f.header}
                className={i === idxLekat ? 'lekat-kiri' : ''}
                style={{ width: lebar[f.header] || f.lebar }}
              >
                <span>{f.label}</span>
                <span className="pegangan" onPointerDown={(e) => mulaiTarik(e, f)} aria-hidden="true" />
              </th>
            ))}
            <th className="lekat-kanan kolom-aksi">
              <span className="sr">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={kolom.length + 1} className="tabel-kosong">
                Tidak ada data yang cocok dengan filter.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <Baris
              key={r.ID}
              paket={paket}
              row={r}
              kolom={kolom}
              lebar={lebar}
              terbuka={terbuka === r.ID}
              onToggle={toggle}
              onBuka={onBuka}
              labelAksi={labelAksi}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
