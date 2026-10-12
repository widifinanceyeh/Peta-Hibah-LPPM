import React from 'react';
import StatusPilih from '../components/StatusPilih';
import Pasangan from '../components/Pasangan';
import TeksIstilah from '../components/Istilah';
import { modulTipe, baris, fPeran, vp, warnaNilai, beres, fmtRp, angka, opsiKelompok, norm } from '../utils/data';

function Angka({ label, nilai, sub, warna, gelap }) {
  return (
    <div className={'angka-kotak' + (gelap ? ' angka-gelap' : '')}>
      <span className="angka-label">{label}</span>
      <span className={'angka-nilai' + (warna ? ' teks-' + warna : '')}>
        {nilai}
        {sub && <span className="angka-sub">{sub}</span>}
      </span>
    </div>
  );
}

function rentangRp(a, b) {
  if (a === b) return fmtRp(a);
  if (a >= 1e6 && b >= 1e6) return 'Rp' + (a / 1e6).toLocaleString('id-ID') + '–' + (b / 1e6).toLocaleString('id-ID') + ' jt';
  return fmtRp(a) + '–' + fmtRp(b);
}

export function dataUang(paket) {
  const mB = modulTipe(paket, 'biaya');
  const app = paket.app || {};
  const rows = baris(paket, mB);
  const kel = (r) => norm(vp(paket, mB, r, 'kelompok'));
  const plafon = rows.filter((r) => kel(r) === norm(app.kelompok_plafon) && angka(vp(paket, mB, r, 'nilai')) !== null);
  const termin = rows.filter((r) => kel(r) === norm(app.kelompok_termin) && angka(vp(paket, mB, r, 'nilai')) !== null);
  return { mB, plafon, termin };
}

