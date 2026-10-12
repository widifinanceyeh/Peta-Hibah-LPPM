import React from 'react';
import TeksIstilah from './Istilah';
import { vp } from '../utils/data';

// "Sumber bilang … ≠ Pembanding bilang … → Jadi perlu …"
export default function Pasangan({ paket, modul, row, ringkas }) {
  const ls = vp(paket, modul, row, 'label_sumber');
  const ks = vp(paket, modul, row, 'kata_sumber');
  const lp = vp(paket, modul, row, 'label_pembanding');
  const kp = vp(paket, modul, row, 'kata_pembanding');
  const jp = vp(paket, modul, row, 'jadi_perlu');
  if (!ks && !kp) return <p className="pasangan-kosong">{vp(paket, modul, row, 'judul')}</p>;
  return (
    <div className={'pasangan' + (ringkas ? ' pasangan-ringkas' : '')}>
      <div className="pasangan-sisi">
        <span className="pasangan-label">{ls}</span>
        <span className="pasangan-kata"><TeksIstilah paket={paket} teks={ks} /></span>
      </div>
      <span className="pasangan-beda" aria-label="berbeda dengan">≠</span>
      <div className="pasangan-sisi">
        <span className="pasangan-label">{lp}</span>
        <span className="pasangan-kata"><TeksIstilah paket={paket} teks={kp} /></span>
      </div>
      {jp && (
        <div className="pasangan-jadi">
          <span aria-hidden="true">→</span> <TeksIstilah paket={paket} teks={jp} />
        </div>
      )}
    </div>
  );
}
