import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';


export default function CartDrawer() {
  const { cart, addToCart, removeFromCart, checkout, isCartOpen, setCartOpen } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === 'VERIDIAN10') {
      setDiscount(10);
      setAppliedCode(promoCode.toUpperCase());
      setPromoError('');
    } else {
      setPromoError('Code invalide');
      setDiscount(0);
      setAppliedCode('');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = total * (discount / 100);
  const finalTotal = total - discountAmount;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-bg shadow-2xl z-50 flex flex-col border-l border-ink/10"
          >
            <div className="flex items-center justify-between p-6 border-b border-ink/10">
              <h2 className="text-xl font-serif tracking-tight">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-soft-green rounded-full transition-colors text-ink/60 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-soft-green flex items-center justify-center">
                    <ShoppingBagIcon className="w-6 h-6 text-ink/30" />
                  </div>
                  <p className="text-ink/60">Your cart is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-soft-green rounded-tl-3xl rounded-br-3xl overflow-hidden shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover mix-blend-overlay opacity-80" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-medium">{item.product.name}</h4>
                        <p className="text-ink/50 text-xs italic uppercase">{item.product.categories.join(', ')}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-soft-green rounded-lg p-1">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                addToCart(item.product, -1);
                              } else {
                                removeFromCart(item.product.id);
                              }
                            }}
                            className="p-1 hover:bg-white rounded-md transition-colors text-ink/60"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.product, 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-ink/60"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-semibold text-sm">{(item.product.price * item.quantity).toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-ink/10 bg-soft-green/30 space-y-4">
                <div>
                  <div className="h-1 w-full bg-ink/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-accent transition-all" style={{ width: `${Math.min((finalTotal / 50) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-ink/50 text-center">
                    {finalTotal >= 50 ? '🎉 Livraison gratuite débloquée' : `Ajoutez ${(50 - finalTotal).toFixed(2)}€ pour la livraison gratuite`}
                  </p>
                </div>

                {/* Promo Code Input */}
                <div className="border-t border-b border-ink/10 py-4 space-y-2">
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Code promo (ex: VERIDIAN10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-transparent border-b border-ink/20 py-2 text-xs focus:outline-none focus:border-ink transition-all duration-200 placeholder:text-ink/30 italic uppercase"
                    />
                    <button type="submit" className="text-xs uppercase tracking-widest font-bold text-ink border border-ink/20 px-3 py-1 hover:border-ink hover:bg-ink/5 transition-colors cursor-pointer">
                      Appliquer
                    </button>
                  </form>
                  {appliedCode && (
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                      ✓ Code {appliedCode} appliqué (-10%)
                    </p>
                  )}
                  {promoError && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                      ✗ {promoError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 py-2">
                  <div className="flex items-center justify-between text-xs text-ink/60 uppercase tracking-widest font-bold">
                    <span>Sous-total</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-xs text-green-600 uppercase tracking-widest font-bold">
                      <span>Remise (-10%)</span>
                      <span>-{discountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-ink pt-2 border-t border-ink/5">
                    <span className="text-sm uppercase tracking-widest font-bold">Total</span>
                    <span className="font-semibold text-xl font-serif">{finalTotal.toFixed(2)}€</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="block text-center w-full py-4 bg-ink text-bg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors border border-ink"
                >
                  Checkout - {finalTotal.toFixed(2)}€
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
