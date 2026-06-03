import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useStore } from '../store';

interface DiscountCodeInputProps {
  orderTotal: number;
  onDiscountApplied: (code: string, amount: number) => void;
  onDiscountRemoved: () => void;
  appliedCode?: string;
  appliedAmount?: number;
}

export default function DiscountCodeInput({
  orderTotal,
  onDiscountApplied,
  onDiscountRemoved,
  appliedCode,
  appliedAmount = 0,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const { cart } = useStore();

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Veuillez entrer un code promo');
      return;
    }

    setIsValidating(true);
    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      let token: string | null = null;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token ?? null;
      }

      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Impossible de valider le code promo.');
      }

      if (data.valid) {
        onDiscountApplied(data.code, data.discountAmount);
        toast.success(`Code ${data.code} appliqué ! -${data.discountAmount.toFixed(2)}€`);
        setCode('');
      } else {
        toast.error(data.error || 'Code promo invalide');
      }
    } catch (err: any) {
      console.error('Failed to validate discount code', err);
      toast.error(err.message || 'Impossible de valider le code promo');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onDiscountRemoved();
    toast.success('Code promo retiré');
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-600/30 bg-emerald-50/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600/10">
            <Check className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-900">
              {appliedCode}
            </p>
            <p className="text-xs text-emerald-700">
              -{appliedAmount.toFixed(2)}€ économisés
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="rounded-full p-1.5 text-emerald-700 transition-colors hover:bg-emerald-600/10"
          aria-label="Retirer le code promo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-ink/60">
        Code promo
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="WELCOME10"
            className="w-full rounded-full border border-ink/20 bg-transparent py-3 pl-10 pr-4 text-sm uppercase tracking-wider text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
            disabled={isValidating}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
          className="rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bg transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isValidating ? 'Validation...' : 'Appliquer'}
        </button>
      </div>
    </div>
  );
}
