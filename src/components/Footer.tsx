import React from 'react';

export default function Footer() {
  return (
    <footer className="h-12 bg-ink text-white/40 px-4 sm:px-10 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] mt-auto border-t border-ink/10">
      <span>Veridian Apothecary & Co. — Paris / Lyon / London</span>
      <div className="hidden md:flex gap-8">
        <a href="#" className="hover:text-white/80 transition-colors">Politique de Confidentialité</a>
        <a href="#" className="hover:text-white/80 transition-colors">Conditions de Vente</a>
        <span className="text-white/80">Digital Platform v2.4 Active</span>
      </div>
    </footer>
  );
}
