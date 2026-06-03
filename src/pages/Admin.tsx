import React, { useState, useCallback } from 'react';
import { useStore } from '../store';
import { Category, Product, Spec } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import AdminOrdersList from '../components/AdminOrdersList';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminCustomers from '../components/AdminCustomers';
import AdminInventory from '../components/AdminInventory';
import AdminSettings from '../components/AdminSettings';
import AdminActivityLog from '../components/AdminActivityLog';
import AdminDashboard from '../components/AdminDashboard';
import AdminDiscounts from '../components/AdminDiscounts';
import AdminMarginAnalysis from '../components/AdminMarginAnalysis';
import MegaMenuManager from '../components/admin/MegaMenuManager';
import AdminShipping from '../components/admin/AdminShipping';
import CategoryModal from '../components/CategoryModal';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminStatsCards from '../components/admin/AdminStatsCards';
import ProductsTable from '../components/admin/ProductsTable';
import ProductForm from '../components/admin/ProductForm';
import CategoriesManager from '../components/admin/CategoriesManager';
import { Dialog } from '../components/ui/Dialog';
import { getErrorMessage } from '../lib/errors';

type EditableProduct = Partial<Omit<Product, 'effects' | 'specs'>> & {
  effects?: string[] | string;
  specs?: Spec[] | string;
  category?: string;
};

// Unused type removed (was ProductUpsertPayload)

const parseListField = (value: string[] | string | undefined): string[] => {
  if (Array.isArray(value)) return value;
  return value?.split(',').map(item => item.trim()).filter(Boolean) ?? [];
};

const parseSpecsField = (value: Spec[] | string | undefined): Spec[] => {
  if (Array.isArray(value)) return value;
  return value?.split(';;').map(item => {
    const [title = '', content = ''] = item.split('::');
    return { title: title.trim(), content: content.trim() };
  }).filter(spec => spec.title || spec.content) ?? [];
};

