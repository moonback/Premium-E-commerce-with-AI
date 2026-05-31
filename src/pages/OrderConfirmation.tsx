import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock3, Package, ReceiptText, Truck } from 'lucide-react';
import { useStore } from '../store';

type ConfirmationItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type ConfirmationState = {
  orderId?: string | null;
  orderNumber?: string | null;
  total?: number;
  deliveryMethod?: 'clickCollect' | 'courier';
  items?: ConfirmationItem[];
  status?: string;
};

export default function OrderConfirmation() {
  const location = useLocation();
  const lastOrderId = useStore(state => state.lastOrderId);
  const lastOrderNumber = useStore(state => state.lastOrderNumber);
  const state = (location.state || {}) as ConfirmationState;
  const orderId = state.orderId || lastOrderId;
  const orderNumber = state.orderNumber || lastOrderNumber || orderId;
  const items = state.items || [];
  const total = state.total ?? items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryLabel = state.deliveryMethod === 'clickCollect' ? 'Click & collect' : 'Livraison à domicile';
  const status = state.status || 'Nouvelle';

  return (
    <main className="min-h-[70vh] bg-bg px-4 py-16 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl border border-ink/10 bg-white/60 p-8 shadow-sm backdrop-blur md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <CheckCircle2 className="mb-5 h-14 w-14 text-accent" />
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-ink/40">Commande confirmée</p>
          <h1 className="font-serif text-4xl leading-tight md:text-6xl">Merci pour votre achat.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/60">
            Votre commande a bien été enregistrée. Nous préparons maintenant les prochaines étapes de traitement.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-ink/10 bg-bg/70 p-4">
            <ReceiptText className="mb-3 h-5 w-5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Numéro</p>
            <p className="mt-1 break-all font-medium">{orderNumber || 'Commande locale'}</p>
          </div>
          <div className="border border-ink/10 bg-bg/70 p-4">
            <Package className="mb-3 h-5 w-5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Articles</p>
            <p className="mt-1 font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)} article(s)</p>
          </div>
          <div className="border border-ink/10 bg-bg/70 p-4">
            <Clock3 className="mb-3 h-5 w-5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Statut</p>
            <p className="mt-1 font-medium">{status}</p>
          </div>
          <div className="border border-ink/10 bg-bg/70 p-4">
            <Truck className="mb-3 h-5 w-5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Suite</p>
            <p className="mt-1 font-medium">{deliveryLabel}</p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-8 border-t border-ink/10 pt-6">
            <h2 className="mb-4 font-serif text-2xl">Résumé des articles</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-ink/50">Quantité : {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{(item.unitPrice * item.quantity).toFixed(2)}€</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-5 text-lg font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/profile"
            className="inline-flex justify-center bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bg transition-colors hover:bg-ink/90"
          >
            Voir mon compte
          </Link>
          <Link
            to="/"
            className="inline-flex justify-center border border-ink/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:border-ink/50"
          >
            Continuer la boutique
          </Link>
        </div>
      </section>
    </main>
  );
}
