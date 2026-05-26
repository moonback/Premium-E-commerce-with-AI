import React, { useState } from "react";

// Props for the payment form – onSuccess is called after a successful (demo) submission.
interface PaymentFormProps {
  onSuccess?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    // Here you would normally send data to a payment gateway.
    console.log("Submitting payment", { cardNumber, expiry, cvc, name });
    // Notify parent (Checkout) that payment succeeded.
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={headingStyle}>Payment Details</h2>
      {error && <p style={errorStyle}>{error}</p>}
      <div style={fieldStyle}>
        <label htmlFor="cardNumber" style={labelStyle}>Card Number</label>
        <input
          id="cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\s+/g, ""))}
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="expiry" style={labelStyle}>Expiry (MM/YY)</label>
        <input
          id="expiry"
          type="text"
          placeholder="04/26"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="cvc" style={labelStyle}>CVC</label>
        <input
          id="cvc"
          type="text"
          placeholder="123"
          value={cvc}
          onChange={(e) => setCvc(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="name" style={labelStyle}>Name on Card</label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </div>
      <button type="submit" style={buttonStyle}>Pay now</button>
    </form>
  );
};

// Inline style objects – replace with a CSS module or styled‑components for a polished UI.
const formStyle: React.CSSProperties = {
  maxWidth: "400px",
  margin: "0 auto",
  padding: "1rem",
  background: "rgba(255,255,255,0.9)",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};
const headingStyle: React.CSSProperties = { textAlign: "center", marginBottom: "1rem" };
const fieldStyle: React.CSSProperties = { marginBottom: "0.75rem" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "0.25rem", fontWeight: 600 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: "4px"
};
const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "1rem"
};
const errorStyle: React.CSSProperties = { color: "#b91c1c", marginBottom: "0.5rem", textAlign: "center" };

export default PaymentForm;
