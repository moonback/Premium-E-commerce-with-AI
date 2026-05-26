// src/pages/Checkout.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CheckoutStepper from '../components/CheckoutStepper';
import CartReview from '../components/CartReview';
import ClientDeliveryForm from '../components/ClientDeliveryForm';
import PaymentForm from '../components/PaymentForm';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

// Simple three‑step checkout flow: 0 = Cart, 1 = Client & Delivery, 2 = Payment
export default function Checkout() {
  const [step, setStep] = useState(0);
  const { checkout, resetCheckout } = useStore();
  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handlePaymentSuccess = async () => {
    await checkout(); // creates order in Supabase & clears cart
    resetCheckout();
    navigate('/'); // back to home after order
  };

  return (
    <div className="flex min-h-screen bg-bg font-sans text-ink">
      <div className="max-w-3xl w-full mx-auto p-6 space-y-8">
        <CheckoutStepper activeStep={step} />
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CartReview onNext={next} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div
              key="client"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ClientDeliveryForm onNext={next} onBack={back} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <PaymentForm onBack={back} onSuccess={handlePaymentSuccess} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
