import React from 'react';

const dasar = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IkonOrang = () => (
  <svg {...dasar}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const IkonDokumen = () => (
  <svg {...dasar}><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6" /></svg>
);
export const IkonUang = () => (
  <svg {...dasar}><circle cx="12" cy="12" r="9" /><path d="M9 8h4.5a2.2 2.2 0 0 1 0 4.4H9V17M9 12.4h5" /></svg>
);
export const IkonAwas = () => (
  <svg {...dasar}><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18v.3" /></svg>
);
export const IkonCek = () => (
  <svg {...dasar}><path d="M5 12l5 5L20 7" /></svg>
);
export const IkonUlang = () => (
  <svg {...dasar} width="14" height="14"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
);
