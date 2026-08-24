import React, { useState, useMemo, useEffect } from 'react';
import { ProductItem, StoreSettings, MarginStatus } from '@/types';
import { calculateMargin } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import {
  Search,
  Plus,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Package,
  FileText,
  X,
  ChevronRight,
  Save,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface CatalogViewProps {
  products: ProductItem[];
  settings: StoreSettings;
  onOpenAlertModal: (product: ProductItem) => void;
  onAddNewProduct?: (newProduct: Omit<ProductItem, 'id' | 'lastUpdated'>) => void;
  onUpdateProduct?: (productId: string, updates: Partial<ProductItem>) => void;
  onNavigateToScanReceipt?: () => void;
}

/* ─────────────────────────────────────────────
   STATUS CONFIG
────────────────────────────────────────────── */
const STATUS_LABEL: Record<MarginStatus, string> = {
  DANGER: 'Rugi',
  WARNING: 'Tipis',
  HEALTHY: 'Aman',
};

const CATEGORIES = ['Sembako', 'Makanan Instan', 'Minuman', 'Kebutuhan Rumah', 'Snack', 'Lainnya'];
const UNITS = ['pcs', 'bungkus', 'kg', 'renceng', 'kotak', 'karung', 'pouch', 'botol'];

/* ─────────────────────────────────────────────
   PRODUCT DETAIL / EDIT PANEL
────────────────────────────────────────────── */
interface ProductDetailPanelProps {
  product: ProductItem;
  settings: StoreSettings;
  onClose: () => void;
  onSave: (productId: string, updates: Partial<ProductItem>) => void;
}

const ProductDetailPanel: React.FC<ProductDetailPanelProps> = ({
  product,
  settings,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [stockQty, setStockQty] = useState(String(product.stockQty ?? 0));
  const [unit, setUnit] = useState(product.unit);
  const [buyPrice, setBuyPrice] = useState(String(product.buyPrice));
  const [sellPrice, setSellPrice] = useState(String(product.currentSellPrice));

  const buyNum = parseInt(buyPrice, 10) || 0;
  const sellNum = parseInt(sellPrice, 10) || 0;
  const profitNetto = sellNum - buyNum;
  const marginPercent = sellNum > 0 ? ((sellNum - buyNum) / sellNum) * 100 : 0;

  const isProfit = profitNetto >= 0;

  const handleSave = () => {
    if (!name.trim() || buyNum <= 0 || sellNum <= 0) return;
    onSave(product.id, {
      name: name.trim(),
      category,
      stockQty: parseInt(stockQty, 10) || 0,
      unit,
      buyPrice: buyNum,
      currentSellPrice: sellNum,
      lastUpdated: new Date().toISOString(),
    });
    onClose();
  };

  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Panel Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>
              Edit Produk
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
              Ubah detail &amp; harga barang
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Tutup panel"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-32">
          {/* Nama Produk */}
          <div>
            <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Nama Produk
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama barang..."
              style={{ fontSize: 16, height: 60 }}
              className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          {/* Kategori */}
          <div>
            <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ fontSize: 16, height: 60 }}
              className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-green-600 transition-colors cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stok & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                Total Stok
              </label>
              <input
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                style={{ fontSize: 18, height: 60, fontWeight: 700 }}
                className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 tabular-nums focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                Nama Stok
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ fontSize: 16, height: 60 }}
                className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-green-600 transition-colors cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga Modal */}
          <div>
            <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Harga Modal (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="Contoh: 16500"
              style={{ fontSize: 20, height: 60, fontWeight: 700 }}
              className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 tabular-nums focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          {/* Harga Jual */}
          <div>
            <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Harga Jual (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Contoh: 19500"
              style={{ fontSize: 20, height: 60, fontWeight: 700, color: '#15803D' }}
              className="w-full px-4 rounded-2xl bg-green-50 border-2 border-green-200 tabular-nums focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          {/* Kalkulasi Otomatis */}
          <div className="rounded-2xl border-2 border-dashed overflow-hidden"
            style={{ borderColor: isProfit ? '#15803D' : '#DC2626' }}>
            <div
              className="px-4 py-2"
              style={{ backgroundColor: isProfit ? '#F0FDF4' : '#FEF2F2' }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: isProfit ? '#15803D' : '#DC2626' }}>
                Kalkulasi Otomatis
              </p>
            </div>
            <div className="px-4 py-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 16, color: '#6B7280', fontWeight: 600 }}>
                  Profit Netto (Rp)
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: isProfit ? '#15803D' : '#DC2626' }}
                  className="tabular-nums flex items-center gap-1">
                  {isProfit
                    ? <TrendingUp className="w-5 h-5" />
                    : <TrendingDown className="w-5 h-5" />}
                  {formatRupiah(Math.abs(profitNetto))}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span style={{ fontSize: 16, color: '#6B7280', fontWeight: 600 }}>
                  Margin (%)
                </span>
                <span
                  style={{ fontSize: 32, fontWeight: 900, color: isProfit ? '#15803D' : '#DC2626' }}
                  className="tabular-nums"
                >
                  {marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Fixed at bottom of panel */}
        <div
          className="fixed bottom-0 inset-x-0 max-w-md mx-auto px-5 py-4 bg-white border-t border-gray-100"
          style={{ zIndex: 60 }}
        >
          <button
            onClick={handleSave}
            disabled={!name.trim() || buyNum <= 0 || sellNum <= 0}
            style={{ height: 60, fontSize: 18, fontWeight: 800 }}
            className="w-full rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Save className="w-5 h-5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </>
  );
};

