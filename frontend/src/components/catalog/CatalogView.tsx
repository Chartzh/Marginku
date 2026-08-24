import React, { useState, useMemo } from 'react';
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
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CatalogViewProps {
  products: ProductItem[];
  settings: StoreSettings;
  onOpenAlertModal: (product: ProductItem) => void;
  onAddNewProduct?: (newProduct: Omit<ProductItem, 'id' | 'lastUpdated'>) => void;
  onUpdateProduct?: (productId: string, updates: Partial<ProductItem>) => void;
  onNavigateToScanReceipt?: () => void;
  onDeleteProducts?: (productIds: string[]) => void;
}

const STATUS_LABEL: Record<MarginStatus, string> = {
  DANGER: 'Rugi',
  WARNING: 'Tipis',
  HEALTHY: 'Aman',
};

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  settings,
  onOpenAlertModal,
  onAddNewProduct,
  onNavigateToScanReceipt,
  onDeleteProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MarginStatus>('ALL');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form State for Adding Product
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sembako');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentSellPrice, setCurrentSellPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [stockQty, setStockQty] = useState('10');

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

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const buyNum = parseFloat(buyPrice);
    const sellNum = parseFloat(currentSellPrice);

    if (name && buyNum > 0 && sellNum > 0 && onAddNewProduct) {
      onAddNewProduct({
        name,
        category,
        buyPrice: buyNum,
        currentSellPrice: sellNum,
        targetMarginPercent: settings.defaultTargetMarginPercent,
        unit,
        stockQty: parseInt(stockQty, 10) || 10,
      });

      setName('');
      setBuyPrice('');
      setCurrentSellPrice('');
      setUnit('pcs');
      setStockQty('10');
      setIsAddModalOpen(false);
    }
  };

  const parsedBuyPrice = parseInt(buyPrice.replace(/\D/g, ''), 10) || 0;
  const parsedSellPrice = parseInt(currentSellPrice.replace(/\D/g, ''), 10) || 0;
  const computedProfit = parsedSellPrice - parsedBuyPrice;
  const computedMargin = parsedSellPrice > 0 ? (computedProfit / parsedSellPrice) * 100 : 0;

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
          <div className="flex items-center gap-2">
            {onDeleteProducts && products.length > 0 && (
              <button
                onClick={() => {
                  setIsDeleteMode(!isDeleteMode);
                  setSelectedProductIds([]);
                }}
                style={{ height: 48, fontSize: 15, fontWeight: 700, paddingLeft: 14, paddingRight: 14 }}
                className={`flex items-center gap-1.5 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-md shrink-0 mt-1 ${
                  isDeleteMode
                    ? 'bg-red-600 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Trash2 className="w-5 h-5" />
                <span>{isDeleteMode ? 'Batal' : 'Hapus'}</span>
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{ height: 48, fontSize: 15, fontWeight: 700, paddingLeft: 16, paddingRight: 18 }}
              className="flex items-center gap-2 rounded-2xl bg-white text-[#15803D] cursor-pointer active:scale-95 transition-all shadow-md shrink-0 mt-1"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah</span>
            </button>
          </div>
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

            let activeBg = '#15803D';
            let activeText = '#FFFFFF';
            if (dangerActive) { activeBg = '#DC2626'; activeText = '#FFFFFF'; }
            else if (warningActive) { activeBg = '#F59E0B'; activeText = '#FFFFFF'; }

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
            <div className="flex items-center justify-between py-3">
              <p style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>
                {filteredProducts.length} barang ditemukan
              </p>
            </div>

            {filteredProducts.map((prod, idx) => {
              const calc = calculateMargin(
                prod.buyPrice,
                prod.currentSellPrice,
                prod.targetMarginPercent || settings.defaultTargetMarginPercent,
                settings.roundingStep,
                settings.dangerThresholdPercent
              );

              const isAlternate = idx % 2 === 0;
              const statusColor =
                calc.status === 'DANGER' ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' } :
                  calc.status === 'WARNING' ? { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' } :
                    { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };

              const isSelected = selectedProductIds.includes(prod.id);

              const handleCardClick = () => {
                if (isDeleteMode) {
                  if (isSelected) {
                    setSelectedProductIds((prev) => prev.filter((id) => id !== prod.id));
                  } else {
                    setSelectedProductIds((prev) => [...prev, prod.id]);
                  }
                } else {
                  onOpenAlertModal(prod);
                }
              };

              return (
                <div
                  key={prod.id}
                  onClick={handleCardClick}
                  style={{
                    backgroundColor: isSelected ? '#FEE2E2' : (isAlternate ? '#FFFFFF' : '#FAFAFA'),
                    borderBottom: '1px solid #F3F4F6',
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 4,
                    paddingRight: 4,
                    cursor: 'pointer',
                    minHeight: 90,
                    transition: 'background-color 0.1s',
                  }}
                  className="active:bg-green-50 select-none relative"
                >
                  <div className="flex items-start gap-3">
                    {isDeleteMode ? (
                      <div className="flex items-center justify-center shrink-0 mt-3 pl-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-5 h-5 accent-red-600 cursor-pointer"
                        />
                      </div>
                    ) : (
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
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.25 }}
                        className="truncate">
                        {prod.name}
                      </h3>

                      <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 500, marginTop: 3 }}>
                        {prod.category}
                        <span className="mx-2 text-gray-300">|</span>
                        Stok: <strong style={{ color: '#1A1A1A', fontWeight: 700 }}>
                          {prod.stockQty ?? 0} {prod.unit}
                        </strong>
                      </p>

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

      {/* Floating Action Bar for Deletion */}
      {isDeleteMode && onDeleteProducts && (
        <div className="fixed bottom-24 inset-x-4 max-w-md mx-auto z-40 bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-base font-extrabold text-[#1A1A1A] px-1">
            <span>Terpilih: {selectedProductIds.length} produk</span>
          </div>

          <button
            disabled={selectedProductIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full min-h-[60px] rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            <span>Hapus Terpilih ({selectedProductIds.length})</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xs bg-white border-2 border-[#1A1A1A] p-6 rounded-lg text-[#1A1A1A] font-sans text-center [&>button]:hidden">
          <DialogHeader className="border-b-2 border-gray-200 pb-2">
            <DialogTitle className="text-lg font-black text-[#1A1A1A] text-center">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-base text-gray-700 font-bold leading-relaxed">
            {selectedProductIds.length === products.length
              ? 'Apakah Anda yakin ingin menghapus semua produk?'
              : `Apakah Anda yakin ingin menghapus ${selectedProductIds.length} produk terpilih?`}
          </div>
          <div className="flex gap-2 font-bold text-base">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-[52px] rounded-lg bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (onDeleteProducts) {
                  onDeleteProducts(selectedProductIds);
                }
                setIsDeleteMode(false);
                setSelectedProductIds([]);
                setIsConfirmOpen(false);
              }}
              className="flex-1 h-[52px] rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {selectedProductIds.length === products.length ? 'Hapus Semua' : 'Hapus'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#1A1A1A] p-6 rounded-lg text-[#1A1A1A] font-sans [&>button]:hidden">
          <DialogHeader className="border-b-2 border-gray-200 pb-3">
            <DialogTitle className="text-2xl font-black text-[#1A1A1A]">
              Tambah Barang Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 mt-3 text-lg">
            <div>
              <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Nama Produk</label>
              <input
                type="text"
                placeholder="Contoh: Susu UHT Indomilk 200ml"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-[60px] px-3 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Makanan Instan">Makanan Instan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Nama Stok / Satuan</label>
                <input
                  type="text"
                  placeholder="pcs / kg / renceng"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Total Stok</label>
              <input
                type="number"
                placeholder="Contoh: 10"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Harga Modal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 4500"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] font-bold focus:outline-none focus:border-[#15803D]"
                  required
                />
              </div>

              <div>
                <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Harga Jual Rak (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 5500"
                  value={currentSellPrice}
                  onChange={(e) => setCurrentSellPrice(e.target.value)}
                  className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#15803D] font-bold focus:outline-none focus:border-[#15803D]"
                  required
                />
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 flex gap-3 text-[#1A1A1A]">
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-600 uppercase">Profit Netto</span>
                <div className="text-xl font-black text-[#1A1A1A] mt-0.5 tabular-nums">
                  {formatRupiah(computedProfit)}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-600 uppercase">Margin</span>
                <div className={`text-xl font-black mt-0.5 tabular-nums ${computedMargin >= 15 ? 'text-[#15803D]' : (computedMargin < 5 ? 'text-red-600' : 'text-amber-600')}`}>
                  {computedMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 min-h-[60px] font-bold text-lg rounded-lg border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[60px] font-bold text-lg rounded-lg bg-[#15803D] hover:bg-[#15803D]/90 text-white cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
