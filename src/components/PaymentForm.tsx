import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { getErrorMessage } from "../lib/errors";

type StripePaymentElement = {
  mount: (selector: string | HTMLElement) => void;
  unmount: () => void;
  on: (event: "change", handler: (event: { error?: { message?: string }; complete?: boolean }) => void) => void;
};

type StripeElements = {
  create: (type: "payment", options?: Record<string, unknown>) => StripePaymentElement;
};

type StripeInstance = {
  elements: (options: { clientSecret: string; locale?: "fr" }) => StripeElements;
  confirmPayment: (options: {
    elements: StripeElements;
    confirmParams: {
      payment_method_data: { billing_details: { name: string; email: string } };
    };
    redirect: "if_required";
  }) => Promise<{ paymentIntent?: { id: string; status: string }; error?: { message?: string } }>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

type PaymentFormItem = {
  productId: string;
  quantity: number;
};

interface PaymentFormProps {
  onSuccess?: (paymentIntentId: string, providerStatus: string) => void | Promise<void>;
  onBack?: () => void;
  formId?: string;
  isSubmitting?: boolean;
  totalAmount?: number;
  customerName?: string;
  customerEmail?: string;
  items?: PaymentFormItem[];
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
let stripeScriptPromise: Promise<void> | null = null;

function loadStripeScript() {
  if (window.Stripe) return Promise.resolve();
  if (stripeScriptPromise) return stripeScriptPromise;

  stripeScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Stripe.js n’a pas pu être chargé.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Stripe.js n’a pas pu être chargé."));
    document.head.appendChild(script);
  });

  return stripeScriptPromise;
}

async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSuccess,
  onBack,
  formId = "checkout-payment-form",
  isSubmitting = false,
  totalAmount = 0,
  customerName = "",
  customerEmail = "",
  items = [],
}) => {
  const checkoutAttemptIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const [name, setName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [verifiedAmountCents, setVerifiedAmountCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createPaymentIntent() {
      const token = await getAccessToken();
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
          checkoutAttemptId: checkoutAttemptIdRef.current,
          currency: "eur",
          customer: { name: customerName, email: customerEmail },
        }),
      });

      const payload = await response.json() as { clientSecret?: string; amountCents?: number; error?: string };
      if (!response.ok || !payload.clientSecret) {
        throw new Error(payload.error || "Impossible d’initialiser le paiement.");
      }
      return { clientSecret: payload.clientSecret, amountCents: payload.amountCents ?? null };
    }

    async function initializeStripePaymentElement() {
      if (!stripePublishableKey || totalAmount <= 0 || items.length === 0) return;
      try {
        const [paymentIntentSetup] = await Promise.all([createPaymentIntent(), loadStripeScript()]);
        if (cancelled || !window.Stripe) return;

        const stripe = window.Stripe(stripePublishableKey);
        setVerifiedAmountCents(paymentIntentSetup.amountCents);
        const elements = stripe.elements({ clientSecret: paymentIntentSetup.clientSecret, locale: "fr" });
        const paymentElement = elements.create("payment", {
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              name: customerName,
              email: customerEmail,
            },
          },
        });

        paymentElement.on("change", (event) => {
          setPaymentComplete(Boolean(event.complete));
          setError(event.error?.message || null);
        });
        paymentElement.mount("#stripe-payment-element");
        paymentElementRef.current = paymentElement;
        elementsRef.current = elements;
        stripeRef.current = stripe;
        setIsStripeReady(true);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    }

    initializeStripePaymentElement();

    return () => {
      cancelled = true;
      paymentElementRef.current?.unmount();
      paymentElementRef.current = null;
      elementsRef.current = null;
      stripeRef.current = null;
      setIsStripeReady(false);
    };
  }, [customerEmail, customerName, items, totalAmount]);

  useEffect(() => setName(customerName), [customerName]);
  useEffect(() => setEmail(customerEmail), [customerEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripePublishableKey) {
      setError("Paiement Stripe non configuré : ajoutez VITE_STRIPE_PUBLISHABLE_KEY et STRIPE_SECRET_KEY.");
      return;
    }
    if (!stripeRef.current || !elementsRef.current || !isStripeReady) {
      setError("Le module de paiement est encore en chargement.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError("Le nom et l’email de facturation sont requis.");
      return;
    }
    if (!paymentComplete) {
      setError("Veuillez compléter vos informations de paiement.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const confirmation = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          payment_method_data: {
            billing_details: { name, email },
          },
        },
        redirect: "if_required",
      });

      if (confirmation.error) {
        throw new Error(confirmation.error.message || "Le paiement a été refusé.");
      }

      const paymentIntent = confirmation.paymentIntent;
      if (!paymentIntent || !["succeeded", "processing"].includes(paymentIntent.status)) {
        throw new Error("Le paiement n’est pas confirmé par le PSP.");
      }

      await onSuccess?.(paymentIntent.id, paymentIntent.status);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      document.getElementById("payment-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isSubmitting || isProcessing;
  const displayedTotal = ((verifiedAmountCents ?? Math.round(totalAmount * 100)) / 100).toFixed(2);

  return (
    <form id={formId} onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-bg border border-ink/10 shadow-2xl p-8 space-y-6">
      <h2 className="text-3xl font-serif text-ink tracking-tight text-center">Paiement sécurisé</h2>
      <p className="text-ink/60 text-xs uppercase tracking-widest font-bold text-center -mt-4">
        Payment Element Stripe avec confirmation webhook serveur
      </p>

      {error && (
        <p id="payment-error" role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-red-600">
          {error}
        </p>
      )}

      {!stripePublishableKey && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Paiement réel désactivé en local : configurez <code>VITE_STRIPE_PUBLISHABLE_KEY</code> côté client et <code>STRIPE_SECRET_KEY</code> côté serveur.
        </p>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="billingName" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
            Nom de facturation
          </label>
          <input
            id="billingName"
            name="billingName"
            type="text"
            autoComplete="cc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-transparent border-b border-ink/20 px-0 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
          />
        </div>

        <div>
          <label htmlFor="billingEmail" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
            Email de reçu
          </label>
          <input
            id="billingEmail"
            name="billingEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent border-b border-ink/20 px-0 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-3">
            Moyen de paiement
          </label>
          <div id="stripe-payment-element" className="rounded-2xl border border-ink/15 bg-white px-4 py-4 min-h-32" />
          <p className="mt-2 text-[11px] text-ink/45">
            Les données de paiement sont saisies dans Stripe.js et ne transitent pas par Véridian.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/70">
        <div className="flex justify-between font-bold text-ink">
          <span>Total sécurisé</span>
          <span>{displayedTotal}€</span>
        </div>
        <p className="mt-1 text-xs">La commande est créée après acceptation PSP, puis marquée payée uniquement par webhook signé.</p>
      </div>

      <div className="pt-4 space-y-3">
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-4 bg-ink text-bg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors cursor-pointer flex justify-center items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDisabled ? "Validation..." : `Payer ${displayedTotal}€`}
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isDisabled}
            className="w-full py-3 text-xs font-bold uppercase tracking-widest text-ink/55 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retour
          </button>
        )}
      </div>
    </form>
  );
};

export default PaymentForm;
