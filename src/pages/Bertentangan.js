import React from 'react';
import StatusPilih, { Lencana } from '../components/StatusPilih';
import Pasangan from '../components/Pasangan';
import TeksIstilah from '../components/Istilah';
import { IkonUlang } from '../components/Ikon';
import {
  modulTipe, baris, fPeran, fsPeran, vp, warnaNilai, labelNilai, beres, perluCek, hariIni, opsiKelompok, norm, pecah,
  labelRelasi, namaDokumen, benar, teksNilai,
} from '../utils/data';

function Kartu({ paket, modul, row, simpan }) {
  const fSt = fPeran(paket, modul.id, 'status');
  const fTm = fPeran(paket, modul.id, 'termin');
  const fTh = fPeran(paket, modul.id, 'tahap');
  const mT = modulTipe(paket, 'alur');
  const perlu = perluCek(paket, modul, row);
  const tahapNama = fTh ? (() => {
    const t = baris(paket, mT).find((x) => norm(x.ID) === norm(row[fTh.header]));
    return t ? vp(paket, mT, t, 'singkat') || labelRelasi(paket, fTh, row[fTh.header]) : '';
  })() : '';
  const termin = fTm ? row[fTm.header] : '';
  const wTermin = warnaNilai(paket, fTm, termin);
  return (
    <article className={'tentang' + (beres(paket, modul, row) ? ' tentang-beres' : '')}>
      <div className="tentang-kepala">
        <h3><TeksIstilah paket={paket} teks={vp(paket, modul, row, 'judul')} /></h3>
        <StatusPilih paket={paket} field={fSt} nilai={vp(paket, modul, row, 'status')} kecil onPilih={(v) => simpan(modul, row, 'status', v)} />
      </div>
      <Pasangan paket={paket} modul={modul} row={row} />
      <div className="tentang-kaki">
        {tahapNama && <Lencana kecil>Tahap: {tahapNama}</Lencana>}
        {termin && <Lencana kecil warna={wTermin === 'biru' ? 'biru' : 'abu'}>{wTermin === 'biru' ? 'Menahan: ' : ''}{labelNilai(paket, fTm, termin)}</Lencana>}
        {benar(vp(paket, modul, row, 'verifikasi')) && <Lencana kecil warna="kuning">perlu diverifikasi</Lencana>}
        {perlu && (
          <span className="cek-ulang">
            <Lencana kecil warna="biru"><IkonUlang /> sumber berubah</Lencana>
            <button type="button" className="tombol-kecil" onClick={() => simpan(modul, row, 'periksa', hariIni())}>Tandai sudah dicek</button>
          </span>
        )}
      </div>
      <details className="sumber">
        <summary>Lihat sumber</summary>
        <dl className="rinci">
          {fsPeran(paket, modul.id, 'rinci').filter((f) => row[f.header]).map((f) => (
            <div key={f.header}><dt>{f.label}</dt><dd>{teksNilai(paket, f, row[f.header])}</dd></div>
          ))}
          {vp(paket, modul, row, 'sumber') && (
            <div><dt>Dokumen sumber</dt><dd>{pecah(vp(paket, modul, row, 'sumber')).map((id) => namaDokumen(paket, id)).join(', ')}</dd></div>
          )}
        </dl>
      </details>
    </article>
  );
}

export default function Bertentangan({ paket, modul, simpan }) {
  const fTk = fPeran(paket, modul.id, 'tingkat');
  const semua = baris(paket, modul);
  const aktif = semua.filter((r) => !beres(paket, modul, r));
  const sudah = semua.filter((r) => beres(paket, modul, r));
  const kelompok = fTk ? opsiKelompok(paket, fTk.sumber) : [{ nilai: '', label: 'Semua', warna: 'abu' }];
  const lain = aktif.filter((r) => fTk && !kelompok.some((k) => norm(k.nilai) === norm(r[fTk.header])));
  return (
    <div className="halaman">
      <header className="halaman-kepala">
        <h1>{modul.judul}</h1>
        {modul.deskripsi && <p className="halaman-deskripsi">{modul.deskripsi}</p>}
      </header>
      {kelompok.map((k) => {
        const isi = fTk ? aktif.filter((r) => norm(r[fTk.header]) === norm(k.nilai)) : aktif;
        if (!isi.length) return null;
        return (
          <section key={k.nilai} className="kelompok">
            <h2 className={'kelompok-judul teks-' + (k.warna || 'abu')}>
              {k.label} <span className="kelompok-jumlah">{isi.length}</span>
            </h2>
            <div className="tentang-grid">
              {isi.map((r) => <Kartu key={r.ID} paket={paket} modul={modul} row={r} simpan={simpan} />)}
            </div>
          </section>
        );
      })}
      {lain.length > 0 && (
        <section className="kelompok">
          <h2 className="kelompok-judul">Lainnya <span className="kelompok-jumlah">{lain.length}</span></h2>
          <div className="tentang-grid">{lain.map((r) => <Kartu key={r.ID} paket={paket} modul={modul} row={r} simpan={simpan} />)}</div>
        </section>
      )}
      {aktif.length === 0 && <p className="kesimpulan teks-hijau">Semua pertentangan sudah beres.</p>}
      {sudah.length > 0 && (
        <details className="kelompok kelompok-beres">
          <summary>Sudah beres ({sudah.length})</summary>
          <div className="tentang-grid">{sudah.map((r) => <Kartu key={r.ID} paket={paket} modul={modul} row={r} simpan={simpan} />)}</div>
        </details>
      )}
    </div>
  );
}
