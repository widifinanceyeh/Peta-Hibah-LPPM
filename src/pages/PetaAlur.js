import React, { useMemo, useState } from 'react';
import { BadgeOpsi, Badge } from '../components/Nilai';
import Nilai from '../components/Nilai';
import { fieldModul, fieldJudul, modulSumber, pecah, norm, teksNilai, formatAngka, benar } from '../utils/data';
import { prefBaca, prefTulis } from '../utils/pref';
import { STORAGE_KEY } from '../config';

const KUNCI_TAHAP = STORAGE_KEY + '.tahap';

// Modul lain yang punya kolom relasi ke modul peta.
function modulTerkait(paket, idPeta) {
  return (paket.modul || [])
    .filter((m) => m.id !== idPeta)
    .map((m) => {
      const rel = fieldModul(paket, m.id).find((f) => (f.tipe === 'relasi' || f.tipe === 'multirelasi') && modulSumber(f) === idPeta);
      return rel ? { modul: m, rel } : null;
    })
    .filter(Boolean);
}

function barisTerkait(paket, t, idTahap) {
  return ((paket.data || {})[t.modul.id] || []).filter((r) =>
    t.rel.tipe === 'multirelasi' ? pecah(r[t.rel.header]).some((x) => norm(x) === norm(idTahap)) : norm(r[t.rel.header]) === norm(idTahap)
  );
}

function ItemTerkait({ paket, modul, row, onBuka }) {
  const fs = fieldModul(paket, modul.id);
  const fj = fieldJudul(paket, modul.id);
  const sub = fs.filter((f) => f.tabel && f.header !== fj.header && ['text', 'date'].includes(f.tipe) && row[f.header] !== '' && row[f.header] !== undefined);
  const badge = fs.filter((f) => f.tabel && f.tipe === 'select');
  const centang = fs.filter((f) => f.tabel && f.tipe === 'checkbox' && benar(row[f.header]));
  const url = fs.find((f) => f.tipe === 'url' && row[f.header]);
  return (
    <li className="item-terkait">
      <button type="button" className="item-tombol" onClick={() => onBuka(modul, row)}>
        <span className="item-judul">{row[fj.header] || row.ID}</span>
        {sub.length > 0 && <span className="item-sub">{sub.map((f) => teksNilai(paket, f, row[f.header])).join(' · ')}</span>}
      </button>
      <span className="item-badge">
        {badge.map((f) => (
          <BadgeOpsi key={f.header} paket={paket} kelompok={f.sumber} nilai={row[f.header]} kecil />
        ))}
        {centang.map((f) => (
          <Badge key={f.header} teks={f.label} warna="kuning" kecil />
        ))}
        {url && <Nilai paket={paket} field={url} nilai={row[url.header]} />}
      </span>
    </li>
  );
}

