import React, { useMemo, useState } from 'react';

function Istilah({ kata, arti }) {
  const [buka, setBuka] = useState(false);
  return (
    <span className="istilah-wadah">
      <button type="button" className="istilah" title={arti} aria-expanded={buka} onClick={(e) => { e.stopPropagation(); setBuka(!buka); }}>
        {kata}
      </button>
      {buka && (
        <span className="istilah-arti" role="tooltip">
          <b>{kata}</b> = {arti}
        </span>
      )}
    </span>
  );
}

// Menandai istilah dari Cfg_Istilah di dalam teks pendek.
export default function TeksIstilah({ paket, teks }) {
  const daftar = paket.istilah;
  const pola = useMemo(() => {
    const kata = (daftar || []).map((x) => x.istilah).filter(Boolean).sort((a, b) => b.length - a.length);
    if (!kata.length) return null;
    const esc = kata.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp('(^|[^A-Za-z0-9])(' + esc.join('|') + ')(?=$|[^A-Za-z0-9])', 'g');
  }, [daftar]);
  const s = String(teks === null || teks === undefined ? '' : teks);
  if (!pola || !s) return s;
  const arti = {};
  (daftar || []).forEach((x) => (arti[x.istilah] = x.arti));
  const hasil = [];
  let akhir = 0, m, n = 0, sudah = {};
  pola.lastIndex = 0;
  while ((m = pola.exec(s))) {
    const mulai = m.index + m[1].length;
    const kata = m[2];
    if (sudah[kata]) continue; // cukup ditandai sekali per teks
    sudah[kata] = true;
    hasil.push(s.slice(akhir, mulai));
    hasil.push(<Istilah key={n++} kata={kata} arti={arti[kata]} />);
    akhir = mulai + kata.length;
  }
  hasil.push(s.slice(akhir));
  return <>{hasil}</>;
}
