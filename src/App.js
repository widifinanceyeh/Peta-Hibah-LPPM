import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { apiPost } from './api';
import { bacaSalinan, simpanSalinan, tarikInit, cekVersi } from './awal';
import { bacaHash, halamanTerakhir, pindah as pindahHash, gantiTanpaRiwayat, dengarkan } from './navigasi';
import { modulById, fPeran, formatTanggal } from './utils/data';
import MenuTitik from './components/MenuTitik';
import Toast from './components/Toast';
import Diagnosa from './components/Diagnosa';
import Panduan from './components/Panduan';
import Ringkasan from './pages/Ringkasan';
import AlurTahap from './pages/AlurTahap';
import Bertentangan from './pages/Bertentangan';
import MintaLPPM from './pages/MintaLPPM';

const HALAMAN = { ringkasan: Ringkasan, alur: AlurTahap, bertentangan: Bertentangan, minta: MintaLPPM };

function jam() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [paket, setPaket] = useState(null);
  const [muat, setMuat] = useState({ status: 'awal', pesan: '' });
  const [sinkron, setSinkron] = useState('');
  const [halaman, setHalaman] = useState(() => bacaHash() || halamanTerakhir());
  const [toasts, setToasts] = useState([]);
  const [diagnosa, setDiagnosa] = useState(false);
  const [panduan, setPanduan] = useState(false);
  const paketRef = useRef(null);

  const tambahToast = useCallback((pesan, jenis) => {
    setToasts((t) => [...t, { id: Date.now() + Math.random(), pesan, jenis }]);
  }, []);

  const terapkan = useCallback((p, simpan) => {
    paketRef.current = p;
    setPaket(p);
    setMuat({ status: 'siap', pesan: '' });
    if (simpan) simpanSalinan(p);
  }, []);

  const tarik = useCallback(
    async (paksa) => {
      setSinkron('memuat');
      try {
        const p = await tarikInit(paksa);
        terapkan(p, false);
        setSinkron('Diperbarui ' + jam());
        return p;
      } catch (e) {
        setSinkron('');
        if (!paketRef.current) setMuat({ status: 'galat', pesan: e.message });
        else tambahToast('Data terbaru tidak dapat diambil. ' + e.message, 'galat');
        return null;
      }
    },
    [terapkan, tambahToast]
  );

  const periksa = useCallback(async () => {
    const p = paketRef.current;
    if (!p) return;
    try {
      const v = await cekVersi();
      if (v && v !== p.versi) await tarik(false);
      else setSinkron('Diperiksa ' + jam());
    } catch (e) {
      setSinkron('Luring');
    }
  }, [tarik]);

  useEffect(() => {
    let batal = false;
    (async () => {
      const s = await bacaSalinan();
      if (batal) return;
      if (s) {
        terapkan(s, false);
        periksa();
      } else {
        tarik(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, [terapkan, periksa, tarik]);

  useEffect(() => {
    const h = () => document.visibilityState === 'visible' && periksa();
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [periksa]);

  useEffect(() => dengarkan((id) => setHalaman(id)), []);

  const menu = paket ? (paket.modul || []).filter((m) => m.menu && HALAMAN[m.tipe]) : [];

  // Halaman tidak dikenal → halaman terakhir, lalu modul_awal, lalu menu pertama.
  useEffect(() => {
    if (!paket || !menu.length) return;
    if (!menu.some((m) => m.id === halaman)) {
      const awal = (paket.app || {}).modul_awal;
      const terakhir = halamanTerakhir();
      const tuju = menu.some((m) => m.id === terakhir) ? terakhir : menu.some((m) => m.id === awal) ? awal : menu[0].id;
      gantiTanpaRiwayat(tuju);
      setHalaman(tuju);
    }
  }, [paket, halaman, menu]);

  useEffect(() => {
    if (paket && paket.app && paket.app.nama_aplikasi) document.title = paket.app.nama_aplikasi;
  }, [paket]);

  const pindah = (id) => {
    pindahHash(id);
    setHalaman(id);
    window.scrollTo(0, 0);
  };

  const ubahPaket = (fn) => terapkan(fn(paketRef.current), true);
  const patchBaris = (idModul, id, nilai, versi) =>
    ubahPaket((p) => ({
      ...p,
      versi: versi || p.versi,
      data: { ...p.data, [idModul]: (p.data[idModul] || []).map((r) => (r.ID === id ? { ...r, ...nilai } : r)) },
    }));

  // Simpan satu field menurut perannya (status, periksa, …): tampil dulu, dikembalikan bila ditolak.
  const simpan = (modul, row, peran, nilai) => {
    const f = fPeran(paketRef.current, modul.id, peran);
    if (!f) return Promise.reject(new Error('Kolom untuk "' + peran + '" tidak ada di Cfg_Field.'));
    const lama = row[f.header];
    patchBaris(modul.id, row.ID, { [f.header]: nilai });
    return apiPost('update', { modul: modul.id, id: row.ID, perubahan: { [f.header]: nilai } })
      .then((d) => patchBaris(modul.id, row.ID, d.nilai, d.versi))
      .catch((e) => {
        patchBaris(modul.id, row.ID, { [f.header]: lama });
        tambahToast(e.message, 'galat');
        throw e;
      });
  };

  if (!paket) {
    return (
      <div className="layar-tengah">
        {muat.status === 'galat' ? (
          <div className="kotak-galat">
            <h1>Data belum dapat dimuat</h1>
            <p>{muat.pesan}</p>
            <div className="baris-tombol">
              <button type="button" className="tombol tombol-utama" onClick={() => tarik(true)}>Coba lagi</button>
              <button type="button" className="tombol" onClick={() => setDiagnosa(true)}>Diagnosa</button>
            </div>
          </div>
        ) : (
          <p className="memuat">Memuat data…</p>
        )}
        {diagnosa && <Diagnosa paket={null} onTutup={() => setDiagnosa(false)} />}
      </div>
    );
  }

  const app = paket.app || {};
  const modul = modulById(paket, halaman);
  const Halaman = modul && HALAMAN[modul.tipe];

  return (
    <div className="kerangka">
      <header className="bilah">
        <div className="bilah-isi">
          <span className="merek">{app.nama_aplikasi}</span>
          <nav className="tab" aria-label="Menu utama">
            {menu.map((m) => (
              <button
                type="button"
                key={m.id}
                className={'tab-item' + (modul && m.id === modul.id ? ' tab-aktif' : '')}
                aria-current={modul && m.id === modul.id ? 'page' : undefined}
                onClick={() => pindah(m.id)}
              >
                {m.nama}
              </button>
            ))}
          </nav>
          <span className="bilah-kanan">
            {(app.status_naskah || app.tanggal_kajian) && (
              <span className="draf">
                {app.tanggal_kajian ? 'Kajian ' + formatTanggal(paket, app.tanggal_kajian) : ''}
                {app.tanggal_kajian && app.status_naskah ? ' · ' : ''}
                {app.status_naskah && <b>{app.status_naskah}</b>}
              </span>
            )}
            {sinkron === 'memuat' && <span className="sinkron">Memuat…</span>}
            <MenuTitik
              item={[
                { label: 'Refresh data', aksi: () => tarik(true) },
                { label: 'Cara memperbarui', aksi: () => setPanduan(true) },
                { label: 'Diagnosa', aksi: () => setDiagnosa(true) },
              ]}
            />
          </span>
        </div>
      </header>

      <main className="isi">
        {menu.length === 0 ? (
          <div className="kotak-galat">
            <h1>Menu belum tersedia</h1>
            <p>Data di Sheet belum disesuaikan untuk versi web ini. Jalankan skrip revisi data v1.1.0 (lihat PANDUAN), lalu menu ⋯ › Refresh data.</p>
          </div>
        ) : Halaman ? (
          <Halaman paket={paket} modul={modul} pindah={pindah} simpan={simpan} />
        ) : null}
        {sinkron && sinkron !== 'memuat' && <footer className="kaki">{sinkron}</footer>}
      </main>

      {panduan && <Panduan paket={paket} onTutup={() => setPanduan(false)} />}
      {diagnosa && <Diagnosa paket={paket} onTutup={() => setDiagnosa(false)} />}
      <Toast daftar={toasts} onTutup={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