function TabelTermin({ paket, idBiaya }) {
  const app = paket.app || {};
  const kPlafon = app.kelompok_plafon, kTermin = app.kelompok_termin;
  if (!idBiaya || !kPlafon || !kTermin) return null;
  const fs = fieldModul(paket, idBiaya);
  const fKel = fs.find((f) => f.tipe === 'select' && (paket.opsi || []).some((o) => o.kelompok === f.sumber && norm(o.nilai) === norm(kPlafon)));
  const fNilai = fs.find((f) => norm(f.label) === 'nilai' || norm(f.header) === 'nilai');
  const fj = fieldJudul(paket, idBiaya);
  if (!fKel || !fNilai) return null;
  const rows = (paket.data || {})[idBiaya] || [];
  const angka = (v) => (v !== '' && !isNaN(Number(v)) ? Number(v) : null);
  const plafon = rows.filter((r) => norm(r[fKel.header]) === norm(kPlafon) && angka(r[fNilai.header]) !== null);
  const termin = rows.filter((r) => norm(r[fKel.header]) === norm(kTermin) && angka(r[fNilai.header]) !== null);
  if (!plafon.length || !termin.length) return null;
  const totalPersen = termin.reduce((s, r) => s + angka(r[fNilai.header]), 0);
  return (
    <section className="panel">
      <h3 className="panel-judul">Nilai termin per skema (Rp)</h3>
      <div className="tabel-wadah tabel-pendek">
        <table className="tabel tabel-termin">
          <thead>
            <tr>
              <th>Skema</th>
              <th className="angka">Plafon</th>
              {termin.map((t) => (
                <th key={t.ID} className="angka" title={t[fj.header]}>
                  {String(t[fj.header]).split(' — ')[0]} ({formatAngka(t[fNilai.header])}%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plafon.map((p) => (
              <tr key={p.ID}>
                <td>{p[fj.header]}</td>
                <td className="angka">{formatAngka(p[fNilai.header])}</td>
                {termin.map((t) => (
                  <td key={t.ID} className="angka">
                    {formatAngka(Math.round((angka(p[fNilai.header]) * angka(t[fNilai.header])) / 100))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPersen !== 100 && <p className="peringatan">Jumlah persentase termin {totalPersen}%, bukan 100%.</p>}
    </section>
  );
}

export default function PetaAlur({ paket, modul, modeBaca, onBuka }) {
  const fs = fieldModul(paket, modul.id);
  const fj = fieldJudul(paket, modul.id);
  const fUrut = fs.find((f) => f.tipe === 'number');
  const fStatus = fs.find((f) => f.tipe === 'select');
  const tahap = useMemo(() => {
    const r = [...((paket.data || {})[modul.id] || [])];
    if (fUrut) r.sort((a, b) => (Number(a[fUrut.header]) || 0) - (Number(b[fUrut.header]) || 0));
    return r;
  }, [paket, modul.id, fUrut]);
  const terkait = useMemo(() => modulTerkait(paket, modul.id), [paket, modul.id]);
  const [pilih, setPilihState] = useState(() => prefBaca(KUNCI_TAHAP, ''));
  const setPilih = (id) => {
    setPilihState(id);
    prefTulis(KUNCI_TAHAP, id);
  };
  const aktif = tahap.find((t) => t.ID === pilih) || tahap[0];
  const fDetail = fs.filter((f) => f.form && f.header !== fj.header && f !== fUrut && f !== fStatus);
  const idBiaya = (terkait.find((t) => (paket.app || {}).modul_biaya === t.modul.id) || {}).modul;

  return (
    <div className="halaman">
      <header className="halaman-kepala">
        <h1>{modul.judul}</h1>
        {modul.deskripsi && <p className="halaman-deskripsi">{modul.deskripsi}</p>}
      </header>

      {tahap.length === 0 ? (
        <p className="kosong-besar">Belum ada tahap di sheet {modul.sheet}.</p>
      ) : (
        <>
          <ol className="alur" aria-label="Tahap siklus hibah">
            {tahap.map((t) => {
              const jml = terkait.map((x) => ({ nama: x.modul.nama, n: barisTerkait(paket, x, t.ID).length }));
              return (
                <li key={t.ID} className={'alur-item' + (aktif && aktif.ID === t.ID ? ' aktif' : '')}>
                  <button type="button" className="alur-tombol" onClick={() => setPilih(t.ID)} aria-pressed={aktif && aktif.ID === t.ID}>
                    <span className="alur-no">{fUrut ? t[fUrut.header] : ''}</span>
                    <span className="alur-nama">{t[fj.header]}</span>
                    {fStatus && <BadgeOpsi paket={paket} kelompok={fStatus.sumber} nilai={t[fStatus.header]} kecil />}
                    <span className="alur-hitung">{jml.filter((j) => j.n).map((j) => j.n + ' ' + j.nama).join(' · ')}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {aktif && (
            <section className="detail" aria-live="polite">
              <div className="detail-kepala">
                <div>
                  <p className="detail-eyebrow">Tahap {fUrut ? aktif[fUrut.header] : ''}</p>
                  <h2>{aktif[fj.header]}</h2>
                </div>
                <div className="detail-aksi">
                  {fStatus && <BadgeOpsi paket={paket} kelompok={fStatus.sumber} nilai={aktif[fStatus.header]} />}
                  <button type="button" className="tombol" onClick={() => onBuka(modul, aktif)}>
                    {modeBaca ? 'Lihat rincian' : 'Sunting tahap'}
                  </button>
                </div>
              </div>
              <dl className="detail-info">
                {fDetail.map((f) =>
                  aktif[f.header] !== '' && aktif[f.header] !== undefined ? (
                    <div key={f.header}>
                      <dt>{f.label}</dt>
                      <dd>
                        <Nilai paket={paket} field={f} nilai={aktif[f.header]} />
                      </dd>
                    </div>
                  ) : null
                )}
              </dl>
              <div className="detail-grid">
                {terkait.map((t) => {
                  const rows = barisTerkait(paket, t, aktif.ID);
                  return (
                    <section key={t.modul.id} className="panel">
                      <h3 className="panel-judul">
                        {t.modul.nama} <span className="panel-jumlah">{rows.length}</span>
                      </h3>
                      {rows.length === 0 ? (
                        <p className="kosong">Tidak ada.</p>
                      ) : (
                        <ul className="daftar-terkait">
                          {rows.map((r) => (
                            <ItemTerkait key={r.ID} paket={paket} modul={t.modul} row={r} onBuka={onBuka} />
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>
          )}
          <TabelTermin paket={paket} idBiaya={idBiaya && idBiaya.id} />
        </>
      )}
    </div>
  );
}
