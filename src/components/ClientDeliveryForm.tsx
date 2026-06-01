// src/components/ClientDeliveryForm.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, MapPin, Zap, Globe, Package, Loader, CheckCircle2 } from 'lucide-react';
import { CheckoutClientInfo, CheckoutDeliveryMethod, ShippingCarrier, CarrierType } from '../types';
import { useShippingCarriers } from '../hooks/useShippingCarriers';

type ClientDeliveryFormProps = {
  onNext: () => void;
  onBack: () => void;
  onValid?: (clientInfo: CheckoutClientInfo, deliveryMethod: CheckoutDeliveryMethod) => void;
};

const CARRIER_ICONS: Record<CarrierType, React.ElementType> = {
  home: Truck,
  relay: MapPin,
  express: Zap,
  international: Globe,
};

function formatPrice(n: number) {
  if (n === 0) return 'Gratuit';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function delayLabel(min: number, max: number) {
  if (min === max) return `${min} j. ouvré${min > 1 ? 's' : ''}`;
  return `${min}–${max} j. ouvrés`;
}

export default function ClientDeliveryForm({ onNext, onBack, onValid }: ClientDeliveryFormProps) {
  const { setClientInfo, setDeliveryMethod, addresses, fetchAddresses, user, cart } = useStore();
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const { carriers, isLoading: carriersLoading, getEffectivePrice } = useShippingCarriers(cartTotal);

  // Load saved addresses on mount
  useEffect(() => { fetchAddresses(); }, []);

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

  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');
  const [deliveryMethod, setMethod] = useState<CheckoutDeliveryMethod>('courier');
  const [pickupLocation, setPickupLocation] = useState('');
  const [fee, setFee] = useState('0');
  const [timeSlot, setTimeSlot] = useState('');

  // Pre-select first carrier once loaded
  useEffect(() => {
    if (carriers.length > 0 && !selectedCarrierId) {
      setSelectedCarrierId(carriers[0].id);
    }
  }, [carriers]);

  // Sync delivery method with carrier type
  useEffect(() => {
    const carrier = carriers.find(c => c.id === selectedCarrierId);
    if (!carrier) return;
    setMethod(carrier.carrier_type === 'relay' ? 'clickCollect' : 'courier');
    setFee(String(getEffectivePrice(carrier)));
  }, [selectedCarrierId, carriers]);

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

  const selectedCarrier = carriers.find(c => c.id === selectedCarrierId);
  const effectivePrice = selectedCarrier ? getEffectivePrice(selectedCarrier) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enrichedClientInfo: CheckoutClientInfo = {
      ...clientInfo,
      pickupLocation: selectedCarrier?.carrier_type === 'relay' ? pickupLocation : undefined,
      fee: String(effectivePrice),
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
              aria-label="Utiliser une adresse enregistrée"
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

        {/* ── Personal info ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkout-name" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Nom Complet</label>
            <input id="checkout-name" type="text" autoComplete="shipping name" placeholder="Votre nom"
              value={clientInfo.name} onChange={e => setInfo({ ...clientInfo, name: e.target.value })}
              required className={inputClass} />
          </div>
          <div>
            <label htmlFor="checkout-email" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Email</label>
            <input id="checkout-email" type="email" autoComplete="email" placeholder="votre@email.com"
              value={clientInfo.email} onChange={e => setInfo({ ...clientInfo, email: e.target.value })}
              required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkout-phone" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Téléphone</label>
            <input id="checkout-phone" type="tel" autoComplete="shipping tel" placeholder="+33 6 00 00 00 00"
              value={clientInfo.phone} onChange={e => setInfo({ ...clientInfo, phone: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="checkout-address-line1" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Adresse Ligne 1</label>
            <input id="checkout-address-line1" type="text" autoComplete="shipping address-line1" placeholder="12 rue de la Paix"
              value={clientInfo.addressLine1 || ''} onChange={e => setInfo({ ...clientInfo, addressLine1: e.target.value })}
              required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkout-address-line2" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Adresse Ligne 2 (Optionnel)</label>
            <input id="checkout-address-line2" type="text" autoComplete="shipping address-line2" placeholder="Appartement, bâtiment..."
              value={clientInfo.addressLine2 || ''} onChange={e => setInfo({ ...clientInfo, addressLine2: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="checkout-city" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Ville</label>
            <input id="checkout-city" type="text" autoComplete="shipping address-level2" placeholder="Paris"
              value={clientInfo.city || ''} onChange={e => setInfo({ ...clientInfo, city: e.target.value })}
              required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkout-postal-code" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Code Postal</label>
            <input id="checkout-postal-code" type="text" autoComplete="shipping postal-code" placeholder="75001"
              value={clientInfo.postalCode || ''} onChange={e => setInfo({ ...clientInfo, postalCode: e.target.value })}
              required className={inputClass} />
          </div>
          <div>
            <label htmlFor="checkout-country" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Pays</label>
            <input id="checkout-country" type="text" autoComplete="shipping country" placeholder="France"
              value={clientInfo.country || ''} onChange={e => setInfo({ ...clientInfo, country: e.target.value })}
              required className={inputClass} />
          </div>
        </div>

        {/* ── Carrier selection ── */}
        <div className="pt-2">
          <label className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-3">
            Mode de livraison
          </label>

          {carriersLoading ? (
            <div className="flex items-center gap-2 py-4 text-ink/40 text-sm">
              <Loader size={14} className="animate-spin" />
              Chargement des transporteurs...
            </div>
          ) : carriers.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-ink/40 text-sm border border-dashed border-ink/20 px-4">
              <Package size={14} />
              Aucun transporteur disponible
            </div>
          ) : (
            <div className="space-y-2">
              {carriers.map(carrier => {
                const Icon = CARRIER_ICONS[carrier.carrier_type] ?? Truck;
                const price = getEffectivePrice(carrier);
                const isFree = price === 0;
                const isSelected = selectedCarrierId === carrier.id;

                return (
                  <button
                    key={carrier.id}
                    type="button"
                    onClick={() => setSelectedCarrierId(carrier.id)}
                    className={`w-full text-left border transition-all duration-200 p-4 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isSelected
                        ? 'border-ink bg-soft-green/30'
                        : 'border-ink/10 hover:border-ink/30 hover:bg-ink/5'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-ink text-bg' : 'bg-ink/5 text-ink/50'
                    }`}>
                      <Icon size={16} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink">
                          {carrier.name}
                        </span>
                        {carrier.free_above != null && cartTotal >= carrier.free_above && (
                          <span className="text-[9px] uppercase tracking-[0.15em] bg-emerald-50 text-emerald-600 px-1.5 py-0.5">
                            Livraison offerte
                          </span>
                        )}
                      </div>
                      {carrier.description && (
                        <p className="text-[11px] text-ink/50 mt-0.5 line-clamp-1">{carrier.description}</p>
                      )}
                      <p className="text-[10px] text-ink/40 mt-0.5">
                        ⏱ {delayLabel(carrier.min_days, carrier.max_days)}
                        {carrier.free_above != null && !isFree && (
                          <span className="ml-2 text-accent">
                            · Gratuit dès {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(carrier.free_above)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold ${isFree ? 'text-emerald-600' : 'text-ink'}`}>
                        {formatPrice(price)}
                      </span>
                    </div>

                    {/* Check */}
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-ink shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Extra fields for relay pickup ── */}
        <AnimatePresence>
          {selectedCarrier?.carrier_type === 'relay' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-6 pt-4 border-t border-ink/10 overflow-hidden"
            >
              <div>
                <label htmlFor="checkout-pickup-location" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
                  Point Relais
                </label>
                <input
                  id="checkout-pickup-location"
                  type="text"
                  autoComplete="off"
                  placeholder="Ex: Tabac Presse — 12 rue de la Paix, Paris"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  required
                  className={inputClass}
                />
                <p className="text-[10px] text-ink/40 mt-1">
                  Indiquez le nom et l'adresse du point relais choisi
                </p>
              </div>
              <div>
                <label htmlFor="checkout-time-slot" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">
                  Créneau de retrait (optionnel)
                </label>
                <input
                  id="checkout-time-slot"
                  type="text"
                  autoComplete="off"
                  placeholder="Ex: Lun–Sam 9h–19h"
                  value={timeSlot}
                  onChange={e => setTimeSlot(e.target.value)}
                  className={inputClass}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation ── */}
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
            Continuer →
          </button>
        </div>
      </form>
    </motion.div>
  );
}

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
  const deliveryOptionClass = "p-5 text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

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
              aria-label="Utiliser une adresse enregistrée"
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
            <label htmlFor="checkout-name" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Nom Complet</label>
            <input
              id="checkout-name"
              type="text"
              autoComplete="shipping name"
              placeholder="Votre nom"
              value={clientInfo.name}
              onChange={(e) => setInfo({ ...clientInfo, name: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="checkout-email" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Email</label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
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
            <label htmlFor="checkout-phone" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Téléphone</label>
            <input
              id="checkout-phone"
              type="tel"
              autoComplete="shipping tel"
              placeholder="+33 6 00 00 00 00"
              value={clientInfo.phone}
              onChange={(e) => setInfo({ ...clientInfo, phone: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="checkout-address-line1" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Adresse Ligne 1</label>
            <input
              id="checkout-address-line1"
              type="text"
              autoComplete="shipping address-line1"
              placeholder="12 rue de la Paix"
              value={clientInfo.addressLine1 || ''}
              onChange={(e) => setInfo({ ...clientInfo, addressLine1: e.target.value })}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkout-address-line2" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Adresse Ligne 2 (Optionnel)</label>
            <input
              id="checkout-address-line2"
              type="text"
              autoComplete="shipping address-line2"
              placeholder="Appartement, bâtiment..."
              value={clientInfo.addressLine2 || ''}
              onChange={(e) => setInfo({ ...clientInfo, addressLine2: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="checkout-city" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Ville</label>
            <input
              id="checkout-city"
              type="text"
              autoComplete="shipping address-level2"
              placeholder="Paris"
              value={clientInfo.city || ''}
              onChange={(e) => setInfo({ ...clientInfo, city: e.target.value })}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="checkout-postal-code" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Code Postal</label>
            <input
              id="checkout-postal-code"
              type="text"
              autoComplete="shipping postal-code"
              placeholder="75001"
              value={clientInfo.postalCode || ''}
              onChange={(e) => setInfo({ ...clientInfo, postalCode: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="checkout-country" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Pays</label>
            <input
              id="checkout-country"
              type="text"
              autoComplete="shipping country"
              placeholder="France"
              value={clientInfo.country || ''}
              onChange={(e) => setInfo({ ...clientInfo, country: e.target.value })}
              required
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
              className={`${deliveryOptionClass} ${
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
              className={`${deliveryOptionClass} ${
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
              <label htmlFor="checkout-pickup-location" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Lieu de Retrait</label>
              <input
                id="checkout-pickup-location"
                type="text"
                autoComplete="off"
                placeholder="Ex: Boutique Paris Marais"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="checkout-pickup-fee" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Frais de Retrait (€)</label>
                <input
                  id="checkout-pickup-fee"
                  type="number"
                  placeholder="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="checkout-time-slot" className="block text-[10px] uppercase tracking-widest font-bold text-ink/50 mb-1">Créneau Horaire</label>
                <input
                  id="checkout-time-slot"
                  type="text"
                  autoComplete="off"
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
