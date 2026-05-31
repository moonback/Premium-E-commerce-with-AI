import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-bg px-6 py-24 text-center text-ink">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-ink/40">Erreur 404</p>
        <h1 className="mb-6 font-serif text-5xl leading-tight md:text-7xl">
          Cette page n'existe pas.
        </h1>
        <p className="mx-auto mb-10 max-w-md text-sm leading-7 text-ink/60">
          Le lien demandé est introuvable. Retournez à la collection pour continuer votre parcours d'achat.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bg transition-colors hover:bg-ink/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour boutique
          </Link>
          <Link
            to="/#collection"
            className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:border-ink/50"
          >
            <Search className="h-4 w-4" />
            Explorer
          </Link>
        </div>
      </div>
    </main>
  );
}
