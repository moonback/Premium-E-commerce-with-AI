import React, { useState } from "react";

// Props for the payment form – onSuccess is called after a successful (demo) submission.
interface PaymentFormProps {
  onSuccess?: () => void | Promise<void>;
  onBack?: () => void;
  formId?: string;
  isSubmitting?: boolean;
  totalAmount?: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSuccess,
  onBack,
  formId = "checkout-payment-form",
  isSubmitting = false,
  totalAmount = 0,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!cardNumber.match(/^\d{13,19}$/)) {
      return "Card number must be 13‑19 digits.";
    }
    if (!expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      return "Expiry must be in MM/YY format.";
    }
    if (!cvc.match(/^\d{3,4}$/)) {
      return "CVC must be 3 or 4 digits.";
    }
    if (name.trim() === "") {
      return "Name on card is required.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      document.getElementById("payment-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
    await onSuccess?.();
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-bg border border-ink/10 shadow-2xl p-8 space-y-6">
      <h2 className="text-3xl font-serif text-ink tracking-tight text-center">Payment Details</h2>
      <p className="text-ink/60 text-xs uppercase tracking-widest font-bold text-center -mt-4">
        Espace de paiement sécurisé
      </p>

      {error && (
        <p id="payment-error" role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="cardNumber" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
            Card Number
          </label>
          <input
            id="cardNumber"
            name="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\s+/g, ""))}
            required
            className="w-full bg-transparent border-b border-ink/20 px-0 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="expiry" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
              Expiry (MM/YY)
            </label>
            <input
              id="expiry"
              name="expiry"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="04/26"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
              className="w-full bg-transparent border-b border-ink/20 px-0 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
            />
          </div>

          <div>
            <label htmlFor="cvc" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
              CVC
            </label>
            <input
              id="cvc"
              name="cvc"
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              required
              className="w-full bg-transparent border-b border-ink/20 px-0 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
            />
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
            Name on Card
          </label>
          <input
            id="name"
            name="ccname"
            type="text"
            autoComplete="cc-name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-transparent border-b border-ink/20 px-0 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/70">
        <div className="flex justify-between font-bold text-ink">
          <span>Total sécurisé</span>
          <span>{totalAmount.toFixed(2)}€</span>
        </div>
        <p className="mt-1 text-xs">Vos informations sont vérifiées localement pour cette démo avant création transactionnelle de la commande.</p>
      </div>

      <div className="pt-4 space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-ink text-bg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors cursor-pointer flex justify-center items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Validation..." : `Pay ${totalAmount.toFixed(2)}€`}
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full py-4 border border-ink text-ink bg-transparent font-bold text-xs uppercase tracking-widest hover:bg-ink/5 transition-colors cursor-pointer flex justify-center items-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            ← Retour
          </button>
        )}
      </div>
    </form>
  );
};

export default PaymentForm;
