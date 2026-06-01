import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-ink text-white/40 px-4 sm:px-10 mt-auto border-t border-ink/10">
      {/* Main footer links row */}
      <div className="max-w-7xl mx-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] uppercase tracking-[0.2em]">
        <span>Véridian Apothecary & Co. — Paris / Lyon / London</span>
        <nav className="flex flex-wrap justify-center gap-5" aria-label="Liens légaux">
          <Link to="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
          <Link to="/mentions-legales" className="hover:text-white/80 transition-colors">Mentions Légales</Link>
          <Link to="/cgv" className="hover:text-white/80 transition-colors">CGV</Link>
          <Link to="/livraison" className="hover:text-white/80 transition-colors">Livraison & Retours</Link>
          <span className="text-white/30 hidden md:inline">Digital Platform v2.4</span>
        </nav>
      </div>
    </footer>
  );
}
