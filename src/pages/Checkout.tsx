// src/pages/Checkout.tsx
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import CheckoutStepper from "../components/CheckoutStepper";
import CartReview from "../components/CartReview";
import ClientDeliveryForm from "../components/ClientDeliveryForm";
import PaymentForm from "../components/PaymentForm";
import { useStore } from "../store";

export default function Checkout() {
  const [step, setStep] = useState(0);
  const {
    checkout,
    resetCheckout,
    setClientInfo,
    setDeliveryMethod,
    isLoadingProducts,
    // optional: you could read the cart here for a final summary
  } = useStore();
  const navigate = useNavigate();

  // ---- STEP NAVIGATION -------------------------------------------------
  const next = useCallback(
    (isValid: boolean = true) => {
      if (!isValid) {
        toast.error("Please complete the required fields before continuing.");
        return;
      }
      setStep((s) => Math.min(s + 1, 2));
    },
    [setStep]
  );
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // ---- FINAL PAYMENT HANDLER -------------------------------------------
  const handlePaymentSuccess = async () => {
    try {
      await checkout(); // creates order in Supabase & clears cart only after success
      resetCheckout();
      toast.success("✅ Order placed! Thank you for your purchase.");
      navigate("/"); // back to home after order
    } catch {
      // checkout() already shows the actionable error and keeps the cart intact
    }
  };

  // ---- RENDER -----------------------------------------------------------
  return (
    <section className="flex min-h-screen flex-col items-center bg-bg font-sans text-ink">
      <header className="w-full max-w-2xl py-6">
        <h1 className="text-3xl font-bold text-center">Checkout</h1>
        <p className="text-center text-ink/60">
          Review your cart, add delivery details and complete payment.
        </p>
        <Link
          to="/"
          className="mt-4 block w-max mx-auto text-sm underline hover:text-ink/80"
        >
          ← Back to store
        </Link>
      </header>

      <div className="w-full max-w-2xl flex-1 p-6">
        <CheckoutStepper activeStep={step} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CartReview onNext={() => next(true)} />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="client"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ClientDeliveryForm
                onBack={back}
                onNext={next}
                // store the data when the form is valid
                onValid={(clientInfo, deliveryMethod) => {
                  setClientInfo(clientInfo);
                  setDeliveryMethod(deliveryMethod);
                }}
              />
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
    </section>
  );
}
