import React from 'react';
import { useStore } from '../store';
import { X, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CartDrawer() {
  const { cart, addToCart, removeFromCart, checkout, isCartOpen, setCartOpen } = useStore();
  
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

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
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-ink/10"
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
                        <p className="text-ink/50 text-xs italic uppercase">{item.product.category}</p>
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
              <div className="p-6 border-t border-ink/10 bg-soft-green/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-ink/60 text-sm uppercase tracking-widest font-bold">Subtotal</span>
                  <span className="font-semibold">{total.toFixed(2)}€</span>
                </div>
                <button 
                  onClick={() => {
                    checkout();
                    onClose();
                  }}
                  className="w-full py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors border border-ink"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShoppingBagIcon(props: any) {
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
