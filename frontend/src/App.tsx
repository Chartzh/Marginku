import React, { useState, useEffect } from 'react';
import { ProductItem, StoreSettings, PriceAuditLog } from '@/types';
import { initialProducts, initialStoreSettings } from '@/data/mockProducts';
import { calculateMargin } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import { MobileShell } from '@/components/layout/MobileShell';
import { Header } from '@/components/layout/Header';
import { BottomNav, TabType } from '@/components/layout/BottomNav';
import { ShelfScanView } from '@/components/scanner/ShelfScanView';
import { ReceiptScanView } from '@/components/receipt/ReceiptScanView';
import { CatalogView } from '@/components/catalog/CatalogView';
import { AuditHistoryView } from '@/components/history/AuditHistoryView';
import { SettingsView } from '@/components/settings/SettingsView';
import { MarginAlertModal } from '@/components/alerts/MarginAlertModal';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface ToastState {
  message: string;
  previousPrice?: { productId: string; price: number; name: string };
  visible: boolean;
}

export const App: React.FC = () => {
  // LocalStorage state management
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

  // Aksi Menerima Rekomendasi
  const handleAcceptPrice = (productId: string, newPrice: number) => {
    let targetName = '';
    let oldSellPrice = 0;

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          targetName = prod.name;
          oldSellPrice = prod.currentSellPrice;

          const oldCalc = calculateMargin(
            prod.buyPrice,
            oldSellPrice,
            prod.targetMarginPercent || settings.defaultTargetMarginPercent,
            settings.roundingStep,
            settings.dangerThresholdPercent
          );
          const newCalc = calculateMargin(
            prod.buyPrice,
            newPrice,
            prod.targetMarginPercent || settings.defaultTargetMarginPercent,
            settings.roundingStep,
            settings.dangerThresholdPercent
          );

          const newLog: PriceAuditLog = {
            id: `log-${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            oldPrice: oldSellPrice,
            newPrice,
            buyPrice: prod.buyPrice,
            oldMarginPercent: oldCalc.activeMarginPercent,
            newMarginPercent: newCalc.activeMarginPercent,
            actionType: 'ACCEPT_RECOMMENDATION',
            timestamp: new Date().toISOString(),
            userNote: `Rekomendasi harga baru diterapkan (Target ${prod.targetMarginPercent || settings.defaultTargetMarginPercent}%)`,
          };

          setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

          return {
            ...prod,
            currentSellPrice: newPrice,
            lastUpdated: new Date().toISOString(),
          };
        }
        return prod;
      })
    );

    setToast({
      message: `Harga ${targetName} diubah ke ${formatRupiah(newPrice)}`,
      previousPrice: { productId, price: oldSellPrice, name: targetName },
      visible: true,
    });
  };

  // Aksi Penyesuaian Manual
  const handleOverridePrice = (productId: string, overridePrice: number, userNote?: string) => {
    let targetName = '';
    let oldSellPrice = 0;

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          targetName = prod.name;
          oldSellPrice = prod.currentSellPrice;

          const oldCalc = calculateMargin(
            prod.buyPrice,
            oldSellPrice,
            prod.targetMarginPercent || settings.defaultTargetMarginPercent,
            settings.roundingStep,
            settings.dangerThresholdPercent
          );
          const newCalc = calculateMargin(
            prod.buyPrice,
            overridePrice,
            prod.targetMarginPercent || settings.defaultTargetMarginPercent,
            settings.roundingStep,
            settings.dangerThresholdPercent
          );

          const newLog: PriceAuditLog = {
            id: `log-${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            oldPrice: oldSellPrice,
            newPrice: overridePrice,
            buyPrice: prod.buyPrice,
            oldMarginPercent: oldCalc.activeMarginPercent,
            newMarginPercent: newCalc.activeMarginPercent,
            actionType: 'MANUAL_OVERRIDE',
            timestamp: new Date().toISOString(),
            userNote: userNote || 'Penyesuaian manual pemilik warung',
          };

          setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

          return {
            ...prod,
            currentSellPrice: overridePrice,
            lastUpdated: new Date().toISOString(),
          };
        }
        return prod;
      })
    );

    setToast({
      message: `Harga ${targetName} diatur manual ke ${formatRupiah(overridePrice)}`,
      previousPrice: { productId, price: oldSellPrice, name: targetName },
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
  const handleAddNewProduct = (newProduct: Omit<ProductItem, 'id' | 'lastUpdated'>) => {
    const item: ProductItem = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setProducts((prev) => [item, ...prev]);
    setToast({
      message: `Produk ${item.name} berhasil ditambahkan`,
      visible: true,
    });
  };

  // Apply Target Margin to All Products in Catalog
  const handleApplyMarginToAllProducts = (targetMargin: number) => {
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

    setToast({
      message: `Harga seluruh produk disesuaikan ke target margin ${targetMargin}%`,
      visible: true,
    });
  };

  // Reset demo dataset
  const handleResetDemoData = () => {
    localStorage.removeItem('marginku_products');
    localStorage.removeItem('marginku_settings');
    localStorage.removeItem('marginku_audit_logs');
    setProducts(initialProducts);
    setSettings(initialStoreSettings);
    setAuditLogs([]);
    setActiveTab('SCAN_SHELF');
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

      {/* Main Tab Content */}
      <main className="flex-1 p-4">
        {activeTab === 'SCAN_SHELF' && (
          <ShelfScanView
            products={products}
            settings={settings}
            onOpenAlertModal={(prod) => setAlertProduct(prod)}
          />
        )}

        {activeTab === 'SCAN_RECEIPT' && (
          <ReceiptScanView
            products={products}
            onUpdateProductBuyPrice={handleUpdateProductBuyPrice}
            onOpenAlertModal={(prod) => setAlertProduct(prod)}
          />
        )}

        {activeTab === 'CATALOG' && (
          <CatalogView
            products={products}
            settings={settings}
            onOpenAlertModal={(prod) => setAlertProduct(prod)}
            onAddNewProduct={handleAddNewProduct}
          />
        )}

        {activeTab === 'HISTORY' && <AuditHistoryView logs={auditLogs} />}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={settings}
            onSaveSettings={(newSet) => setSettings(newSet)}
            onResetDemoData={handleResetDemoData}
            onApplyMarginToAllProducts={handleApplyMarginToAllProducts}
          />
        )}
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
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-50">
          <div className="p-3.5 rounded-lg bg-[#18191e] border border-[#262830] flex items-center justify-between gap-3 text-xs text-[#f3f4f6]">
            <div className="flex items-center gap-2 line-clamp-1">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
              <span className="font-bold">{toast.message}</span>
            </div>
            {toast.previousPrice && (
              <button
                onClick={handleUndoPrice}
                className="px-2.5 py-1 rounded bg-[#131417] hover:bg-[#262830] text-[#22c55e] font-bold border border-[#262830] shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
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

export default App;
