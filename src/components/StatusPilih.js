import React, { useEffect, useRef, useState } from 'react';
import { opsiKelompok, opsiNilai } from '../utils/data';

export function Lencana({ warna, children, kecil, judul }) {
  return (
    <span className={'lencana lencana-' + (warna || 'abu') + (kecil ? ' lencana-kecil' : '')} title={judul}>
      {children}
    </span>
  );
}

/**
 * Status yang dapat diganti dengan satu klik: menampilkan label berwarna,
 * klik membuka pilihan dari Cfg_Opsi. Tanpa onPilih → hanya lencana.
 * `isi` mengganti teks tombol (mis. nama dokumen) tanpa mengubah perilaku.
 */
export default function StatusPilih({ paket, field, nilai, onPilih, kecil, isi }) {
  const [buka, setBuka] = useState(false);
  const [simpan, setSimpan] = useState({ status: '', nilai: null });
  const ref = useRef(null);
  const o = opsiNilai(paket, field, nilai);
  const warna = o ? o.warna : 'abu';
  const label = o ? o.label : nilai || '—';

  useEffect(() => {
    if (!buka) return undefined;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setBuka(false);
    const k = (e) => e.key === 'Escape' && setBuka(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [buka]);

  if (!field) return null;
  if (!onPilih) return <Lencana warna={warna} kecil={kecil}>{isi || label}</Lencana>;

  const pilih = (v) => {
    setBuka(false);
    if (String(v) === String(nilai)) return;
    setSimpan({ status: 'proses', nilai: v });
    onPilih(v)
      .then(() => setSimpan({ status: '', nilai: null }))
      .catch(() => setSimpan({ status: 'gagal', nilai: v }));
  };

  return (
    <span className="status-pilih" ref={ref}>
      <button
        type="button"
        className={'lencana lencana-' + warna + (kecil ? ' lencana-kecil' : '') + ' lencana-tombol'}
        onClick={() => setBuka(!buka)}
        aria-haspopup="listbox"
        aria-expanded={buka}
        title="Klik untuk mengganti status"
      >
        {isi || label}
        <span className="panah" aria-hidden="true">▾</span>
      </button>
      {simpan.status === 'proses' && <span className="simpan-teks">menyimpan…</span>}
      {simpan.status === 'gagal' && (
        <button type="button" className="simpan-gagal" onClick={() => pilih(simpan.nilai)}>
          Gagal · coba lagi
        </button>
      )}
      {buka && (
        <span className="status-daftar" role="listbox">
          {opsiKelompok(paket, field.sumber).map((x) => (
            <button
              type="button"
              role="option"
              aria-selected={String(x.nilai) === String(nilai)}
              key={x.nilai}
              className={String(x.nilai) === String(nilai) ? 'terpilih' : ''}
              onClick={() => pilih(x.nilai)}
            >
              <span className={'titik titik-' + (x.warna || 'abu')} aria-hidden="true" />
              {x.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