//ADD PRODUCT MODAL
interface AddProductModalProps {
  settings: StoreSettings;
  onClose: () => void;
  onAdd: (product: Omit<ProductItem, 'id' | 'lastUpdated'>) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ settings, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sembako');
  const [unit, setUnit] = useState('pcs');
  const [stockQty, setStockQty] = useState('10');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const buyNum = parseInt(buyPrice, 10) || 0;
  const sellNum = parseInt(sellPrice, 10) || 0;
  const profitNetto = sellNum - buyNum;
  const marginPercent = sellNum > 0 ? ((sellNum - buyNum) / sellNum) * 100 : 0;
  const isProfit = profitNetto >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || buyNum <= 0 || sellNum <= 0) return;
    onAdd({
      name: name.trim(),
      category,
      buyPrice: buyNum,
      currentSellPrice: sellNum,
      targetMarginPercent: settings.defaultTargetMarginPercent,
      unit,
      stockQty: parseInt(stockQty, 10) || 10,
    });
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>
              + Tambah Produk Baru
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
              Isi detail barang baru ke katalog
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-32">
          <div>
            <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Nama Produk
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Susu UHT Indomilk 200ml"
              required
              style={{ fontSize: 16, height: 60 }}
              className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ fontSize: 15, height: 60 }}
                className="w-full px-3 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-green-600 transition-colors cursor-pointer"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                Satuan
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ fontSize: 15, height: 60 }}
                className="w-full px-3 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-green-600 transition-colors cursor-pointer"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Jumlah Stok
            </label>
            <input
              type="number"
              min="0"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              style={{ fontSize: 18, height: 60, fontWeight: 700 }}
              className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 tabular-nums focus:outline-none focus:border-green-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                Harga Modal (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0"
                required
                style={{ fontSize: 18, height: 60, fontWeight: 700 }}
                className="w-full px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 tabular-nums focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
                Harga Jual (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0"
                required
                style={{ fontSize: 18, height: 60, fontWeight: 700, color: '#15803D' }}
                className="w-full px-4 rounded-2xl bg-green-50 border-2 border-green-200 tabular-nums focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
          </div>

          {/* Preview kalkulasi */}
          {buyNum > 0 && sellNum > 0 && (
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: isProfit ? '#F0FDF4' : '#FEF2F2' }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: '#6B7280' }}>Margin Produk:</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: isProfit ? '#15803D' : '#DC2626' }}
                className="tabular-nums">
                {marginPercent.toFixed(1)}%
              </span>
            </div>
          )}
        </form>

        <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto px-5 py-4 bg-white border-t border-gray-100" style={{ zIndex: 60 }}>
          <button
            onClick={handleSubmit as any}
            disabled={!name.trim() || buyNum <= 0 || sellNum <= 0}
            style={{ height: 60, fontSize: 18, fontWeight: 800 }}
            className="w-full rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Tambah ke Katalog</span>
          </button>
        </div>
      </div>
    </>
  );
};


