import React from 'react';
import { cariOpsi, teksNilai, pecah, labelRelasi, benar } from '../utils/data';

export function Badge({ teks, warna, kecil }) {
  if (!teks) return null;
  return <span className={'badge badge-' + (warna || 'abu') + (kecil ? ' badge-kecil' : '')}>{teks}</span>;
}

export function BadgeOpsi({ paket, kelompok, nilai, kecil }) {
  if (nilai === '' || nilai === null || nilai === undefined) return null;
  const o = cariOpsi(paket, kelompok, nilai);
  return <Badge teks={o ? o.label : String(nilai)} warna={o ? o.warna : 'abu'} kecil={kecil} />;
}

export default function Nilai({ paket, field, nilai }) {
  if (nilai === '' || nilai === null || nilai === undefined) return <span className="kosong">—</span>;
  switch (field.tipe) {
    case 'select':
      return <BadgeOpsi paket={paket} kelompok={field.sumber} nilai={nilai} />;
    case 'multirelasi':
      return (
        <span className="chip-baris">
          {pecah(nilai).map((x) => (
            <span key={x} className="chip">{labelRelasi(paket, field, x)}</span>
          ))}
        </span>
      );
    case 'checkbox':
      return benar(nilai) ? <Badge teks={field.label} warna="kuning" kecil /> : <span className="kosong">—</span>;
    case 'url':
      return (
        <a href={String(nilai)} target="_blank" rel="noreferrer" className="tautan">
          Buka
        </a>
      );
    default:
      return <span>{teksNilai(paket, field, nilai)}</span>;
  }
}
