import React, { useState, useEffect, useCallback } from 'react';
import { ProductItem, StoreSettings, PriceAuditLog, ReceiptScanData } from '@/types';
import { initialProducts, initialStoreSettings, demoReceipts } from '@/data/mockProducts';
import { calculateMargin } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { MobileShell } from '@/components/layout/MobileShell';
import { Header } from '@/components/layout/Header';
import { BottomNav, TabType } from '@/components/layout/BottomNav';
import { ShelfScanView, ShelfScanState } from '@/components/scanner/ShelfScanView';
import { ReceiptScanView } from '@/components/receipt/ReceiptScanView';
import { CatalogView } from '@/components/catalog/CatalogView';
import { AuditHistoryView } from '@/components/history/AuditHistoryView';
import { SettingsView } from '@/components/settings/SettingsView';
import { MarginAlertModal } from '@/components/alerts/MarginAlertModal';
import { CheckCircle2, RotateCcw, RefreshCw } from 'lucide-react';

interface ToastState {
  message: string;
  previousPrice?: { productId: string; price: number; name: string };
  visible: boolean;
}

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // LocalStorage state management with Supabase sync
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('marginku_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('marginku_settings');
    return saved ? JSON.parse(saved) : initialStoreSettings;
  });

  const [auditLogs, setAuditLogs] = useState<PriceAuditLog[]>(() => {
    const saved = localStorage.getItem('marginku_audit_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log-init-1',
            productId: 'prod-3',
            productName: 'Kopi Kapal Api Special Mix 10s',
            oldPrice: 14000,
            newPrice: 15000,
            buyPrice: 12500,
            oldMarginPercent: 10.7,
            newMarginPercent: 16.7,
            actionType: 'ACCEPT_RECOMMENDATION',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            userNote: 'Penyesuaian rekomendasi kelipatan Rp 500',
          },
        ];
  });

  const [isEasyMode, setIsEasyMode] = useState<boolean>(() => {
    return localStorage.getItem('marginku_easy_mode') === 'true';
  });

  const [activeTab, setActiveTab] = useState<TabType>('SCAN_SHELF');
  const [alertProduct, setAlertProduct] = useState<ProductItem | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });

  // Lifted state for persistent scanning tabs
  const [activeReceipt, setActiveReceipt] = useState<ReceiptScanData | null>(demoReceipts[0]);
  const [shelfScanResult, setShelfScanResult] = useState<ShelfScanState | null>(null);

  // Fetch catalog from Supabase on login
  const fetchKatalog = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('katalog_produk')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching katalog from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mappedProducts: ProductItem[] = data.map((row: any) => ({
          id: String(row.id || `prod-${Date.now()}-${Math.random()}`),
          name: row.nama,
          category: row.kategori || 'Umum',
          buyPrice: Number(row.harga_modal) || 0,
          currentSellPrice: Number(row.harga_jual) || 0,
          targetMarginPercent:
            Number(row.target_margin_persen) || settings.defaultTargetMarginPercent,
          unit: row.satuan || 'pcs',
          stockQty: Number(row.stok) || 10,
          lastUpdated: row.updated_at || new Date().toISOString(),
        }));
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error('Failed to load katalog:', err);
    }
  }, [user?.id, settings.defaultTargetMarginPercent]);

  useEffect(() => {
    if (user?.id) {
      fetchKatalog();
    }
  }, [user?.id, fetchKatalog]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('marginku_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('marginku_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('marginku_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('marginku_easy_mode', String(isEasyMode));
    if (isEasyMode) {
      document.body.classList.add('easy-mode');
    } else {
      document.body.classList.remove('easy-mode');
    }
  }, [isEasyMode]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  /* =========================================================================
   * AUTH GATE (DI-KOMENTARI SEMENTARA UNTUK PREVIEW LAYAR UTAMA TOKO)
   * Aktifkan kembali baris di bawah ini jika ingin menguji login & register:
   * =========================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1D1E] flex flex-col items-center justify-center space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1B6440]" />
        <p className="text-xs font-bold text-[#6B7280]">Memuat sesi Marginku...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={() => fetchKatalog()} />;
  }
  ========================================================================= */

  // Hitung jumlah produk bahaya
  const dangerCount = products.filter((p) => {
    const calc = calculateMargin(
      p.buyPrice,
      p.currentSellPrice,
      p.targetMarginPercent || settings.defaultTargetMarginPercent,
      settings.roundingStep,
      settings.dangerThresholdPercent
    );
    return calc.status === 'DANGER';
  }).length;

  // Aksi Menerima Rekomendasi (Pisahkan setAuditLogs dari setProducts callback untuk hindari duplikasi)
  const handleAcceptPrice = (productId: string, newPrice: number) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const oldSellPrice = targetProduct.currentSellPrice;
    const oldCalc = calculateMargin(
      targetProduct.buyPrice,
      oldSellPrice,
      targetProduct.targetMarginPercent || settings.defaultTargetMarginPercent,
      settings.roundingStep,
      settings.dangerThresholdPercent
    );
    const newCalc = calculateMargin(
      targetProduct.buyPrice,
      newPrice,
      targetProduct.targetMarginPercent || settings.defaultTargetMarginPercent,
      settings.roundingStep,
      settings.dangerThresholdPercent
    );

    const newLog: PriceAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: targetProduct.id,
      productName: targetProduct.name,
      oldPrice: oldSellPrice,
      newPrice,
      buyPrice: targetProduct.buyPrice,
      oldMarginPercent: oldCalc.activeMarginPercent,
      newMarginPercent: newCalc.activeMarginPercent,
      actionType: 'ACCEPT_RECOMMENDATION',
      timestamp: new Date().toISOString(),
      userNote: `Rekomendasi harga baru diterapkan (Target ${
        targetProduct.targetMarginPercent || settings.defaultTargetMarginPercent
      }%)`,
    };

    // Update products
    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === productId
          ? { ...prod, currentSellPrice: newPrice, lastUpdated: new Date().toISOString() }
          : prod
      )
    );

    // Update audit logs secara terpisah
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

    // Sinkronisasi ke Supabase
    if (user?.id) {
      supabase
        .from('katalog_produk')
        .update({
          harga_jual: newPrice,
          target_margin_persen:
            targetProduct.targetMarginPercent || settings.defaultTargetMarginPercent,
        })
        .eq('user_id', user.id)
        .ilike('nama', targetProduct.name)
        .then(({ error }) => {
          if (error) console.error('Supabase update price error:', error.message);
        });
    }

    setToast({
      message: `Harga ${targetProduct.name} diubah ke ${formatRupiah(newPrice)}`,
      previousPrice: { productId, price: oldSellPrice, name: targetProduct.name },
      visible: true,
    });
  };

  // Aksi Penyesuaian Manual (Pisahkan setAuditLogs dari setProducts callback)
  const handleOverridePrice = (productId: string, overridePrice: number, userNote?: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const oldSellPrice = targetProduct.currentSellPrice;
    const oldCalc = calculateMargin(
      targetProduct.buyPrice,
      oldSellPrice,
      targetProduct.targetMarginPercent || settings.defaultTargetMarginPercent,
      settings.roundingStep,
      settings.dangerThresholdPercent
    );
    const newCalc = calculateMargin(
      targetProduct.buyPrice,
      overridePrice,
      targetProduct.targetMarginPercent || settings.defaultTargetMarginPercent,
      settings.roundingStep,
      settings.dangerThresholdPercent
    );

    const newLog: PriceAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: targetProduct.id,
      productName: targetProduct.name,
      oldPrice: oldSellPrice,
      newPrice: overridePrice,
      buyPrice: targetProduct.buyPrice,
      oldMarginPercent: oldCalc.activeMarginPercent,
      newMarginPercent: newCalc.activeMarginPercent,
      actionType: 'MANUAL_OVERRIDE',
      timestamp: new Date().toISOString(),
      userNote: userNote || 'Penyesuaian manual pemilik warung',
    };

    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === productId
          ? { ...prod, currentSellPrice: overridePrice, lastUpdated: new Date().toISOString() }
          : prod
      )
    );

    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

    // Sinkronisasi ke Supabase
    if (user?.id) {
      supabase
        .from('katalog_produk')
        .update({
          harga_jual: overridePrice,
        })
        .eq('user_id', user.id)
        .ilike('nama', targetProduct.name)
        .then(({ error }) => {
          if (error) console.error('Supabase override price error:', error.message);
        });
    }

    setToast({
      message: `Harga ${targetProduct.name} diatur manual ke ${formatRupiah(overridePrice)}`,
      previousPrice: { productId, price: oldSellPrice, name: targetProduct.name },
      visible: true,
    });
  };

  // Aksi Undo Price Change
  const handleUndoPrice = () => {
    if (!toast.previousPrice) return;
    const { productId, price, name } = toast.previousPrice;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentSellPrice: price } : p))
    );

    if (user?.id) {
      supabase
        .from('katalog_produk')
        .update({ harga_jual: price })
        .eq('user_id', user.id)
        .ilike('nama', name)
        .then();
    }

    setToast({
      message: `Perubahan dibatalkan. Harga ${name} kembali ke ${formatRupiah(price)}`,
      visible: true,
    });
  };

  // Update Harga Modal dari Scan Nota
  const handleUpdateProductBuyPrice = (productName: string, newBuyPrice: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.name.toLowerCase() === productName.toLowerCase()) {
          return {
            ...prod,
            buyPrice: newBuyPrice,
            lastUpdated: new Date().toISOString(),
            matchedFromReceipt: true,
          };
        }
        return prod;
      })
    );
  };

  // Tambah Produk Baru
  const handleAddNewProduct = async (newProduct: Omit<ProductItem, 'id' | 'lastUpdated'>) => {
    const item: ProductItem = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setProducts((prev) => [item, ...prev]);

    // Save to Supabase
    if (user?.id) {
      try {
        await supabase.from('katalog_produk').insert({
          user_id: user.id,
          nama: newProduct.name,
          harga_modal: newProduct.buyPrice,
          harga_jual: newProduct.currentSellPrice,
          kategori: newProduct.category || 'Umum',
          satuan: newProduct.unit || 'pcs',
          stok: newProduct.stockQty || 10,
          target_margin_persen: newProduct.targetMarginPercent || 15.0,
        });
      } catch (err) {
        console.error('Error saving new product to Supabase:', err);
      }
    }

    setToast({
      message: `Produk ${item.name} berhasil ditambahkan`,
      visible: true,
    });
  };

  // Apply Target Margin to All Products in Catalog
  const handleApplyMarginToAllProducts = async (targetMargin: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const calc = calculateMargin(
          prod.buyPrice,
          prod.currentSellPrice,
          targetMargin,
          settings.roundingStep,
          settings.dangerThresholdPercent
        );
        return {
          ...prod,
          targetMarginPercent: targetMargin,
          currentSellPrice: calc.smartRoundedSellPrice,
          lastUpdated: new Date().toISOString(),
        };
      })
    );

    // Sync all to Supabase
    if (user?.id) {
      for (const prod of products) {
        const calc = calculateMargin(
          prod.buyPrice,
          prod.currentSellPrice,
          targetMargin,
          settings.roundingStep,
          settings.dangerThresholdPercent
        );
        await supabase
          .from('katalog_produk')
          .update({
            harga_jual: calc.smartRoundedSellPrice,
            target_margin_persen: targetMargin,
          })
          .eq('user_id', user.id)
          .ilike('nama', prod.name);
      }
    }

    setToast({
      message: `Harga seluruh produk disesuaikan ke target margin ${targetMargin}%`,
      visible: true,
    });
  };

  // Reset demo dataset
  const handleResetDemoData = async () => {
    localStorage.removeItem('marginku_products');
    localStorage.removeItem('marginku_settings');
    localStorage.removeItem('marginku_audit_logs');
    setProducts(initialProducts);
    setSettings(initialStoreSettings);
    setAuditLogs([]);
    setActiveTab('SCAN_SHELF');

    if (user?.id) {
      await supabase.from('katalog_produk').delete().eq('user_id', user.id);
    }

    setToast({
      message: 'Data demo telah direset ke setelan awal',
      visible: true,
    });
  };

  return (
    <MobileShell>
      {/* Global Unified Header */}
      <Header
        settings={settings}
        dangerCount={dangerCount}
        isEasyMode={isEasyMode}
        onToggleEasyMode={() => setIsEasyMode(!isEasyMode)}
        onOpenDangerFilter={() => setActiveTab('CATALOG')}
      />

      {/* Main Tab Content - Persistent tab mounting with CSS display */}
      <main className="flex-1 p-4">
        <div className={activeTab === 'SCAN_SHELF' ? 'block' : 'hidden'}>
          <ShelfScanView
            products={products}
            settings={settings}
            scanResult={shelfScanResult}
            onScanResultChange={setShelfScanResult}
            onOpenAlertModal={(prod) => setAlertProduct(prod)}
          />
        </div>

        <div className={activeTab === 'SCAN_RECEIPT' ? 'block' : 'hidden'}>
          <ReceiptScanView
            products={products}
            activeReceipt={activeReceipt}
            onActiveReceiptChange={setActiveReceipt}
            onUpdateProductBuyPrice={handleUpdateProductBuyPrice}
            onOpenAlertModal={(prod) => setAlertProduct(prod)}
            onRefreshKatalog={fetchKatalog}
          />
        </div>

        <div className={activeTab === 'CATALOG' ? 'block' : 'hidden'}>
          <CatalogView
            products={products}
            settings={settings}
            onOpenAlertModal={(prod) => setAlertProduct(prod)}
            onAddNewProduct={handleAddNewProduct}
            onUpdateProduct={(productId, updates) => {
              setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
              );
            }}
            onNavigateToScanReceipt={() => setActiveTab('SCAN_RECEIPT')}
          />
        </div>

        <div className={activeTab === 'HISTORY' ? 'block' : 'hidden'}>
          <AuditHistoryView logs={auditLogs} />
        </div>

        <div className={activeTab === 'SETTINGS' ? 'block' : 'hidden'}>
          <SettingsView
            settings={settings}
            onSaveSettings={(newSet) => setSettings(newSet)}
            onResetDemoData={handleResetDemoData}
            onApplyMarginToAllProducts={handleApplyMarginToAllProducts}
          />
        </div>
      </main>

      {/* Margin Alert & Price Override Modal */}
      <MarginAlertModal
        isOpen={alertProduct !== null}
        onClose={() => setAlertProduct(null)}
        product={alertProduct}
        settings={settings}
        onAcceptPrice={handleAcceptPrice}
        onOverridePrice={handleOverridePrice}
      />

      {/* Flat Instant Toast Notification with Undo */}
      {toast.visible && (
        <div className="fixed bottom-24 inset-x-4 max-w-md mx-auto z-50">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs text-[#1A1D1E] shadow-2xl">
            <div className="flex items-center gap-2.5 line-clamp-1">
              <CheckCircle2 className="w-5 h-5 text-[#1B6440] shrink-0" />
              <span className="font-bold">{toast.message}</span>
            </div>
            {toast.previousPrice && (
              <button
                onClick={handleUndoPrice}
                className="px-3 py-1.5 rounded-full bg-[#EBF5F0] hover:bg-[#DEEDE6] text-[#1B6440] font-bold border border-[#D1E7DD] shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Urungkan</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Unified Bottom Navigation (Fixed 5 Items) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        dangerCount={dangerCount}
      />
    </MobileShell>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