// MAIN CATALOG VIEW//
export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  settings,
  onOpenAlertModal,
  onAddNewProduct,
  onUpdateProduct,
  onNavigateToScanReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MarginStatus>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const metrics = useMemo(() => {
    let dangerCount = 0;
    let warningCount = 0;
    let healthyCount = 0;
    products.forEach((p) => {
      const calc = calculateMargin(
        p.buyPrice,
        p.currentSellPrice,
        p.targetMarginPercent || settings.defaultTargetMarginPercent,
        settings.roundingStep,
        settings.dangerThresholdPercent
      );
      if (calc.status === 'DANGER') dangerCount++;
      else if (calc.status === 'WARNING') warningCount++;
      else healthyCount++;
    });
    return { dangerCount, warningCount, healthyCount };
  }, [products, settings]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'ALL') return true;
      const calc = calculateMargin(
        p.buyPrice,
        p.currentSellPrice,
        p.targetMarginPercent || settings.defaultTargetMarginPercent,
        settings.roundingStep,
        settings.dangerThresholdPercent
      );
      return calc.status === statusFilter;
    });
  }, [products, searchQuery, statusFilter, settings]);

  const handleSaveProduct = (productId: string, updates: Partial<ProductItem>) => {
    if (onUpdateProduct) {
      onUpdateProduct(productId, updates);
    }
  };

  const handleAddProduct = (newProduct: Omit<ProductItem, 'id' | 'lastUpdated'>) => {
    if (onAddNewProduct) {
      onAddNewProduct(newProduct);
    }
  };

  return (
    <div className="pb-24 text-[#1A1A1A] font-sans" style={{ backgroundColor: '#FFFFFF', minHeight: '100%' }}>

      {/* ── GREEN APP BAR ── */}
      <div style={{ backgroundColor: '#15803D' }} className="px-4 pt-4 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              Marginku
            </h1>
            <p style={{ fontSize: 16, color: '#BBF7D0', fontWeight: 500, marginTop: 3 }}>
              {settings.storeName || 'Warung Berkah Jaya'}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{ height: 48, fontSize: 15, fontWeight: 700, paddingLeft: 16, paddingRight: 18 }}
            className="flex items-center gap-2 rounded-2xl bg-white text-[#15803D] cursor-pointer active:scale-95 transition-all shadow-md shrink-0 mt-1"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Quick stats strip */}
        <div className="flex gap-2 mt-4">
          {[
            { label: 'Rugi', count: metrics.dangerCount, color: '#FCA5A5', bg: 'rgba(239,68,68,0.2)' },
            { label: 'Tipis', count: metrics.warningCount, color: '#FDE68A', bg: 'rgba(245,158,11,0.2)' },
            { label: 'Aman', count: metrics.healthyCount, color: '#BBF7D0', bg: 'rgba(74,222,128,0.2)' },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl px-3 py-2 text-center" style={{ backgroundColor: s.bg }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }} className="tabular-nums">
                {s.count}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER & SEARCH ── */}
      <div className="px-4 pt-4 pb-2 space-y-3">

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(
            [
              { id: 'ALL', label: 'Semua', count: products.length },
              { id: 'DANGER', label: 'Rugi', count: metrics.dangerCount },
              { id: 'WARNING', label: 'Tipis', count: metrics.warningCount },
              { id: 'HEALTHY', label: 'Aman', count: metrics.healthyCount },
            ] as { id: 'ALL' | MarginStatus; label: string; count: number }[]
          ).map((f) => {
            const isActive = statusFilter === f.id;
            const dangerActive = f.id === 'DANGER' && isActive;
            const warningActive = f.id === 'WARNING' && isActive;
            const healthyActive = (f.id === 'HEALTHY' || f.id === 'ALL') && isActive;

            let activeBg = '#15803D';
            let activeText = '#FFFFFF';
            if (dangerActive) { activeBg = '#DC2626'; activeText = '#FFFFFF'; }
            else if (warningActive) { activeBg = '#f5c007ff'; activeText = '#FFFFFF'; }

            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  height: 48,
                  paddingLeft: 18,
                  paddingRight: 18,
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 999,
                  backgroundColor: isActive ? activeBg : '#FFFFFF',
                  color: isActive ? activeText : '#6B7280',
                  border: isActive ? 'none' : '2px solid #E5E7EB',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 900,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                  color: isActive ? '#FFFFFF' : '#374151',
                  borderRadius: 999,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2,
                  paddingBottom: 2,
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            style={{ width: 22, height: 22 }}
          />
          <input
            type="text"
            placeholder="Cari nama barang atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: 60, fontSize: 16, paddingLeft: 52 }}
            className="w-full pr-4 rounded-2xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 font-medium focus:outline-none focus:border-green-600 transition-colors"
          />
        </div>
      </div>

      {/* ── PRODUCT LIST ── */}
      <div className="px-4 pt-2 space-y-0">

        {/* Empty catalog state */}
        {products.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white border-2 border-dashed border-gray-200 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto">
              <Package style={{ width: 32, height: 32, color: '#15803D' }} />
            </div>
            <div className="space-y-1">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A' }}>
                Katalog Masih Kosong
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.5 }} className="max-w-xs mx-auto">
                Mulai dengan scan nota kulakan atau tambah barang manual.
              </p>
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              {onNavigateToScanReceipt && (
                <button
                  onClick={onNavigateToScanReceipt}
                  style={{ height: 60, fontSize: 17, fontWeight: 700 }}
                  className="w-full rounded-2xl bg-[#15803D] text-white flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.98] shadow-md"
                >
                  <FileText className="w-5 h-5" />
                  <span>Scan Nota Grosir</span>
                </button>
              )}
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{ height: 60, fontSize: 17, fontWeight: 700 }}
                className="w-full rounded-2xl border-2 border-gray-200 bg-white text-gray-700 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                <span>Tambah Manual</span>
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-4 p-8 text-center rounded-3xl bg-white border-2 border-dashed border-gray-200">
            <Package style={{ width: 32, height: 32, color: '#9CA3AF', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>Barang tidak ditemukan</p>
            <p style={{ fontSize: 15, color: '#6B7280', marginTop: 4 }}>
              Coba ubah filter atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <>
            {/* List header */}
            <div className="flex items-center justify-between py-3">
              <p style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>
                {filteredProducts.length} barang ditemukan
              </p>
            </div>

            {/* Product list items */}
            {filteredProducts.map((prod, idx) => {
              const calc = calculateMargin(
                prod.buyPrice,
                prod.currentSellPrice,
                prod.targetMarginPercent || settings.defaultTargetMarginPercent,
                settings.roundingStep,
                settings.dangerThresholdPercent
              );

              const isRugi = calc.activeMarginNominal < 0;
              const isAlternate = idx % 2 === 0;

              const statusColor =
                calc.status === 'DANGER' ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', badgeBg: '#FEE2E2' } :
                  calc.status === 'WARNING' ? { bg: '#fdfbf2ff', border: '#f5f6beff', text: '#ffd503ff', badgeBg: '#f5efbfff' } :
                    { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', badgeBg: '#DCFCE7' };

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  style={{
                    backgroundColor: isAlternate ? '#FFFFFF' : '#FAFAFA',
                    borderBottom: '1px solid #F3F4F6',
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 4,
                    paddingRight: 4,
                    cursor: 'pointer',
                    minHeight: 90,
                    transition: 'background-color 0.1s',
                  }}
                  className="active:bg-green-50 select-none"
                >
                  <div className="flex items-start gap-3">
                    {/* Status indicator bar */}
                    <div
                      style={{
                        width: 4,
                        minHeight: 70,
                        borderRadius: 999,
                        backgroundColor: statusColor.text,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Row 1: Product Name */}
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.25 }}
                        className="truncate">
                        {prod.name}
                      </h3>

                      {/* Row 2: Category | Stok */}
                      <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 500, marginTop: 3 }}>
                        {prod.category}
                        <span className="mx-2 text-gray-300">|</span>
                        Stok: <strong style={{ color: '#1A1A1A', fontWeight: 700 }}>
                          {prod.stockQty ?? 0} {prod.unit}
                        </strong>
                      </p>

                      {/* Row 3: Price + Status Badge */}
                      <div className="flex items-end justify-between mt-3 gap-2">
                        <div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#15803D', lineHeight: 1 }}
                            className="tabular-nums">
                            {formatRupiah(prod.currentSellPrice)}
                          </div>
                          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                            Modal: {formatRupiah(prod.buyPrice)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status badge */}
                          <span
                            style={{
                              color: statusColor.text,
                              fontSize: 14,
                              fontWeight: 800,
                              paddingLeft: 12,
                              paddingRight: 12,
                              paddingTop: 6,
                              paddingBottom: 6,
                              borderRadius: 999,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            {calc.status === 'DANGER' && <AlertOctagon style={{ width: 14, height: 14 }} />}
                            {calc.status === 'WARNING' && <AlertTriangle style={{ width: 14, height: 14 }} />}
                            {calc.status === 'HEALTHY' && <CheckCircle2 style={{ width: 14, height: 14 }} />}
                            {STATUS_LABEL[calc.status]} {calc.activeMarginPercent.toFixed(1)}%
                          </span>

                          <ChevronRight style={{ width: 20, height: 20, color: '#D1D5DB' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {isAddModalOpen && (
        <AddProductModal
          settings={settings}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddProduct}
        />
      )}

      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          settings={settings}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};
