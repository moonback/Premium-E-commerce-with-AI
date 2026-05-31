import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Address } from '../types';
import { Edit2, Trash2, Star, MapPin, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Modal ────────────────────────────────────────────────────────────────────

type AddressFormData = Omit<Address, 'id' | 'user_id'>;

const EMPTY_ADDRESS_FORM: Partial<AddressFormData> = {};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
}

const AddressModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const formInitialData = initialData ?? EMPTY_ADDRESS_FORM;
  const [label, setLabel]     = useState(formInitialData.label ?? '');
  const [line1, setLine1]     = useState(formInitialData.address_line1 ?? '');
  const [line2, setLine2]     = useState(formInitialData.address_line2 ?? '');
  const [city, setCity]       = useState(formInitialData.city ?? '');
  const [postal, setPostal]   = useState(formInitialData.postal_code ?? '');
  const [country, setCountry] = useState(formInitialData.country ?? '');

  // Sync fields whenever the modal opens with new initialData (edit mode)
  useEffect(() => {
    setLabel(formInitialData.label ?? '');
    setLine1(formInitialData.address_line1 ?? '');
    setLine2(formInitialData.address_line2 ?? '');
    setCity(formInitialData.city ?? '');
    setPostal(formInitialData.postal_code ?? '');
    setCountry(formInitialData.country ?? '');
  }, [isOpen, formInitialData]);

  const reset = () => {
    setLabel(''); setLine1(''); setLine2('');
    setCity(''); setPostal(''); setCountry('');
  };

  const handleSubmit = () => {
    if (!line1.trim() || !city.trim() || !postal.trim() || !country.trim()) {
      return alert('Veuillez remplir tous les champs obligatoires (*).');
    }
    onSubmit({
      label: label.trim(),
      address_line1: line1.trim(),
      address_line2: line2.trim() || undefined,
      city: city.trim(),
      postal_code: postal.trim(),
      country: country.trim(),
      is_default: formInitialData.is_default ?? false,
    });
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  const isEdit = Boolean(formInitialData.address_line1);
  const inputCls = 'w-full p-3 border border-ink/10 rounded-md bg-bg text-ink text-sm focus:outline-none focus:border-accent/60 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass rounded-xl shadow-2xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-serif">
                {isEdit ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
              </h2>
            </div>

            <div className="grid gap-3">
              <input className={inputCls} placeholder="Libellé (ex: Maison, Bureau)" value={label} onChange={e => setLabel(e.target.value)} />
              <input className={inputCls} placeholder="Adresse ligne 1 *" value={line1} onChange={e => setLine1(e.target.value)} required />
              <input className={inputCls} placeholder="Adresse ligne 2 (optionnel)" value={line2} onChange={e => setLine2(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Ville *" value={city} onChange={e => setCity(e.target.value)} required />
                <input className={inputCls} placeholder="Code postal *" value={postal} onChange={e => setPostal(e.target.value)} required />
              </div>
              <input className={inputCls} placeholder="Pays *" value={country} onChange={e => setCountry(e.target.value)} required />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm border border-ink/20 rounded-md hover:bg-ink/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 text-sm bg-accent text-bg rounded-md hover:bg-accent/90 transition-colors font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Address Card ─────────────────────────────────────────────────────────────

const AddressCard: React.FC<{ address: Address }> = ({ address }) => {
  const { setDefaultAddress, deleteAddress, updateAddress } = useStore();
  const [editing, setEditing] = useState(false);

  const handleEditSubmit = (data: AddressFormData) => {
    updateAddress(address.id, data);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`relative p-5 border rounded-xl glass transition-all ${
        address.is_default ? 'border-accent/50 shadow-md' : 'border-ink/10 hover:border-ink/20'
      }`}
    >
      {/* Default badge */}
      {address.is_default && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent">
          <Star className="w-3.5 h-3.5 fill-accent" />
          Par défaut
        </div>
      )}

      {/* Address content */}
      <div className="pr-24">
        {address.label && (
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">{address.label}</p>
        )}
        <p className="text-sm font-medium">{address.address_line1}</p>
        {address.address_line2 && <p className="text-sm text-ink/70">{address.address_line2}</p>}
        <p className="text-sm text-ink/70">{address.postal_code} {address.city}</p>
        <p className="text-sm text-ink/70">{address.country}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-ink/10">
        {!address.is_default && (
          <button
            onClick={() => setDefaultAddress(address.id)}
            className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors flex items-center gap-1"
          >
            <Star className="w-3.5 h-3.5" /> Définir par défaut
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="ml-auto text-xs text-ink/60 hover:text-ink flex items-center gap-1 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" /> Modifier
        </button>
        <button
          onClick={() => confirm('Supprimer cette adresse ?') && deleteAddress(address.id)}
          className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Supprimer
        </button>
      </div>

      <AddressModal
        isOpen={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleEditSubmit}
        initialData={address}
      />
    </motion.div>
  );
};

// ─── AddressBook (container) ──────────────────────────────────────────────────

const AddressBook: React.FC = () => {
  const { addresses, fetchAddresses, addAddress } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div className="p-8 border border-ink/10 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif">Mes adresses</h2>
        <button
          id="add-address-btn"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-ink/20 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-bg transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {addresses && addresses.length > 0 ? (
        <motion.div className="grid gap-4" layout>
          <AnimatePresence>
            {addresses.map(addr => (
              <AddressCard key={addr.id} address={addr} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-40 border-2 border-dashed border-ink/10 rounded-lg">
          <MapPin className="w-8 h-8 text-ink/20 mb-3" />
          <p className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-1">Aucune adresse</p>
          <p className="text-xs text-ink/50 italic">Ajoutez une adresse pour accélérer vos commandes.</p>
        </div>
      )}

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => { addAddress(data); setModalOpen(false); }}
      />
    </div>
  );
};

export default AddressBook;
