// src/components/ClientDeliveryForm.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { CheckoutClientInfo, CheckoutDeliveryMethod } from '../types';

type ClientDeliveryFormProps = {
  onNext: () => void;
  onBack: () => void;
  onValid?: (clientInfo: CheckoutClientInfo, deliveryMethod: CheckoutDeliveryMethod) => void;
};

export default function ClientDeliveryForm({ onNext, onBack, onValid }: ClientDeliveryFormProps) {
  const { setClientInfo, setDeliveryMethod, addresses, fetchAddresses, user } = useStore();

  // Load saved addresses on mount
  useEffect(() => { fetchAddresses(); }, []);

  // Build initial state from the default address when present
  const defaultAddr = addresses.find(a => a.is_default) ?? addresses[0];

  const [clientInfo, setInfo] = useState<CheckoutClientInfo>({
    name: '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: defaultAddr?.address_line1 ?? '',
    addressLine1: defaultAddr?.address_line1 ?? '',
    addressLine2: defaultAddr?.address_line2 ?? '',
    city: defaultAddr?.city ?? '',
    postalCode: defaultAddr?.postal_code ?? '',
    country: defaultAddr?.country ?? '',
  });
  const [deliveryMethod, setMethod] = useState<CheckoutDeliveryMethod>('courier');
  const [pickupLocation, setPickupLocation] = useState('');
  const [fee, setFee] = useState('0');
  const [timeSlot, setTimeSlot] = useState('');

  // When addresses load, pre-fill if fields are still empty
  useEffect(() => {
    const def = addresses.find(a => a.is_default) ?? addresses[0];
    if (def && !clientInfo.addressLine1) {
      setInfo(prev => ({
        ...prev,
        address: def.address_line1,
        addressLine1: def.address_line1,
        addressLine2: def.address_line2 ?? '',
        city: def.city,
        postalCode: def.postal_code,
        country: def.country,
      }));
    }
  }, [addresses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enrichedClientInfo: CheckoutClientInfo = {
      ...clientInfo,
      pickupLocation,
      fee,
      timeSlot,
    };

    setDeliveryMethod(deliveryMethod);
    setClientInfo(enrichedClientInfo);
    onValid?.(enrichedClientInfo, deliveryMethod);
    onNext();
  };

  const inputClass = "w-full bg-transparent border-b border-ink/20 px-0 py-3 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full max-w-xl mx-auto bg-bg border border-ink/10 shadow-2xl p-8 space-y-8"
    >
      <div>
        <h2 className="text-3xl font-serif text-ink tracking-tight text-center">Informations de Livraison</h2>
        <p className="text-ink/60 text-xs uppercase tracking-widest font-bold text-center mt-1">
          Renseignez vos coordonnées de livraison
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Saved address quick-select ── */}
        {addresses.length > 0 && (
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
              Utiliser une adresse enregistrée
            </label>
            <select
              className="w-full bg-transparent border-b border-ink/20 py-3 text-sm focus:outline-none focus:border-ink transition-colors text-ink"
              onChange={e => {
                const addr = addresses.find(a => a.id === e.target.value);
                if (addr) {
                  setInfo(prev => ({
                    ...prev,
                    address: addr.address_line1,
                    addressLine1: addr.address_line1,
                    addressLine2: addr.address_line2 ?? '',
                    city: addr.city,
                    postalCode: addr.postal_code,
                    country: addr.country,
                  }));
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>— Sélectionner —</option>
              {addresses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.label ? `${a.label} — ` : ''}{a.address_line1}, {a.city}
                  {a.is_default ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Nom Complet</label>
            <input
              type="text"
              placeholder="Votre nom"
              value={clientInfo.name}
              onChange={(e) => setInfo({ ...clientInfo, name: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={clientInfo.email}
              onChange={(e) => setInfo({ ...clientInfo, email: e.target.value })}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Téléphone</label>
            <input
              type="tel"
              placeholder="+33 6 00 00 00 00"
              value={clientInfo.phone}
              onChange={(e) => setInfo({ ...clientInfo, phone: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Adresse Ligne 1</label>
            <input
              type="text"
              placeholder="12 rue de la Paix"
              value={clientInfo.addressLine1 || ''}
              onChange={(e) => setInfo({ ...clientInfo, addressLine1: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Adresse Ligne 2 (Optionnel)</label>
            <input
              type="text"
              placeholder="Appartement, bâtiment..."
              value={clientInfo.addressLine2 || ''}
              onChange={(e) => setInfo({ ...clientInfo, addressLine2: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Ville</label>
            <input
              type="text"
              placeholder="Paris"
              value={clientInfo.city || ''}
              onChange={(e) => setInfo({ ...clientInfo, city: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Code Postal</label>
            <input
              type="text"
              placeholder="75001"
              value={clientInfo.postalCode || ''}
              onChange={(e) => setInfo({ ...clientInfo, postalCode: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Pays</label>
            <input
              type="text"
              placeholder="France"
              value={clientInfo.country || ''}
              onChange={(e) => setInfo({ ...clientInfo, country: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-4">
          <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-3">Mode de livraison</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMethod('courier')}
              className={`p-5 text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                deliveryMethod === 'courier'
                  ? 'border-ink bg-soft-green/30'
                  : 'border-ink/10 bg-transparent text-ink/60 hover:border-ink/30 hover:bg-ink/5'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-widest block">Coursier</span>
              <span className="text-[11px] text-ink/50 mt-2 block font-sans">Livraison à domicile rapide</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('clickCollect')}
              className={`p-5 text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                deliveryMethod === 'clickCollect'
                  ? 'border-ink bg-soft-green/30'
                  : 'border-ink/10 bg-transparent text-ink/60 hover:border-ink/30 hover:bg-ink/5'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-widest block">Click & Collect</span>
              <span className="text-[11px] text-ink/50 mt-2 block font-sans">Retrait gratuit en magasin</span>
            </button>
          </div>
        </div>

        {/* Extra fields for Click & Collect */}
        {deliveryMethod === 'clickCollect' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="grid gap-6 pt-4 border-t border-ink/10"
          >
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Lieu de Retrait</label>
              <input
                type="text"
                placeholder="Ex: Boutique Paris Marais"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Frais de Retrait (€)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Créneau Horaire</label>
                <input
                  type="text"
                  placeholder="Ex: 14:00 - 16:00"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-ink/10">
          <button 
            type="button" 
            onClick={onBack} 
            className="px-6 py-4 border border-ink text-ink bg-transparent font-bold text-xs uppercase tracking-widest hover:bg-ink/5 transition-colors cursor-pointer"
          >
            ← Retour
          </button>
          
          <button 
            type="submit" 
            className="px-6 py-4 bg-ink text-bg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors cursor-pointer"
          >
            Continuer
          </button>
        </div>
      </form>
    </motion.div>
  );
}
