import React, { useEffect, useRef, useState } from 'react';

export default function MenuTitik({ item }) {
  const [buka, setBuka] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!buka) return undefined;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setBuka(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [buka]);
  return (
    <div className="menu-titik" ref={ref}>
      <button type="button" className="tombol-ikon" aria-label="Menu lainnya" aria-expanded={buka} onClick={() => setBuka(!buka)}>
        ⋯
      </button>
      {buka && (
        <div className="menu-titik-daftar" role="menu">
          {item.filter(Boolean).map((it) => (
            <button
              type="button"
              role="menuitem"
              key={it.label}
              onClick={() => {
                setBuka(false);
                it.aksi();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
