import React, { useRef, useState } from 'react';
import StatusPilih, { Lencana } from '../components/StatusPilih';
import Pasangan from '../components/Pasangan';
import TeksIstilah from '../components/Istilah';
import { IkonOrang, IkonDokumen, IkonUang, IkonAwas, IkonUlang } from '../components/Ikon';
import { dataUang } from './Ringkasan';
import {
  modulTipe, baris, fPeran, fsPeran, vp, warnaNilai, labelNilai, beres, terkaitTahap, perluCek, hariIni,
  fmtRp, angka, norm, pecah, teksNilai,
} from '../utils/data';
import { prefBaca, prefTulis } from '../utils/pref';
import { STORAGE_KEY } from '../config';

const KUNCI = STORAGE_KEY + '.tahap';

function infoTahap(paket, M, t) {
  const app = paket.app || {};
  const fStD = M.D && fPeran(paket, M.D.id, 'status');
  const docs = terkaitTahap(paket, M.D, M.T, t.ID);
  const wd = (d) => warnaNilai(paket, fStD, fStD ? d[fStD.header] : '');
  const fTk = M.K && fPeran(paket, M.K.id, 'tingkat');
  const ks = terkaitTahap(paket, M.K, M.T, t.ID).filter((k) => !beres(paket, M.K, k));
  const wk = (k) => warnaNilai(paket, fTk, fTk ? k[fTk.header] : '');
  const biaya = terkaitTahap(paket, M.B, M.T, t.ID);
  const kel = (r) => norm(vp(paket, M.B, r, 'kelompok'));
  const kelUang = pecah(app.kelompok_uang).map(norm);
  const termin = biaya.filter((r) => kel(r) === norm(app.kelompok_termin) && angka(vp(paket, M.B, r, 'nilai')) !== null);
  return {
    docs, siap: docs.filter((d) => wd(d) === 'hijau'), revisi: docs.filter((d) => wd(d) === 'kuning'), belum: docs.filter((d) => wd(d) === 'merah'),
    ks, berat: ks.filter((k) => wk(k) === 'merah'), sedang: ks.filter((k) => wk(k) === 'kuning'), ringan: ks.filter((k) => !['merah', 'kuning'].includes(wk(k))),
    termin, pct: termin.reduce((s, r) => s + angka(vp(paket, M.B, r, 'nilai')), 0),
    uang: biaya.filter((r) => kelUang.includes(kel(r)) && !termin.includes(r)),
    syarat: biaya.filter((r) => !kelUang.includes(kel(r))),
    perlu: perluCek(paket, M.T, t, docs.map((d) => d.ID)),
  };
}

const nama = (paket, m, r) => vp(paket, m, r, 'singkat') || vp(paket, m, r, 'judul') || r.ID;
const ringkas = (paket, m, r) => vp(paket, m, r, 'ringkas') || vp(paket, m, r, 'judul');