export default function Ringkasan({ paket, pindah, simpan }) {
  const mT = modulTipe(paket, 'alur'), mK = modulTipe(paket, 'bertentangan'), mP = modulTipe(paket, 'minta');
  const mD = modulTipe(paket, 'dokumen'), mG = modulTipe(paket, 'pagu');
  const tahap = baris(paket, mT);
  const siap = tahap.filter((t) => beres(paket, mT, t)).length;
  const fTk = mK && fPeran(paket, mK.id, 'tingkat');
  const ksAktif = baris(paket, mK).filter((k) => !beres(paket, mK, k));
  const berat = ksAktif.filter((k) => warnaNilai(paket, fTk, k[fTk && fTk.header]) === 'merah');
  const docs = baris(paket, mD);
  const belumAda = docs.filter((d) => warnaNilai(paket, fPeran(paket, mD.id, 'status'), vp(paket, mD, d, 'status')) === 'merah');
  const pagu = baris(paket, mG).map((g) => ({
    id: g.ID, tahun: vp(paket, mG, g, 'tahun'), ada: angka(vp(paket, mG, g, 'tersedia')) || 0, butuh: angka(vp(paket, mG, g, 'dibutuhkan')) || 0,
  }));
  const g0 = pagu[0];
  const maks = Math.max(1, ...pagu.map((g) => Math.max(g.ada, g.butuh)));
  const kurang = pagu.map((g) => g.butuh - g.ada).filter((x) => x > 0);
  const { mB, plafon, termin } = dataUang(paket);
  const maksPlafon = Math.max(1, ...plafon.map((p) => angka(vp(paket, mB, p, 'nilai'))));
  const warnaSeg = ['seg-1', 'seg-2', 'seg-3', 'seg-4'];

  const fTerm = mP && fPeran(paket, mP.id, 'termin');
  const lajur1 = fTerm ? opsiKelompok(paket, fTerm.sumber)[0] : null;
  const minta = baris(paket, mP);
  const mintaDulu = lajur1 ? minta.filter((r) => norm(r[fTerm.header]) === norm(lajur1.nilai)) : [];
  const mintaDuluBelum = mintaDulu.filter((r) => !beres(paket, mP, r));
  const sisaMinta = minta.filter((r) => !beres(paket, mP, r)).length - mintaDuluBelum.length;
  const fStP = mP && fPeran(paket, mP.id, 'status');

  return (
    <div className="halaman">
      <div className="angka-baris">
        <Angka label="Tahap yang sudah siap" nilai={siap} sub={' / ' + tahap.length} />
        <Angka label="Pertentangan berat" nilai={berat.length} warna={berat.length ? 'merah' : 'hijau'} />
        <Angka label="Dokumen belum ada" nilai={belumAda.length} warna={belumAda.length ? 'merah' : 'hijau'} />
        {g0 && (
          <Angka
            gelap
            label={'Uang ' + g0.tahun + ': tersedia vs dibutuhkan'}
            nilai={<><span className="utuh">{fmtRp(g0.ada)}</span> <span className={'utuh' + (g0.butuh > g0.ada ? ' teks-merah-muda' : '')}>vs {fmtRp(g0.butuh)}</span></>}
          />
        )}
      </div>

      <div className="kartu-grid">
        <section className="kartu">
          <span className="kartu-no">Pertanyaan 1</span>
          <h2>Cukupkah uangnya?</h2>
          {pagu.length === 0 ? (
            <p className="kosong">Sheet Pagu_Tahunan belum berisi data.</p>
          ) : (
            <>
              <div className="grafik-batang" role="img" aria-label="Uang tersedia dibanding dibutuhkan per tahun">
                {pagu.map((g) => {
                  const tAda = (Math.min(g.ada, g.butuh) / maks) * 100;
                  const tKurang = (Math.max(g.butuh - g.ada, 0) / maks) * 100;
                  const tLebih = (Math.max(g.ada - g.butuh, 0) / maks) * 100;
                  return (
                    <div key={g.id} className="batang-kolom">
                      <span className="batang-angka">{fmtRp(g.butuh)}</span>
                      <div className="batang-tumpuk">
                        {tLebih > 0 && <div className="batang-lebih" style={{ height: tLebih + '%' }} />}
                        {tKurang > 0 && (
                          <div className="batang-kurang" style={{ height: tKurang + '%' }}>
                            <span>kurang {fmtRp(g.butuh - g.ada)}</span>
                          </div>
                        )}
                        <div className="batang-ada" style={{ height: tAda + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="batang-tahun-baris" aria-hidden="true">
                {pagu.map((g) => <span key={g.id}>{g.tahun}</span>)}
              </div>
              <div className="keterangan-kecil">
                <span><i className="kotak-warna kotak-tinta" /> tersedia</span>
                <span><i className="kotak-warna kotak-merah" /> kekurangan</span>
              </div>
              <p className={'kesimpulan ' + (kurang.length ? 'teks-merah' : 'teks-hijau')}>
                {kurang.length
                  ? 'Belum cukup: kurang ' + rentangRp(Math.min(...kurang), Math.max(...kurang)) + ' per tahun.'
                  : 'Cukup untuk semua tahun yang direncanakan.'}
              </p>
              {(paket.app || {}).catatan_pagu && <p className="catatan-kecil"><TeksIstilah paket={paket} teks={paket.app.catatan_pagu} /></p>}
            </>
          )}
        </section>

        <section className="kartu">
          <span className="kartu-no">Pertanyaan 2</span>
          <h2>Kapan uang dosen cair?</h2>
          {plafon.length === 0 || termin.length === 0 ? (
            <p className="kosong">Plafon atau termin belum ada di Titik_Biaya.</p>
          ) : (
            <>
              <div className="cair-daftar">
                {plafon.map((p) => {
                  const nilai = angka(vp(paket, mB, p, 'nilai'));
                  return (
                    <div key={p.ID} className="cair-baris">
                      <span className="cair-label">{vp(paket, mB, p, 'judul')} · <b>{fmtRp(nilai)}</b></span>
                      <div className="cair-batang" style={{ width: (nilai / maksPlafon) * 100 + '%' }}>
                        {termin.map((t, i) => {
                          const pct = angka(vp(paket, mB, t, 'nilai'));
                          return (
                            <span key={t.ID} className={'cair-seg ' + warnaSeg[i % 4]} style={{ width: pct + '%' }}>
                              {fmtRp(Math.round((nilai * pct) / 100))}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cair-syarat" style={{ gridTemplateColumns: 'repeat(' + termin.length + ', minmax(0, 1fr))' }}>
                {termin.map((t, i) => (
                  <div key={t.ID} className={'cair-syarat-butir garis-' + warnaSeg[i % 4]}>
                    <b>{vp(paket, mB, t, 'nilai')}%</b>
                    <span><TeksIstilah paket={paket} teks={(fPeran(paket, mB.id, 'ringkas') && vp(paket, mB, t, 'ringkas')) || vp(paket, mB, t, 'judul')} /></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="kartu">
          <span className="kartu-no">Pertanyaan 3</span>
          <h2>Apa yang menghambat?</h2>
          {berat.length === 0 ? (
            <p className="kesimpulan teks-hijau">Tidak ada pertentangan berat yang tersisa.</p>
          ) : (
            <div className="tumpuk">
              {berat.slice(0, 3).map((k) => (
                <Pasangan key={k.ID} paket={paket} modul={mK} row={k} ringkas />
              ))}
            </div>
          )}
          {berat.length > 3 && (
            <button type="button" className="tautan-tombol" onClick={() => pindah(mK.id)}>
              + {berat.length - 3} pertentangan berat lainnya
            </button>
          )}
        </section>

        <section className="kartu">
          <span className="kartu-no">Pertanyaan 4</span>
          <h2>Apa yang harus diminta ke LPPM dulu?</h2>
          {lajur1 && mintaDulu.length > 0 ? (
            <>
              <p className="kartu-pengantar">
                {mintaDuluBelum.length
                  ? 'Tanpa ' + mintaDuluBelum.length + ' dokumen ini, ' + lajur1.label.toLowerCase() + ' tertahan.'
                  : 'Semua dokumen untuk ' + lajur1.label.toLowerCase() + ' sudah diterima.'}
              </p>
              <div className="tumpuk-rapat">
                {mintaDulu.map((r) => (
                  <div key={r.ID} className={'minta-butir' + (beres(paket, mP, r) ? ' minta-beres' : '')}>
                    <span className="minta-judul"><TeksIstilah paket={paket} teks={vp(paket, mP, r, 'judul')} /></span>
                    <StatusPilih paket={paket} field={fStP} nilai={vp(paket, mP, r, 'status')} kecil onPilih={(v) => simpan(mP, r, 'status', v)} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="kosong">Belum ada permintaan.</p>
          )}
          {sisaMinta > 0 && (
            <button type="button" className="tautan-tombol" onClick={() => pindah(mP.id)}>
              + {sisaMinta} permintaan lain untuk uang cair berikutnya
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
