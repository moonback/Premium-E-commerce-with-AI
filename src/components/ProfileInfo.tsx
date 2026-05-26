// src/components/ProfileInfo.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';

export default function ProfileInfo() {
  const { user, loyaltyPoints } = useStore();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile details when component mounts or user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('address, phone, address_line1, address_line2, city, postal_code, country')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setAddress(data?.address ?? '');
        setPhone(data?.phone ?? '');
        setAddressLine1(data?.address_line1 ?? '');
        setAddressLine2(data?.address_line2 ?? '');
        setCity(data?.city ?? '');
        setPostalCode(data?.postal_code ?? '');
        setCountry(data?.country ?? '');
      } catch (e: any) {
        console.error('Failed to fetch profile', e);
        setError('Impossible de charger les informations du profil.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    setSaving(true);
    setError(null);
    try {
      const { error: updError } = await supabase
        .from('profiles')
        .update({ address, phone, address_line1: addressLine1, address_line2: addressLine2, city, postal_code: postalCode, country })
        .eq('id', user.id);
      if (updError) throw updError;
      // Optional: show success toast or UI feedback
    } catch (e: any) {
      console.error('Failed to update profile', e);
      setError("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 border border-ink/10 bg-transparent animate-pulse">
        <div className="h-24 bg-ink/5 w-full mb-4" />
        <div className="h-12 bg-ink/5 w-1/2" />
      </div>
    );
  }

  return (
    <div className="p-8 border border-ink/10 bg-transparent mb-8">
      <h2 className="text-2xl font-serif mb-6">Informations personnelles</h2>
      {error && (
        <p className="text-red-600 mb-4" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="address">
            Adresse
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            Téléphone
          </label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="addressLine1">
            Adresse ligne 1
          </label>
          <input
            id="addressLine1"
            type="text"
            value={addressLine1}
            onChange={e => setAddressLine1(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="addressLine2">
            Adresse ligne 2
          </label>
          <input
            id="addressLine2"
            type="text"
            value={addressLine2}
            onChange={e => setAddressLine2(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city">
            Ville
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="postalCode">
            Code postal
          </label>
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="country">
            Pays
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-bg text-ink"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 rounded bg-primary text-white hover:bg-primary/80 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