function Rinci({ paket, modul, row }) {
  const fs = fsPeran(paket, modul.id, 'rinci').filter((f) => row[f.header] !== '' && row[f.header] !== undefined);
  if (!fs.length) return null;
  return (
    <dl className="rinci">
      {fs.map((f) => (
        <div key={f.header}>
          <dt>{f.label}</dt>
          <dd>{teksNilai(paket, f, row[f.header])}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AlurTahap({ paket, modul, pindah, simpan }) {
  const M = { T: modul, D: modulTipe(paket, 'dokumen'), K: modulTipe(paket, 'bertentangan'), B: modulTipe(paket, 'biaya') };
  const tahap = baris(paket, M.T);
  const info = {};
  tahap.forEach((t) => (info[t.ID] = infoTahap(paket, M, t)));
  const [pilih, setPilihState] = useState(() => prefBaca(KUNCI, ''));
  const detailRef = useRef(null);
  const aktif = tahap.find((t) => t.ID === pilih) || tahap[0];
  const setPilih = (id, gulir) => {
    setPilihState(id);
    prefTulis(KUNCI, id);
    if (gulir && detailRef.current) detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const fStT = fPeran(paket, M.T.id, 'status');
  const fStD = M.D && fPeran(paket, M.D.id, 'status');
  const fStB = M.B && fPeran(paket, M.B.id, 'status');
  const fTk = M.K && fPeran(paket, M.K.id, 'tingkat');
  const { plafon } = dataUang(paket);

  // Uang kumulatif sepanjang jalur
  let kum = 0;
  const jalurUang = tahap.map((t) => {
    kum += info[t.ID].pct;
    return { id: t.ID, pct: info[t.ID].pct, kum };
  });
  const totalUang = kum || 100;
  const kelasUang = (k) => (k <= 0 ? 'uang-0' : k / totalUang < 0.6 ? 'uang-1' : k / totalUang < 0.95 ? 'uang-2' : 'uang-3');

  if (!tahap.length) return <div className="halaman"><p className="kosong">Belum ada tahap.</p></div>;
  const I = info[aktif.ID];
  const tingkatLabel = (warna) => {
    const o = (paket.opsi || []).find((x) => fTk && x.kelompok === fTk.sumber && x.warna === warna);
    return o ? o.label.toLowerCase() : warna;
  };

  return (
    <div className="halaman">
      <section className="kartu jalur-kartu">
        <h2 className="kartu-judul-kecil">Perjalanan hibah, dari pagu sampai luaran</h2>
        <div className="jalur-gulir">
          <div className="jalur" style={{ gridTemplateColumns: 'repeat(' + tahap.length + ', minmax(84px, 1fr))' }}>
            <div className="jalur-garis" aria-hidden="true" />
            {tahap.map((t, i) => {
              const w = warnaNilai(paket, fStT, vp(paket, M.T, t, 'status'));
              const terpilih = t.ID === aktif.ID;
              return (
                <button
                  type="button"
                  key={t.ID}
                  className={'halte' + (terpilih ? ' halte-aktif' : '')}
                  onClick={() => setPilih(t.ID)}
                  aria-pressed={terpilih}
                  title={labelNilai(paket, fStT, vp(paket, M.T, t, 'status'))}
                >
                  <span className={'halte-bulat bulat-' + w}>{i + 1}</span>
                  <span className="halte-nama">{nama(paket, M.T, t)}</span>
                  {info[t.ID].perlu && <span className="halte-cek" title="Sumber berubah, perlu dicek ulang">⟳</span>}
                </button>
              );
            })}
            {jalurUang.map((u) => (
              <div key={'u' + u.id} className={'uang-sel ' + kelasUang(u.kum)}>
                {u.pct > 0 ? (
                  <>
                    <b>cair {u.pct}%</b>
                    <span>total {u.kum}%</span>
                  </>
                ) : u.kum === 0 ? (
                  <span className="uang-kosong">belum cair</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="kartu detail" ref={detailRef}>
        <div className="detail-kepala">
          <h2>
            <span className="detail-no">Tahap {tahap.indexOf(aktif) + 1}</span> {vp(paket, M.T, aktif, 'judul')}
          </h2>
          <div className="detail-aksi">
            {I.perlu && (
              <span className="cek-ulang">
                <Lencana warna="biru"><IkonUlang /> sumber berubah</Lencana>
                <button type="button" className="tombol-kecil" onClick={() => simpan(M.T, aktif, 'periksa', hariIni())}>
                  Tandai sudah dicek
                </button>
              </span>
            )}
            <StatusPilih paket={paket} field={fStT} nilai={vp(paket, M.T, aktif, 'status')} onPilih={(v) => simpan(M.T, aktif, 'status', v)} />
          </div>
        </div>

        <div className="empat-kotak">
          <div className="kotak">
            <span className="kotak-judul"><IkonOrang /> Siapa</span>
            <div className="siapa">
              {pecah(String(vp(paket, M.T, aktif, 'siapa') || '').replace(/·/g, '|')).map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
          <div className="kotak">
            <span className="kotak-judul"><IkonDokumen /> Dokumen</span>
            <div className="chip-tumpuk">
              {I.docs.length === 0 && <span className="kosong">Tidak ada</span>}
              {I.docs.map((d) => (
                <StatusPilih
                  key={d.ID}
                  paket={paket}
                  field={fStD}
                  nilai={vp(paket, M.D, d, 'status')}
                  kecil
                  isi={nama(paket, M.D, d) + ' · ' + labelNilai(paket, fStD, vp(paket, M.D, d, 'status')).toLowerCase()}
                  onPilih={(v) => simpan(M.D, d, 'status', v)}
                />
              ))}
            </div>
          </div>
          <div className="kotak">
            <span className="kotak-judul"><IkonUang /> Uang</span>
            {I.pct > 0 && (
              <>
                <span className="uang-besar">cair {I.pct}%</span>
                <div className="uang-rincian">
                  {plafon.map((p) => (
                    <React.Fragment key={p.ID}>
                      <span>{String(ringkas(paket, M.B, p)).replace(/^Plafon\s+/i, '')}</span>
                      <b>{fmtRp(Math.round((angka(vp(paket, M.B, p, 'nilai')) * I.pct) / 100))}</b>
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
            {I.uang.length > 0 && (
              <div className="chip-tumpuk">
                {I.uang.map((r) => {
                  const w = warnaNilai(paket, fStB, vp(paket, M.B, r, 'status'));
                  return (
                    <span key={r.ID} className={'uang-chip' + (w === 'kuning' ? ' uang-tunggu' : '')}>
                      <TeksIstilah paket={paket} teks={ringkas(paket, M.B, r)} />
                      {w !== 'hijau' && <em> · {labelNilai(paket, fStB, vp(paket, M.B, r, 'status')).toLowerCase()}</em>}
                    </span>
                  );
                })}
              </div>
            )}
            {I.syarat.length > 0 && (
              <ul className="syarat">
                {I.syarat.map((r) => <li key={r.ID}><TeksIstilah paket={paket} teks={ringkas(paket, M.B, r)} /></li>)}
              </ul>
            )}
            {I.pct === 0 && I.uang.length === 0 && I.syarat.length === 0 && <span className="kosong">Tidak ada uang di tahap ini</span>}
          </div>
          <div className={'kotak' + (I.ks.length ? ' kotak-masalah' : ' kotak-aman')}>
            <span className="kotak-judul"><IkonAwas /> Masalah</span>
            {I.ks.length === 0 ? (
              <span className="teks-hijau tebal">Tidak ada pertentangan</span>
            ) : (
              <div className="tumpuk-rapat">
                {[...I.berat, ...I.sedang, ...I.ringan].slice(0, 2).map((k) => (
                  <Pasangan key={k.ID} paket={paket} modul={M.K} row={k} ringkas />
                ))}
                {I.ks.length > 2 && (
                  <button type="button" className="tautan-tombol" onClick={() => pindah(M.K.id)}>+ {I.ks.length - 2} lainnya</button>
                )}
              </div>
            )}
          </div>
        </div>

        <details className="sumber">
          <summary>Lihat sumber (pasal &amp; halaman)</summary>
          <div className="sumber-isi">
            <Rinci paket={paket} modul={M.T} row={aktif} />
            {I.docs.length > 0 && (
              <div className="sumber-blok">
                <h3>Dokumen</h3>
                <ul>
                  {I.docs.map((d) => {
                    const url = vp(paket, M.D, d, 'tautan');
                    return (
                      <li key={d.ID}>
                        <b>{vp(paket, M.D, d, 'judul')}</b>
                        {vp(paket, M.D, d, 'rinci') ? ' — ' + vp(paket, M.D, d, 'rinci') : ''}{' '}
                        {url && <a href={url} target="_blank" rel="noreferrer">buka</a>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {I.ks.map((k) => (
              <div key={k.ID} className="sumber-blok">
                <h3>{vp(paket, M.K, k, 'judul')}</h3>
                <Rinci paket={paket} modul={M.K} row={k} />
              </div>
            ))}
            {[...I.termin, ...I.uang, ...I.syarat].map((r) => (
              <div key={r.ID} className="sumber-blok">
                <h3>{vp(paket, M.B, r, 'judul')}</h3>
                <Rinci paket={paket} modul={M.B} row={r} />
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="kartu">
        <h2 className="kartu-judul-kecil">Semua tahap sekaligus</h2>
        <div className="papan-gulir">
          <div className="papan" role="table" aria-label="Kesiapan semua tahap">
            <div className="papan-baris papan-kepala" role="row">
              <span role="columnheader">Tahap</span>
              <span role="columnheader">Dokumen siap</span>
              <span role="columnheader">Yang belum ada</span>
              <span role="columnheader">Uang</span>
              <span role="columnheader">Masalah</span>
            </div>
            {tahap.map((t, i) => {
              const x = info[t.ID];
              const n = x.docs.length || 1;
              return (
                <button
                  type="button"
                  role="row"
                  key={t.ID}
                  className={'papan-baris' + (t.ID === aktif.ID ? ' papan-aktif' : '')}
                  onClick={() => setPilih(t.ID, true)}
                >
                  <span className="papan-tahap" role="cell">
                    <span className={'bulat-kecil bulat-' + warnaNilai(paket, fStT, vp(paket, M.T, t, 'status'))}>{i + 1}</span>
                    {nama(paket, M.T, t)}
                    {x.perlu && <span className="halte-cek" title="Sumber berubah, perlu dicek ulang">⟳</span>}
                  </span>
                  <span className="papan-dok" role="cell">
                    <span className="papan-dok-teks"><b>{x.siap.length}</b> dari {x.docs.length} siap</span>
                    <span className="bar-mini" aria-hidden="true">
                      <i className="bar-hijau" style={{ width: (x.siap.length / n) * 100 + '%' }} />
                      <i className="bar-kuning" style={{ width: (x.revisi.length / n) * 100 + '%' }} />
                      <i className="bar-merah" style={{ width: (x.belum.length / n) * 100 + '%' }} />
                    </span>
                    {x.revisi.length > 0 && <span className="teks-kuning kecil">{x.revisi.length} perlu revisi</span>}
                  </span>
                  <span className="papan-belum" role="cell">
                    {x.belum.length ? (
                      <span className="teks-merah">{x.belum.map((d) => nama(paket, M.D, d)).join(', ')}</span>
                    ) : (
                      <span className="teks-hijau">Lengkap</span>
                    )}
                  </span>
                  <span className="papan-uang" role="cell">
                    {x.pct > 0 && <span className="uang-chip uang-cair">cair {x.pct}%</span>}
                    {x.uang.slice(0, 2).map((r) => (
                      <span key={r.ID} className={'uang-chip' + (warnaNilai(paket, fStB, vp(paket, M.B, r, 'status')) === 'kuning' ? ' uang-tunggu' : '')}>
                        {ringkas(paket, M.B, r)}
                        {warnaNilai(paket, fStB, vp(paket, M.B, r, 'status')) === 'kuning' && <em> · {labelNilai(paket, fStB, vp(paket, M.B, r, 'status')).toLowerCase()}</em>}
                      </span>
                    ))}
                    {x.uang.length > 2 && <span className="kecil teks-redup">+{x.uang.length - 2}</span>}
                    {x.pct === 0 && x.uang.length === 0 && <span className="teks-redup">—</span>}
                  </span>
                  <span className="papan-masalah" role="cell">
                    {x.ks.length === 0 && <span className="teks-hijau">Tidak ada</span>}
                    {x.berat.length > 0 && <span className="teks-merah tebal">{x.berat.length} {tingkatLabel('merah')}</span>}
                    {x.sedang.length > 0 && <span className="teks-kuning tebal">{x.sedang.length} {tingkatLabel('kuning')}</span>}
                    {x.ringan.length > 0 && <span className="teks-redup">{x.ringan.length} {tingkatLabel('abu')}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="catatan-kecil">Klik satu baris untuk membuka rinciannya di atas.</p>
      </section>
    </div>
  );
}
