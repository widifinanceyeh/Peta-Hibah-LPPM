import React from 'react';

export default function PenandaSimpan({ status, onUlang }) {
  if (!status) return null;
  if (status === 'menyimpan') return <span className="penanda penanda-proses">Menyimpan…</span>;
  if (status === 'tersimpan') return <span className="penanda penanda-ok">Tersimpan di sheet</span>;
  return (
    <span className="penanda penanda-gagal">
      Gagal menyimpan
      <button type="button" className="tombol-kecil" onClick={onUlang}>
        Simpan ulang
      </button>
    </span>
  );
}
