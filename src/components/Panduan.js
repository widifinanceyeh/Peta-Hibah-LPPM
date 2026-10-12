import React from 'react';
import Modal from './Modal';

export default function Panduan({ paket, onTutup }) {
  const daftar = paket.panduan || [];
  return (
    <Modal judul="Cara memperbarui" onTutup={onTutup} lebar="860px">
      <p className="panduan-pengantar">Isi web ini adalah kajian. Bila ada perubahan, ubah di Sheet seperti di bawah, lalu menu ⋯ › Refresh data.</p>
      {daftar.length === 0 ? (
        <p className="kosong">Sheet Cfg_Panduan belum berisi panduan.</p>
      ) : (
        <div className="panduan-daftar">
          {daftar.map((p) => (
            <div key={p.urutan + p.bila} className="panduan-butir">
              <span className="panduan-bila">{p.bila}</span>
              <span className="panduan-ubah"><b>Ubah:</b> {p.ubah}</span>
              <span className="panduan-hasil"><b>Hasilnya:</b> {p.hasil}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
