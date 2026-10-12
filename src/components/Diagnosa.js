import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { apiGet } from '../api';
import { API_URL, APP_VERSION } from '../config';

export default function Diagnosa({ paket, onTutup }) {
  const [hasil, setHasil] = useState({ status: 'memeriksa' });
  useEffect(() => {
    const mulai = Date.now();
    apiGet('ping', { t: String(mulai) })
      .then((d) => setHasil({ status: 'ok', versiKode: d.versiKode, ms: Date.now() - mulai }))
      .catch((e) => setHasil({ status: 'gagal', pesan: e.message }));
  }, []);
  const baris = [
    ['Versi web', APP_VERSION],
    ['Versi kode backend', hasil.versiKode || (hasil.status === 'memeriksa' ? 'memeriksa…' : '—')],
    ['Koneksi server', hasil.status === 'ok' ? 'Tersambung (' + hasil.ms + ' ms)' : hasil.status === 'gagal' ? 'Gagal: ' + hasil.pesan : 'memeriksa…'],
    ['Penanda versi data', (paket && paket.versi) || '—'],
    ['URL server', /^https:\/\//.test(API_URL) ? API_URL : 'Belum diisi di src/config.js'],
  ];
  return (
    <Modal judul="Diagnosa" onTutup={onTutup} lebar="560px">
      <dl className="diagnosa">
        {baris.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
