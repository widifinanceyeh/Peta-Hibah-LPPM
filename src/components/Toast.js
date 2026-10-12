import React from 'react';

// Notifikasi tanpa durasi: tetap tampil sampai ditutup.
export default function Toast({ daftar, onTutup }) {
  if (!daftar.length) return null;
  return (
    <div className="toast-wadah" role="status" aria-live="polite">
      {daftar.map((t) => (
        <div key={t.id} className={'toast toast-' + (t.jenis || 'info')}>
          <span>{t.pesan}</span>
          <button type="button" className="tombol-ikon" onClick={() => onTutup(t.id)} aria-label="Tutup notifikasi">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
