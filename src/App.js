import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { apiPost } from './api';
import { bacaSalinan, simpanSalinan, tarikInit, cekVersi } from './awal';
import { bacaHash, halamanTerakhir, pindah, gantiTanpaRiwayat, dengarkan } from './navigasi';
import { prefBaca, prefTulis, prefHapus } from './utils/pref';
import { modulById } from './utils/data';
import { STORAGE_KEY } from './config';
import MenuTitik from './components/MenuTitik';
import Toast from './components/Toast';
import Diagnosa from './components/Diagnosa';
import Form from './components/Form';
import PetaAlur from './pages/PetaAlur';
import HalamanTabel, { kunciLebar } from './pages/HalamanTabel';

const KUNCI_CIUT = STORAGE_KEY + '.sidebarCiut';

function jam() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [paket, setPaket] = useState(null);
  const [muat, setMuat] = useState({ status: 'awal', pesan: '' });
  const [sinkron, setSinkron] = useState('');
  const [halaman, setHalaman] = useState(() => bacaHash() || halamanTerakhir());
  const [modeBaca, setModeBaca] = useState(false);
  const [ciut, setCiut] = useState(() => prefBaca(KUNCI_CIUT, false));
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [diagnosa, setDiagnosa] = useState(false);
  const [form, setForm] = useState(null);
  const [versiLebar, setVersiLebar] = useState(0);
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

  // Muat awal: tampilkan salinan perangkat seketika, lalu cek versi.
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

  // Halaman tidak dikenal atau kosong → halaman terakhir / modul pertama.
  useEffect(() => {
    if (!paket || !paket.modul || !paket.modul.length) return;
    if (!modulById(paket, halaman)) {
      const cadangan = modulById(paket, halamanTerakhir()) ? halamanTerakhir() : paket.modul[0].id;
      gantiTanpaRiwayat(cadangan);
      setHalaman(cadangan);
    }
  }, [paket, halaman]);

  useEffect(() => {
    if (paket && paket.app && paket.app.nama_aplikasi) document.title = paket.app.nama_aplikasi;
  }, [paket]);

  const buka = (id) => {
    pindah(id);
    setHalaman(id);
    setDrawer(false);
    window.scrollTo(0, 0);
  };

  const ubahPaket = (fn) => {
    const p = fn(paketRef.current);
    terapkan(p, true);
  };

  const patchBaris = (idModul, id, nilai, versi) =>
    ubahPaket((p) => ({
      ...p,
      versi: versi || p.versi,
      data: { ...p.data, [idModul]: (p.data[idModul] || []).map((r) => (r.ID === id ? { ...r, ...nilai } : r)) },
    }));

  const simpanField = (idModul, id, header, v) => {
    const lama = ((paketRef.current.data[idModul] || []).find((r) => r.ID === id) || {})[header];
    patchBaris(idModul, id, { [header]: v });
    return apiPost('update', { modul: idModul, id, perubahan: { [header]: v } })
      .then((d) => patchBaris(idModul, id, d.nilai, d.versi))
      .catch((e) => {
        patchBaris(idModul, id, { [header]: lama });
        tambahToast(e.message, 'galat');
        throw e;
      });
  };

  const tambahData = (idModul, nilai) =>
    apiPost('create', { modul: idModul, nilai }).then((d) =>
      ubahPaket((p) => ({ ...p, versi: d.versi || p.versi, data: { ...p.data, [idModul]: [...(p.data[idModul] || []), d.baris] } }))
    );

  const arsipData = (idModul, id) =>
    apiPost('archive', { modul: idModul, id }).then((d) =>
      ubahPaket((p) => ({ ...p, versi: d.versi || p.versi, data: { ...p.data, [idModul]: (p.data[idModul] || []).filter((r) => r.ID !== id) } }))
    );

  if (!paket) {
    return (
      <div className="layar-tengah">
        {muat.status === 'galat' ? (
          <div className="kotak-galat">
            <h1>Data belum dapat dimuat</h1>
            <p>{muat.pesan}</p>
            <div className="baris-tombol">
              <button type="button" className="tombol tombol-utama" onClick={() => tarik(true)}>
                Coba lagi
              </button>
              <button type="button" className="tombol" onClick={() => setDiagnosa(true)}>
                Diagnosa
              </button>
            </div>
          </div>
        ) : (
          <p className="memuat">Memuat data…</p>
        )}
        {diagnosa && <Diagnosa paket={null} onTutup={() => setDiagnosa(false)} />}
      </div>
    );
  }

  const modul = modulById(paket, halaman) || paket.modul[0];
  const app = paket.app || {};
  const modulForm = form && modulById(paket, form.modul);
  const rowForm = form && form.id ? (paket.data[form.modul] || []).find((r) => r.ID === form.id) : null;

  return (
    <div className={'kerangka' + (ciut ? ' sidebar-ciut' : '') + (drawer ? ' drawer-buka' : '')}>
      <aside className="sidebar" aria-label="Navigasi">
        <div className="sidebar-kepala">
          <div className="merek">
            <span className="merek-nama">{app.nama_aplikasi}</span>
            {app.organisasi && <span className="merek-org">{app.organisasi}</span>}
          </div>
          <button
            type="button"
            className="tombol-ikon tombol-ciut"
            onClick={() => {
              setCiut(!ciut);
              prefTulis(KUNCI_CIUT, !ciut);
            }}
            aria-label={ciut ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
          >
            {ciut ? '»' : '«'}
          </button>
        </div>
        <nav>
          {paket.modul.map((m) => (
            <button
              type="button"
              key={m.id}
              className={'nav-item' + (m.id === modul.id ? ' aktif' : '')}
              onClick={() => buka(m.id)}
              title={m.nama}
              aria-current={m.id === modul.id ? 'page' : undefined}
            >
              <span className="nav-huruf" aria-hidden="true">
                {String(m.nama).charAt(0)}
              </span>
              <span className="nav-nama">{m.nama}</span>
              <span className="nav-jumlah">{(paket.data[m.id] || []).length}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="drawer-latar" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="utama">
        <div className="bilah-atas">
          <button type="button" className="tombol-ikon tombol-drawer" onClick={() => setDrawer(true)} aria-label="Buka navigasi">
            ☰
          </button>
          <span className="bilah-judul">{modul.nama}</span>
          {modeBaca && <span className="chip-mode">Mode baca</span>}
          <span className="bilah-status">{sinkron === 'memuat' ? 'Memuat…' : sinkron}</span>
          <MenuTitik
            item={[
              { label: 'Refresh data', aksi: () => tarik(true) },
              { label: modeBaca ? 'Kembali ke Mode kerja' : 'Masuk Mode baca', aksi: () => setModeBaca(!modeBaca) },
              modul.tipe !== 'peta' && {
                label: 'Reset lebar kolom',
                aksi: () => {
                  prefHapus(kunciLebar(modul.id));
                  setVersiLebar((v) => v + 1);
                },
              },
              { label: 'Diagnosa', aksi: () => setDiagnosa(true) },
            ]}
          />
        </div>

        <main className="isi">
          {modul.tipe === 'peta' ? (
            <PetaAlur paket={paket} modul={modul} modeBaca={modeBaca} onBuka={(m, r) => setForm({ modul: m.id, id: r.ID })} />
          ) : (
            <HalamanTabel
              key={modul.id + '-' + versiLebar}
              paket={paket}
              modul={modul}
              modeBaca={modeBaca}
              onBuka={(m, r) => setForm({ modul: m.id, id: r.ID })}
              onTambah={() => setForm({ modul: modul.id, id: null })}
            />
          )}
          {app.sumber_data && <footer className="kaki">Sumber data awal: {app.sumber_data}</footer>}
        </main>
      </div>

      {modulForm && (form.id === null || rowForm) && (
        <Form
          key={form.modul + '-' + (form.id || 'baru')}
          paket={paket}
          modul={modulForm}
          row={rowForm}
          modeBaca={modeBaca}
          jeda={Number(app.jeda_simpan_ms) || 800}
          onSimpanField={(h, v) => simpanField(form.modul, form.id, h, v)}
          onTambah={(n) => tambahData(form.modul, n)}
          onArsip={() => arsipData(form.modul, form.id)}
          onTutup={() => setForm(null)}
        />
      )}
      {diagnosa && <Diagnosa paket={paket} onTutup={() => setDiagnosa(false)} />}
      <Toast daftar={toasts} onTutup={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
