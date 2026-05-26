import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';

export default function CartReview({ onNext }: { onNext: () => void }) {
  const { cart, total, resetCheckout, setCartOpen } = useStore();
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleProceed = () => {
    // Close drawer if open and go to next step
    setCartOpen(false);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-serif">Récapitulatif du panier</h2>
      {cart.length === 0 ? (
        <p className="text-ink/60">Le panier est vide.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-4">
              <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-serif">{item.product.name}</p>
                <p className="text-xs text-ink/50">{item.product.category}</p>
              </div>
              <span className="font-medium">{item.quantity} × {item.product.price.toFixed(2)}€</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-xl pt-4 border-t border-ink/10">
            <span>Sous‑total</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
        </div>
      )}
      <div className="flex justify-between mt-6">
        <Link
          to="/"
          className="px-4 py-2 bg-ink/10 text-ink rounded hover:bg-ink/20 transition"
        >
          Continuer les achats
        </Link>
        <button
          onClick={handleProceed}
          disabled={cart.length === 0}
          className="px-4 py-2 bg-ink text-bg font-bold rounded hover:bg-ink/90 transition"
        >
          Suivant
        </button>
      </div>
    </motion.div>
  );
}
