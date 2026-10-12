import React from 'react';
import StatusPilih from '../components/StatusPilih';
import TeksIstilah from '../components/Istilah';
import { modulTipe, baris, fPeran, vp, beres, opsiKelompok, norm, formatTanggal } from '../utils/data';

export default function MintaLPPM({ paket, modul, simpan }) {
  const fTm = fPeran(paket, modul.id, 'termin');
  const fSt = fPeran(paket, modul.id, 'status');
  const fTh = fPeran(paket, modul.id, 'tahap');
  const mT = modulTipe(paket, 'alur');
  const semua = baris(paket, modul);
  const lajur = fTm ? opsiKelompok(paket, fTm.sumber) : [];
  const tanpaLajur = semua.filter((r) => !fTm || !lajur.some((l) => norm(l.nilai) === norm(r[fTm.header])));
  const daftarLajur = [
    ...lajur.map((l) => ({ kunci: l.nilai, label: l.label, warna: l.warna, isi: semua.filter((r) => norm(r[fTm.header]) === norm(l.nilai)) })),
    { kunci: '__lain', label: 'Lainnya', warna: 'abu', isi: tanpaLajur },
  ].filter((l) => l.isi.length);
  const namaTahap = (r) => {
    if (!fTh) return '';
    const t = baris(paket, mT).find((x) => norm(x.ID) === norm(r[fTh.header]));
    return t ? vp(paket, mT, t, 'singkat') || vp(paket, mT, t, 'judul') : '';
  };
  const tanggal = (r) => (paket.field || []).filter((f) => f.modul === modul.id && f.tipe === 'date' && f.peran !== 'periksa' && r[f.header]);

  return (
    <div className="halaman">
      <header className="halaman-kepala">
        <h1>{modul.judul}</h1>
        {modul.deskripsi && <p className="halaman-deskripsi">{modul.deskripsi}</p>}
      </header>
      <div className="lajur-grid">
        {daftarLajur.map((l) => {
          const belum = l.isi.filter((r) => !beres(paket, modul, r)).length;
          return (
            <section key={l.kunci} className={'lajur lajur-' + (l.warna || 'abu')}>
              <h2 className="lajur-judul">{l.label}</h2>
              <p className="lajur-hitung">{belum ? belum + ' dari ' + l.isi.length + ' belum diterima' : 'Semua sudah diterima'}</p>
              <div className="tumpuk-rapat">
                {l.isi.map((r) => (
                  <article key={r.ID} className={'minta-kartu' + (beres(paket, modul, r) ? ' minta-beres' : '')}>
                    <span className="minta-no">{vp(paket, modul, r, 'urutan')}</span>
                    <div className="minta-isi">
                      <span className="minta-judul"><TeksIstilah paket={paket} teks={vp(paket, modul, r, 'judul')} /></span>
                      <div className="minta-baris">
                        <StatusPilih paket={paket} field={fSt} nilai={vp(paket, modul, r, 'status')} kecil onPilih={(v) => simpan(modul, r, 'status', v)} />
                        {namaTahap(r) && <span className="kecil teks-redup">Tahap: {namaTahap(r)}</span>}
                        {tanggal(r).map((f) => (
                          <span key={f.header} className="kecil teks-redup">{f.label}: {formatTanggal(paket, r[f.header])}</span>
                        ))}
                      </div>
                      {vp(paket, modul, r, 'alasan') && (
                        <details className="kenapa">
                          <summary>Kenapa?</summary>
                          <p><TeksIstilah paket={paket} teks={vp(paket, modul, r, 'alasan')} /></p>
                        </details>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
