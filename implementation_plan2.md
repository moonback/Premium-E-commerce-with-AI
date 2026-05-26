# Multi‑Step Checkout Implementation Plan

## Goal
Replace the current single‑button checkout flow with a three‑step tunnel:
1. **Cart Review** – list items, adjust quantities, remove, show subtotal.
2. **Client & Delivery** – collect name, email, phone, address (optional) and let the user choose **Click & Collect** or **Coursier**.
3. **Payment** – simple mock payment form, create an order in Supabase, clear the cart and show an order‑confirmation page.

All UI will keep the premium design language (glass‑morphism, subtle animations) used elsewhere.

## User Review Required
- **Payment handling** – mock UI only (Option A) or real provider integration later (Option B)?
- **Delivery options** – binary toggle only, or need extra fields (pickup location, fees, time windows)?
- **Order confirmation** – separate route `/order/:id` or modal overlay?

## Open Questions
- Persist checkout info in Supabase before payment or keep it client‑side?
- Should the cart drawer’s "Proceed to checkout" button become a `<Link to="/checkout">` or a programmatic navigation?
- Any mobile‑specific UX tweaks (vertical stepper, full‑screen on mobile)?

## Proposed Changes
### New Files / Components
- `src/pages/Checkout.tsx` – main checkout page with stepper logic.
- `src/components/CheckoutStepper.tsx` – visual stepper (progress bar, step titles, navigation buttons).
- `src/components/CartReview.tsx` – extracted cart UI (same as current `CartDrawer` content) for step 1.
- `src/components/ClientDeliveryForm.tsx` – form for user info and delivery method.
- `src/components/PaymentForm.tsx` – mock payment fields + submit button.
- `src/pages/OrderConfirmation.tsx` *(optional)* – confirmation screen.

### Store Updates (`src/store.ts`)
```ts
export interface CheckoutInfo {
  clientInfo: { name: string; email: string; phone?: string; address?: string };
  deliveryMethod: 'clickCollect' | 'courier';
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
}
```
Add actions: `setClientInfo`, `setDeliveryMethod`, `setPaymentStatus`, `resetCheckout`.

### Router
Add routes for `/checkout` (and optional `/order/:id`).

### UI / Styling
- Use existing color tokens (`bg-ink`, `text-ink`, `glass`).
- Animate step transitions with `motion/react` (200‑300 ms slide/fade).
- Mobile‑first layout: vertical stepper, full‑width forms.

## Verification Plan
1. Run `npm run dev`.
2. Add a product to cart, click **Proceed to checkout** → lands on `/checkout` step 1.
3. Verify cart items, quantity updates, remove works.
4. Attempt to continue without filling client info → validation blocks.
5. Fill client form, choose delivery method, continue to payment.
6. Fill mock card fields, click **Pay now** → order inserted in Supabase, cart cleared, redirected to confirmation.
7. Test on mobile screen width (< 768 px) – stepper stacks vertically, forms remain usable.

## Next Steps
1. Create `task.md` with a checklist.
2. Await your answers to the open questions.
3. Once approved, implement the files and update the store.
