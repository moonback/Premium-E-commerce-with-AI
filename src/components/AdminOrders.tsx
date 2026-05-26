import React from 'react';
import KitchenOrders from './KitchenOrders';

export default function AdminOrders() {
  return (
    <div className="p-4 border-t border-ink/10 bg-soft-green/20">
      <h3 className="text-lg font-serif mb-2">Commandes en cours</h3>
      <KitchenOrders />
    </div>
  );
}
