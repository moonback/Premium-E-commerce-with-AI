import React from 'react';
import { Package, Users, ShoppingCart, BarChart3, Settings } from 'lucide-react';

export default function Admin() {
  const stats = [
    { label: "Today's Sales", value: "$4,250.00", change: "+12.5%" },
    { label: "Active Orders", value: "34", change: "-2.1%" },
    { label: "Total Customers", value: "1,452", change: "+5.4%" },
    { label: "Low Stock Items", value: "8", change: "Requires action" }
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-ink/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <span className="font-bold text-2xl font-serif italic text-ink tracking-tighter">Véridian Admin</span>
        </div>

        <nav className="flex flex-col gap-2">
          {[ 
            { icon: BarChart3, label: "Overview", active: true },
            { icon: Package, label: "Products" },
            { icon: ShoppingCart, label: "Orders" },
            { icon: Users, label: "Customers" },
            { icon: Settings, label: "Settings" }
          ].map((item, i) => (
            <button 
              key={i}
              className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${
                item.active ? 'bg-ink text-white' : 'text-ink/60 hover:bg-soft-green hover:text-ink'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-light font-serif tracking-tight mb-2">Overview</h1>
          <p className="text-ink/60">Manage your store, view metrics, and adjust settings.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 border border-ink/10">
              <p className="text-ink/50 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-3xl font-serif tracking-tight mb-2">{stat.value}</p>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 inline-block border ${
                stat.change.startsWith('+') ? 'border-ink/20 text-ink bg-soft-green' : 'border-ink/10 text-ink/60'
              }`}>
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-ink/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/10 bg-soft-green/30">
            <h2 className="font-serif">Recent Orders</h2>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-soft-green/20 text-ink/50 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-bold tracking-widest">Order ID</th>
                <th className="px-6 py-3 font-bold tracking-widest">Customer</th>
                <th className="px-6 py-3 font-bold tracking-widest">Status</th>
                <th className="px-6 py-3 font-bold tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-soft-green/30">
                  <td className="px-6 py-4 text-ink/60">#{10243 + i}</td>
                  <td className="px-6 py-4 font-serif">{['Alex Morgan', 'Sarah Chen', 'Michael Doe', 'Emma Wilson', 'James Smith'][i-1]}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-[10px] uppercase tracking-widest font-bold border border-ink/20 bg-ink text-white">Completed</span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{(124.50 + i * 12).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
