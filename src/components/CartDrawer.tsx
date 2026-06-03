import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import FreeShippingBar from './FreeShippingBar';
import ProductRecommendations from './ProductRecommendations';
import { getErrorMessage } from '../lib/errors';


export default function CartDrawer() {
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    isCartOpen, 
    setCartOpen, 
    products,
    discountCode,
    discountAmount,
    setDiscount,
    removeDiscount
  } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoCode.trim()) {
      setPromoError('Veuillez entrer un code');
      return;
    }

    if (!supabase) {
      setPromoError('Service non disponible');
      return;
    }

    setIsValidating(true);
    setPromoError('');

    try {
      const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      const { data, error } = await supabase.rpc('validate_discount_code', {
        p_code: promoCode.trim().toUpperCase(),
        p_order_amount: total,
      });

      if (error) throw error;

      if (data.valid) {
        setDiscount(data.code, data.discount_amount);
        toast.success(`Code ${data.code} appliqué ! -${data.discount_amount.toFixed(2)}€`);
        setPromoCode('');
        setPromoError('');
      } else {
        setPromoError(data.error || 'Code invalide');
      }
    } catch (err: unknown) {
      console.error('Failed to validate discount code', err);
      setPromoError(getErrorMessage(err, 'Erreur de validation'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromo = () => {
    removeDiscount();
    setPromoCode('');
    setPromoError('');
    toast.success('Code promo retiré');
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
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
              <h2 className="text-xl font-serif tracking-tight">Votre Panier</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-soft-green rounded-full transition-colors text-ink/60 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-soft-green flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-ink/30" />
                  </div>
                  <p className="text-ink/60">Votre panier est vide.</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
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
                  ))}

                  {/* Recommendations in cart */}
                  {cart.length > 0 && products.length > 0 && (
                    <div className="pt-6 border-t border-ink/10">
                      <ProductRecommendations
                        currentProduct={cart[0]?.product}
                        products={products}
                        title="Complétez votre panier"
                        maxItems={2}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-ink/10 bg-soft-green/30 space-y-4">
                <div>
                  <FreeShippingBar currentAmount={finalTotal} threshold={50} />
                </div>

                {/* Promo Code Input */}
                <div className="border-t border-b border-ink/10 py-4 space-y-2">
                  {discountCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                          ✓ Code {discountCode} appliqué
                        </p>
                        <p className="text-xs text-green-700">
                          -{discountAmount.toFixed(2)}€ économisés
                        </p>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-xs text-green-600 hover:text-green-800 font-bold"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Code promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        disabled={isValidating}
                        className="flex-1 bg-transparent border-b border-ink/20 py-2 text-xs focus:outline-none focus:border-ink transition-all duration-200 placeholder:text-ink/30 italic uppercase disabled:opacity-50"
                      />
                      <button 
                        type="submit" 
                        disabled={isValidating || !promoCode.trim()}
                        className="text-xs uppercase tracking-widest font-bold text-ink border border-ink/20 px-3 py-1 hover:border-ink hover:bg-ink/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isValidating ? 'Validation...' : 'Appliquer'}
                      </button>
                    </form>
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
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-green-600 uppercase tracking-widest font-bold">
                      <span>Remise</span>
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

