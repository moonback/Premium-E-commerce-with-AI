// src/components/ClientDeliveryForm.tsx
import React, { useState } from 'react';
import { useStore } from '../store';
import { motion } from 'motion/react';

export default function ClientDeliveryForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { setClientInfo, setDeliveryMethod, checkout } = useStore();
  const [clientInfo, setInfo] = useState({ name: '', email: '', phone: '', address: '' });
  const [deliveryMethod, setMethod] = useState<'clickCollect' | 'courier'>('courier');
  const [pickupLocation, setPickupLocation] = useState('');
  const [fee, setFee] = useState('0');
  const [timeSlot, setTimeSlot] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save client info
    setClientInfo(clientInfo);
    // Save delivery method and extra fields as part of clientInfo for now
    setDeliveryMethod(deliveryMethod);
    // Persist extra fields in clientInfo (optional, can be stored in supabase later)
    setClientInfo({ ...clientInfo, pickupLocation, fee, timeSlot });
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-serif">Informations client & livraison</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          placeholder="Nom"
          value={clientInfo.name}
          onChange={(e) => setInfo({ ...clientInfo, name: e.target.value })}
          required
          className="p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={clientInfo.email}
          onChange={(e) => setInfo({ ...clientInfo, email: e.target.value })}
          required
          className="p-2 border rounded"
        />
        <input
          type="tel"
          placeholder="Téléphone"
          value={clientInfo.phone}
          onChange={(e) => setInfo({ ...clientInfo, phone: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Adresse de livraison"
          value={clientInfo.address}
          onChange={(e) => setInfo({ ...clientInfo, address: e.target.value })}
          className="p-2 border rounded"
        />
        <label className="flex items-center">
          <input
            type="radio"
            name="deliveryMethod"
            value="courier"
            checked={deliveryMethod === 'courier'}
            onChange={() => setMethod('courier')}
          />
          <span className="ml-2">Coursier</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="deliveryMethod"
            value="clickCollect"
            checked={deliveryMethod === 'clickCollect'}
            onChange={() => setMethod('clickCollect')}
          />
          <span className="ml-2">Click & Collect</span>
        </label>
        {/* Extra fields for Click & Collect */}
        {deliveryMethod === 'clickCollect' && (
          <div className="grid gap-2">
            <input
              type="text"
              placeholder="Lieu de retrait"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              required
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Frais de retrait"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Créneau horaire (ex: 14:00-16:00)"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
        )}
        <div className="flex justify-between mt-4">
          <button type="button" onClick={onBack} className="px-4 py-2 bg-ink/10 text-ink rounded">Retour</button>
          <button type="submit" className="px-4 py-2 bg-ink text-bg rounded">Continuer</button>
        </div>
      </form>
    </motion.div>
  );
}
