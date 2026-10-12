import React, { useEffect } from 'react';

export default function Modal({ judul, onTutup, children, kaki, lebar }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onTutup();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onTutup]);
  return (
    <div className="modal-latar" onMouseDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={judul} style={lebar ? { maxWidth: lebar } : null}>
        <div className="modal-kepala">
          <h2>{judul}</h2>
          <button type="button" className="tombol-ikon" onClick={onTutup} aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="modal-isi">{children}</div>
        {kaki ? <div className="modal-kaki">{kaki}</div> : null}
      </div>
    </div>
  );
}
