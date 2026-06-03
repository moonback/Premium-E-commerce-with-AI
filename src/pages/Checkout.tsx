// src/pages/Checkout.tsx
import React, { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, RotateCcw, ShieldCheck, ShoppingBag, X } from "lucide-react";

import CheckoutStepper from "../components/CheckoutStepper";
import CartReview from "../components/CartReview";
import ClientDeliveryForm from "../components/ClientDeliveryForm";
import PaymentForm from "../components/PaymentForm";
import DiscountCodeInput from "../components/DiscountCodeInput";
import { useStore } from "../store";
import { Drawer } from "../components/ui/Drawer";

const PAYMENT_FORM_ID = "checkout-payment-form";

function formatPrice(value: number) {
  return `${value.toFixed(2)}€`;
}

function AssuranceBadges() {
  const badges = [
    { icon: ShieldCheck, label: "Paiement sécurisé" },
    { icon: RotateCcw, label: "Retours simplifiés" },
    { icon: CheckCircle2, label: "Support premium" },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Garanties Véridian">
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/60 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-ink/60">
          <Icon className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ subtotal, discountAmount, total, onDiscountApplied, onDiscountRemoved, discountCode }: { 
  subtotal: number;
  discountAmount: number;
  total: number;
  onDiscountApplied: (code: string, amount: number) => void;
  onDiscountRemoved: () => void;
  discountCode?: string;
}) {
  const { cart, checkoutInfo } = useStore();
  const deliveryLabel = checkoutInfo.deliveryMethod === "clickCollect" ? "Click & Collect" : "Coursier";

  return (
    <aside className="rounded-[2rem] border border-ink/10 bg-bg/95 p-6 shadow-2xl shadow-ink/5 lg:sticky lg:top-24" aria-label="Récapitulatif de commande">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">Résumé</h2>
        <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink/50">
          {cart.length} article{cart.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-h-72 space-y-4 overflow-auto pr-1">
        {cart.length === 0 ? (
          <p className="text-sm text-ink/50">Votre panier est vide.</p>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="flex gap-3">
              <img src={item.snapshot.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm text-ink">{item.snapshot.name}</p>
                <p className="text-xs text-ink/45">Qté {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-ink">{formatPrice(item.snapshot.price * item.quantity)}</p>
            </div>
          ))
        )}
      </div>

      <div className="my-6 space-y-3 border-y border-ink/10 py-5 text-sm">
        <div className="flex justify-between text-ink/60">
          <span>Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Réduction</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-ink/60">
          <span>Livraison</span>
          <span>{deliveryLabel}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-ink">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mb-6">
        <DiscountCodeInput
          orderTotal={subtotal}
          onDiscountApplied={onDiscountApplied}
          onDiscountRemoved={onDiscountRemoved}
          appliedCode={discountCode}
          appliedAmount={discountAmount}
        />
      </div>

      <AssuranceBadges />
    </aside>
  );
}

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const {
    confirmOrderLocally,
    resetCheckout,
    setClientInfo,
    setDeliveryMethod,
    setDiscount,
    removeDiscount,
    cart,
    checkoutInfo,
    discountCode,
    discountAmount,
  } = useStore();
  const navigate = useNavigate();
  const checkoutAttemptIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const checkoutAttemptId = checkoutAttemptIdRef.current;
  const subtotal = cart.reduce((sum, item) => sum + item.snapshot.price * item.quantity, 0);
  const total = subtotal - discountAmount;
  const paymentItems = useMemo(
    () => cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    [cart]
  );

  // ---- STEP NAVIGATION -------------------------------------------------
  const next = useCallback(
    (isValid: boolean = true) => {
      if (!isValid) {
        toast.error("Veuillez compléter les champs obligatoires avant de continuer.");
        return;
      }
      setStep((s) => Math.min(s + 1, 2));
    },
    [setStep]
  );
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // ---- FINAL PAYMENT HANDLER -------------------------------------------
  const handlePaymentSuccess = async (
    paymentIntentId: string,
    providerStatus: string,
    orderId: string,
    orderNumber: string
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const items = cart.map(item => ({
        id: item.productId,
        name: item.snapshot.name,
        quantity: item.quantity,
        unitPrice: item.snapshot.price,
      }));
      const deliveryMethod = checkoutInfo.deliveryMethod;
      const status = 'Nouvelle';
      
      // Update local store state (cart, points, lastOrder details) and sync profile
      await confirmOrderLocally(orderId, orderNumber);
      
      resetCheckout();
      toast.success("✅ Commande validée ! Merci pour votre achat.");
      navigate("/order-confirmation", {
        state: { orderId, orderNumber, total, deliveryMethod, items, status },
      });
    } catch (err) {
      console.error("Error confirming order locally:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- RENDER -----------------------------------------------------------
  return (
    <section className="flex min-h-screen flex-col items-center bg-bg px-4 pb-28 font-sans text-ink lg:pb-12">
      <header className="w-full max-w-3xl py-6 text-center">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-ink/40">Checkout sécurisé</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Finaliser ma commande</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60 md:text-base">
          Vérifiez votre panier, confirmez la livraison et validez le paiement en trois étapes lisibles.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex text-sm underline underline-offset-4 hover:text-ink/80"
        >
          ← Retour à la boutique
        </Link>
      </header>

      <div className="grid w-full max-w-6xl flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 rounded-[2rem] border border-ink/10 bg-white/40 p-4 shadow-xl shadow-ink/5 sm:p-6 lg:p-8">
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
                <PaymentForm
                  formId={PAYMENT_FORM_ID}
                  isSubmitting={isSubmitting}
                  totalAmount={total}
                  items={paymentItems}
                  customerName={checkoutInfo.clientInfo.name}
                  customerEmail={checkoutInfo.clientInfo.email}
                  onBack={back}
                  onSuccess={handlePaymentSuccess}
                  checkoutData={{
                    clientInfo: checkoutInfo.clientInfo,
                    deliveryMethod: checkoutInfo.deliveryMethod,
                  }}
                  checkoutAttemptId={checkoutAttemptId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <OrderSummary 
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          onDiscountApplied={setDiscount}
          onDiscountRemoved={removeDiscount}
          discountCode={discountCode || undefined}
        />
      </div>

      {step === 2 && cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-bg/95 p-4 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2 rounded-full border border-ink/20 bg-white/60 px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:bg-white"
              aria-label="Voir le résumé du panier"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/45">Total à payer</p>
              <p className="text-xl font-serif text-ink">{formatPrice(total)}</p>
            </div>
            <button
              type="submit"
              form={PAYMENT_FORM_ID}
              disabled={isSubmitting}
              className="rounded-full bg-ink px-6 py-4 text-xs font-bold uppercase tracking-widest text-bg shadow-lg transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Validation..." : `Payer ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Summary Drawer */}
      <Drawer
        open={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        title="Résumé du panier"
      >
        <div className="space-y-4 p-4">
          {cart.map((item) => (
            <div key={item.productId} className="flex gap-3 border-b border-ink/10 pb-4">
              <img 
                src={item.snapshot.image} 
                alt="" 
                className="h-20 w-20 rounded-2xl object-cover" 
              />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-base text-ink">{item.snapshot.name}</p>
                <p className="text-sm text-ink/60">Quantité: {item.quantity}</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {formatPrice(item.snapshot.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
          
          <div className="space-y-3 border-t border-ink/10 pt-4">
            <div className="flex justify-between text-sm text-ink/60">
              <span>Sous-total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink/60">
              <span>Livraison</span>
              <span>{checkoutInfo.deliveryMethod === "clickCollect" ? "Click & Collect" : "Coursier"}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-ink">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="w-full rounded-full bg-ink px-6 py-4 text-xs font-bold uppercase tracking-widest text-bg transition-colors hover:bg-ink/90"
          >
            Continuer le paiement
          </button>
        </div>
      </Drawer>
    </section>
  );
}