export default function Admin() {
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const fetchProducts = useStore((state) => state.fetchProducts);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct>({});
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // ── Confirmation dialog state ────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  const openConfirm = useCallback(
    (title: string, description: string, onConfirm: () => void) => {
      setConfirmDialog({ open: true, title, description, onConfirm });
    },
    []
  );
  const closeConfirm = () => setConfirmDialog(s => ({ ...s, open: false }));

  const [todaySales, setTodaySales] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);

  React.useEffect(() => {
    if (supabase) {
      const fetchStats = async () => {
        try {
          // Fetch all orders
          const { data: allOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*');

          if (!ordersError && allOrders) {
            // 1. Calculate today's sales
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayOrders = allOrders.filter(o => new Date(o.created_at) >= startOfToday);
            const salesSum = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            setTodaySales(salesSum);

            // 2. Active orders count (status is not Livrée and not Terminée)
            const active = allOrders.filter(o => !['Livrée', 'Terminée'].includes(o.status));
            setActiveOrdersCount(active.length);
          }

          // 3. Fetch profiles count
          const { count: profileCount, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          if (!profileError && profileCount !== null) {
            setTotalCustomers(profileCount);
          } else if (allOrders) {
            const uniqueUsers = new Set(allOrders.map(o => o.user_id));
            setTotalCustomers(uniqueUsers.size);
          }
        } catch (e) {
          console.error("Error fetching stats:", e);
        }
      };

      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const stats = [
    { 
      label: "Ventes du Jour", 
      value: `${todaySales.toFixed(2)}€`, 
      change: todaySales > 0 ? "Actif" : "0%" 
    },
    { 
      label: "Commandes Actives", 
      value: activeOrdersCount.toString(), 
      change: activeOrdersCount > 0 ? "En cours" : "Aucune" 
    },
    { 
      label: "Total Clients", 
      value: totalCustomers.toString(), 
      change: totalCustomers > 0 ? "Inscrits" : "0" 
    },
    { 
      label: "Produits Catalogue", 
      value: products.length.toString(), 
      change: products.length > 0 ? "En ligne" : "Aucun" 
    }
  ];

  const handleHeaderAction = () => {
    if (activeTab === 'Products') {
      setEditingProduct({});
      setIsEditing(true);
    }
  };

  const handleSaveProduct = async (productData: EditableProduct) => {
    if (!supabase) return toast.error("Supabase non configuré");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return toast.error("Session expirée");

      const p = {
        ...productData,
        name: productData.name || "",
        price: Number(productData.price) || 0,
        stock: Number(productData.stock) || 0,
        image: productData.image || '',
        description: productData.description || '',
        categories: productData.categories || [],
        effects: parseListField(productData.effects),
        specs: parseSpecsField(productData.specs),
        seo: productData.seo || null,
        badges: productData.badges || [],
        promotion: productData.promotion || null,
        rating: productData.rating || 0,
        purchase_price: productData.purchase_price,
        is_batch_product: productData.is_batch_product || false,
        batch_size: productData.batch_size,
        batch_unit: productData.batch_unit,
      };

      const isEdit = !!productData.id;
      const url = isEdit ? `/api/admin/products/${productData.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(p)
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || "Erreur serveur");

      toast.success("Produit sauvegardé");
      setIsEditing(false);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!supabase) return;

    // Validate file type and size before upload
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 Mo).');
      return;
    }

    try {
      toast.loading("Upload de l'image...", { id: "upload" });
      const fileExt = file.name.split('.').pop();
      // Use crypto.randomUUID() instead of Math.random() for collision-resistant filenames
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setEditingProduct({ ...editingProduct, image: publicUrl });
      toast.success("Image uploadée", { id: "upload" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Erreur upload"), { id: "upload" });
    }
  };

  const handleDeleteProduct = async (id: string) => {
     if (!supabase) return;
     openConfirm(
       'Supprimer ce produit ?',
       'Cette action est irréversible. Le produit sera définitivement supprimé du catalogue.',
       async () => {
         try {
           const { data: { session } } = await supabase.auth.getSession();
           if (!session?.access_token) return toast.error("Session expirée");

           const response = await fetch(`/api/admin/products/${id}`, {
             method: "DELETE",
             headers: {
               "Authorization": `Bearer ${session.access_token}`
             }
           });

           const resJson = await response.json();
           if (!response.ok) throw new Error(resJson.error || "Erreur serveur");

           toast.success("Produit supprimé");
           fetchProducts();
         } catch (err) {
           toast.error(getErrorMessage(err));
         }
       }
     );
  };

  const handleDeleteCategory = async (id: string) => {
    if (!supabase) return;
    openConfirm(
      'Supprimer cette catégorie ?',
      'Les sous-catégories associées seront également supprimées. Cette action est irréversible.',
      async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) return toast.error("Session expirée");

          const response = await fetch(`/api/admin/categories/${id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${session.access_token}`
            }
          });

          const resJson = await response.json();
          if (!response.ok) throw new Error(resJson.error || "Erreur serveur");

          toast.success("Catégorie supprimée");
          useStore.getState().fetchCategories();
        } catch (err) {
          toast.error(getErrorMessage(err));
        }
      }
    );
  };

  const handleEditCategoryClick = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-soft-green/5 to-bg flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-10">
          <AdminHeader activeTab={activeTab} onAction={handleHeaderAction} />

          {/* Stats Cards - Show on Overview */}
          {activeTab === 'Overview' && (
            <>
              <AdminStatsCards stats={stats} />
              <AdminDashboard />
            </>
          )}

          {activeTab === 'Analytics' && <AdminAnalytics />}
          {activeTab === 'Marges' && <AdminMarginAnalysis />}
          {activeTab === 'Customers' && <AdminCustomers />}
          {activeTab === 'Discounts' && <AdminDiscounts />}
          {activeTab === 'Inventory' && <AdminInventory />}
          {activeTab === 'Shipping' && <AdminShipping />}
          {activeTab === 'Activity' && <AdminActivityLog />}
          {activeTab === 'Settings' && <AdminSettings />}
          {activeTab === 'Mega Menu' && <MegaMenuManager />}

          {activeTab === 'Orders' && (
            <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
              <AdminOrdersList />
            </div>
          )}

          {activeTab === 'Products' && !isEditing && (
            <ProductsTable
              products={products}
              onEdit={(product) => {
                setEditingProduct(product);
                setIsEditing(true);
              }}
              onDelete={handleDeleteProduct}
            />
          )}

          {activeTab === 'Products' && isEditing && (
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSave={handleSaveProduct}
              onCancel={() => setIsEditing(false)}
              onImageUpload={handleImageUpload}
            />
          )}

          {activeTab === 'Categories' && (
            <CategoriesManager
              categories={categories}
              onEdit={handleEditCategoryClick}
              onDelete={handleDeleteCategory}
              onAdd={handleAddCategoryClick}
            />
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        editingCategory={editingCategory}
        categories={categories}
      />

      {/* Confirmation Dialog — replaces window.confirm() */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        maxWidth="max-w-sm"
      >
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeConfirm}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border border-ink/20 text-ink hover:bg-ink/5 transition-colors rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              closeConfirm();
              confirmDialog.onConfirm();
            }}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg"
          >
            Supprimer
          </button>
        </div>
      </Dialog>
    </div>
  );
}
