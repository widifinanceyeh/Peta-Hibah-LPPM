import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Nilai from './Nilai';
import PenandaSimpan from './PenandaSimpan';
import { fieldModul, fieldJudul, opsiKelompok, pilihanRelasi, pecah, norm, benar, PEMISAH } from '../utils/data';

function Kontrol({ paket, f, nilai, onUbah }) {
  const id = 'f-' + f.modul + '-' + f.header.replace(/[^A-Za-z0-9]/g, '_');
  const v = nilai === null || nilai === undefined ? '' : nilai;
  switch (f.tipe) {
    case 'textarea':
      return <textarea id={id} className="input" rows={3} value={v} onChange={(e) => onUbah(e.target.value)} />;
    case 'number':
      return <input id={id} className="input" type="number" value={v} onChange={(e) => onUbah(e.target.value)} />;
    case 'date':
      return <input id={id} className="input" type="date" value={v} onChange={(e) => onUbah(e.target.value)} />;
    case 'url':
      return <input id={id} className="input" type="url" value={v} onChange={(e) => onUbah(e.target.value)} />;
    case 'email':
      return <input id={id} className="input" type="email" value={v} onChange={(e) => onUbah(e.target.value)} />;
    case 'checkbox':
      return (
        <label className="centang" htmlFor={id}>
          <input id={id} type="checkbox" checked={benar(v)} onChange={(e) => onUbah(e.target.checked)} /> Ya
        </label>
      );
    case 'select':
    case 'relasi': {
      const daftar =
        f.tipe === 'select'
          ? opsiKelompok(paket, f.sumber).map((o) => ({ nilai: o.nilai, label: o.label }))
          : pilihanRelasi(paket, f);
      const adaLama = v !== '' && !daftar.some((o) => norm(o.nilai) === norm(v));
      return (
        <select id={id} className="input" value={v} onChange={(e) => onUbah(e.target.value)}>
          <option value="">—</option>
          {adaLama && <option value={v}>{v} (di luar daftar)</option>}
          {daftar.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case 'multirelasi': {
      const pilih = pecah(v);
      const daftar = pilihanRelasi(paket, f);
      const lama = pilih.filter((p) => !daftar.some((o) => norm(o.nilai) === norm(p)));
      const ubah = (nilaiOpsi, cek) => {
        const set = cek ? [...pilih, nilaiOpsi] : pilih.filter((p) => norm(p) !== norm(nilaiOpsi));
        const urut = daftar.map((o) => o.nilai).filter((n) => set.some((s) => norm(s) === norm(n)));
        onUbah([...urut, ...lama.filter((l) => set.includes(l))].join(PEMISAH));
      };
      return (
        <div className="multi" id={id}>
          {daftar.map((o) => (
            <label key={o.nilai} className="centang">
              <input type="checkbox" checked={pilih.some((p) => norm(p) === norm(o.nilai))} onChange={(e) => ubah(o.nilai, e.target.checked)} />{' '}
              {o.label}
            </label>
          ))}
          {lama.map((l) => (
            <label key={l} className="centang">
              <input type="checkbox" checked onChange={() => ubah(l, false)} /> {l} (di luar daftar)
            </label>
          ))}
        </div>
      );
    }
    default:
      return <input id={id} className="input" type="text" value={v} onChange={(e) => onUbah(e.target.value)} />;
  }
}

export default function Form({ paket, modul, row, modeBaca, jeda, onSimpanField, onTambah, onArsip, onTutup }) {
  const fields = fieldModul(paket, modul.id).filter((f) => f.form && f.tipe !== 'hidden');
  const fj = fieldJudul(paket, modul.id);
  const tambah = !row;
  const bolehEdit = !modeBaca && (tambah ? modul.tambah : modul.edit);

  const awal = () => {
    const o = {};
    fields.forEach((f) => {
      o[f.header] = tambah ? (f.bawaan === undefined ? '' : f.bawaan) : row[f.header];
    });
    return o;
  };
  const [nilai, setNilai] = useState(awal);
  const [status, setStatus] = useState({});
  const [galat, setGalat] = useState('');
  const [proses, setProses] = useState(false);
  const [konfirmasiArsip, setKonfirmasiArsip] = useState(false);
  const timer = useRef({});
  const urutan = useRef({});

  useEffect(() => {
    const t = timer.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const kirim = (header, v) => {
    const no = (urutan.current[header] || 0) + 1;
    urutan.current[header] = no;
    setStatus((s) => ({ ...s, [header]: 'menyimpan' }));
    onSimpanField(header, v)
      .then(() => urutan.current[header] === no && setStatus((s) => ({ ...s, [header]: 'tersimpan' })))
      .catch(() => urutan.current[header] === no && setStatus((s) => ({ ...s, [header]: 'gagal' })));
  };

  const ubah = (f, v) => {
    setNilai((n) => ({ ...n, [f.header]: v }));
    if (tambah) return;
    clearTimeout(timer.current[f.header]);
    const langsung = ['select', 'relasi', 'checkbox', 'date', 'multirelasi'].includes(f.tipe);
    timer.current[f.header] = setTimeout(() => kirim(f.header, v), langsung ? 0 : jeda);
  };

  const simpanBaru = () => {
    const kurang = fields.filter((f) => f.wajib && f.edit && (nilai[f.header] === '' || nilai[f.header] === undefined));
    if (kurang.length) {
      setGalat('Lengkapi: ' + kurang.map((f) => f.label).join(', ') + '.');
      return;
    }
    setProses(true);
    setGalat('');
    const kirimNilai = {};
    fields.filter((f) => f.edit).forEach((f) => (kirimNilai[f.header] = nilai[f.header]));
    onTambah(kirimNilai)
      .then(() => onTutup())
      .catch((e) => setGalat(e.message))
      .finally(() => setProses(false));
  };

  const arsip = () => {
    setProses(true);
    onArsip()
      .then(() => onTutup())
      .catch((e) => setGalat(e.message))
      .finally(() => setProses(false));
  };

  const judul = tambah ? 'Tambah ' + modul.nama : (row && row[fj.header]) || row.ID;

  let kaki = null;
  if (tambah && bolehEdit) {
    kaki = (
      <>
        <button type="button" className="tombol" onClick={onTutup}>
          Batal
        </button>
        <button type="button" className="tombol tombol-utama" onClick={simpanBaru} disabled={proses}>
          {proses ? 'Menyimpan…' : 'Simpan'}
        </button>
      </>
    );
  } else if (!tambah && !modeBaca && modul.arsip) {
    kaki = konfirmasiArsip ? (
      <span className="konfirmasi">
        Arsipkan data ini? Data tetap ada di Sheet dengan tanda Arsip.
        <button type="button" className="tombol" onClick={() => setKonfirmasiArsip(false)}>
          Batal
        </button>
        <button type="button" className="tombol tombol-bahaya" onClick={arsip} disabled={proses}>
          Ya, arsipkan
        </button>
      </span>
    ) : (
      <button type="button" className="tombol-teks bahaya" onClick={() => setKonfirmasiArsip(true)}>
        Arsipkan
      </button>
    );
  }

  return (
    <Modal judul={judul} onTutup={onTutup} kaki={kaki}>
      {!tambah && <p className="form-id">{modul.nama} · {row.ID}</p>}
      {galat && <p className="form-galat">{galat}</p>}
      <div className="form">
        {fields.map((f) => {
          const dapatUbah = bolehEdit && f.edit && f.tipe !== 'readonly';
          return (
            <div key={f.header} className={'form-baris' + (f.tipe === 'textarea' || f.tipe === 'multirelasi' ? ' form-lebar' : '')}>
              <div className="form-label">
                <label htmlFor={'f-' + f.modul + '-' + f.header.replace(/[^A-Za-z0-9]/g, '_')}>
                  {f.label}
                  {tambah && f.wajib && f.edit ? <span className="wajib"> *</span> : null}
                </label>
                {!tambah && (
                  <PenandaSimpan status={status[f.header]} onUlang={() => kirim(f.header, nilai[f.header])} />
                )}
              </div>
              {dapatUbah ? (
                <Kontrol paket={paket} f={f} nilai={nilai[f.header]} onUbah={(v) => ubah(f, v)} />
              ) : (
                <div className="form-baca">
                  <Nilai paket={paket} field={f} nilai={nilai[f.header]} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
