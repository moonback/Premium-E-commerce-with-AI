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
    updateCartQuantity,
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
      const total = cart.reduce((sum, item) => sum + (item.snapshot.price * item.quantity), 0);
      
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

  const total = cart.reduce((sum, item) => sum + (item.snapshot.price * item.quantity), 0);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header - Amazon style */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-ink" />
                <div>
                  <h2 className="text-lg font-bold text-ink">Panier</h2>
                  <p className="text-xs text-ink/60">
                    {cart.length} article{cart.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fermer le panier"
              >
                <X className="w-5 h-5 text-ink" />
              </button>
            </div>

            {/* Free shipping progress */}
            <div className="px-4 py-3 bg-[#f7f7f7] border-b border-gray-200">
              <FreeShippingBar currentTotal={total} />
            </div>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">Votre panier est vide</h3>
                  <p className="text-ink/60 text-sm mb-6">Ajoutez des articles pour commencer vos achats</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="px-6 py-3 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold rounded-lg transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cart.map(item => {
                    const liveProduct = products.find(p => p.id === item.productId);
                    const name = liveProduct?.name ?? item.snapshot.name;
                    const image = liveProduct?.image ?? item.snapshot.image;
                    const price = item.snapshot.price;
                    return (
                      <div key={item.productId} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <Link 
                          to={`/product/${item.productId}`}
                          onClick={() => setCartOpen(false)}
                          className="w-24 h-24 bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0"
                        >
                          <img src={image} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </Link>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <Link 
                              to={`/product/${item.productId}`}
                              onClick={() => setCartOpen(false)}
                              className="font-medium text-ink hover:text-[#007185] transition-colors line-clamp-2"
                            >
                              {name}
                            </Link>
                            <p className="text-sm font-bold text-[#c7511f] mt-1">
                              {price.toFixed(2)}€
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateCartQuantity(item.productId, item.quantity - 1);
                                  } else {
                                    removeFromCart(item.productId);
                                  }
                                }}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors text-ink border-r border-gray-300"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-4 py-1 text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors text-ink border-l border-gray-300"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline font-medium"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Recommendations */}
                  {cart.length > 0 && products.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <ProductRecommendations
                        currentProduct={products.find(p => p.id === cart[0]?.productId)}
                        products={products}
                        title="Vous aimerez aussi"
                        maxItems={2}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Checkout section */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 bg-white p-4 space-y-4">
                {/* Promo Code */}
                <div className="space-y-2">
                  {discountCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <p className="text-xs font-bold text-green-700">
                          ✓ Code {discountCode} appliqué
                        </p>
                        <p className="text-xs text-green-600">
                          -{discountAmount.toFixed(2)}€ de réduction
                        </p>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-green-600 hover:text-green-800"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900] disabled:opacity-50"
                      />
                      <button 
                        type="submit" 
                        disabled={isValidating || !promoCode.trim()}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isValidating ? '...' : 'Appliquer'}
                      </button>
                    </form>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-600">
                      {promoError}
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="space-y-2 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-ink/70">
                    <span>Sous-total ({cart.length} articles)</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                      <span>Réduction</span>
                      <span>-{discountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold text-ink pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-[#c7511f]">{finalTotal.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="block text-center w-full py-3 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors shadow-md"
                >
                  Procéder au paiement
                </Link>
                <p className="text-xs text-center text-ink/60">
                  Livraison et taxes calculées à la caisse
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
