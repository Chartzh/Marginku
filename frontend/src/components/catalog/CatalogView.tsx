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
  onAcceptPrice?: (productId: string, newPrice: number, name?: string) => void;
  onAddNewProduct?: (newProduct: Omit<ProductItem, 'id' | 'lastUpdated'>) => void;
  onUpdateProduct?: (productId: string, updates: Partial<ProductItem>) => void;
  onNavigateToScanReceipt?: () => void;
  onDeleteProducts?: (productIds: string[]) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  settings,
  onOpenAlertModal,
  onAddNewProduct,
  onDeleteProducts,
  onAcceptPrice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MarginStatus>('ALL');
  const [dateFilter, setDateFilter] = useState('');
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

      let matchesDate = true;
      if (dateFilter && p.lastUpdated) {
        const productDate = p.lastUpdated.split('T')[0];
        matchesDate = productDate === dateFilter;
      }
      if (!matchesDate) return false;

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
  }, [products, searchQuery, statusFilter, dateFilter, settings]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const buyNum = parseInt(buyPrice.replace(/\D/g, ''), 10);
    const sellNum = parseInt(currentSellPrice.replace(/\D/g, ''), 10);

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

  // Realtime calculated values in the Add Product form
  const parsedBuyPrice = parseInt(buyPrice.replace(/\D/g, ''), 10) || 0;
  const parsedSellPrice = parseInt(currentSellPrice.replace(/\D/g, ''), 10) || 0;
  const computedProfit = parsedSellPrice - parsedBuyPrice;
  const computedMargin = parsedSellPrice > 0 ? (computedProfit / parsedSellPrice) * 100 : 0;

  return (
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* 1. Header Area */}
      <div className="bg-[#15803D] rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Katalog Produk
          </h1>
          <p className="text-xs font-medium text-white/90 mt-1">
            {settings.storeName || 'Warung Berkah Jaya'}
          </p>
        </div>

        <div>
          {!isDeleteMode && onAddNewProduct && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-3.5 rounded-full bg-white text-[#15803D] hover:bg-white/95 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Pills Area */}
      <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`h-9 px-4 rounded-full font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border ${
            statusFilter === 'ALL'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#1A1D1E] border-[#E5E7EB] hover:bg-gray-50'
          }`}
        >
          Semua ({products.length})
        </button>

        <button
          onClick={() => setStatusFilter('DANGER')}
          className={`h-9 px-4 rounded-full font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border ${
            statusFilter === 'DANGER'
              ? 'bg-[#EF4444] text-white border-[#EF4444]'
              : 'bg-white text-red-600 border-[#E5E7EB] hover:bg-red-50'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          <span>Rugi ({metrics.dangerCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('WARNING')}
          className={`h-9 px-4 rounded-full font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border ${
            statusFilter === 'WARNING'
              ? 'bg-[#B45309] text-white border-[#B45309]'
              : 'bg-white text-amber-600 border-[#E5E7EB] hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Tipis ({metrics.warningCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('HEALTHY')}
          className={`h-9 px-4 rounded-full font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border ${
            statusFilter === 'HEALTHY'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#15803D] border-[#E5E7EB] hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
          <span>Aman ({metrics.healthyCount})</span>
        </button>
      </div>

      {/* 2b. Search & Date Filter Area */}
      {products.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] placeholder:text-gray-400 focus:outline-none focus:border-[#15803D] font-medium"
              />
            </div>

            {/* Date Input */}
            <div className="relative w-1/3 min-w-[120px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-10 px-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium dark:[color-scheme:light]"
              />
            </div>

            {/* Trash Delete Toggle Button */}
            {onDeleteProducts && (
              <button
                onClick={() => {
                  setIsDeleteMode(!isDeleteMode);
                  setSelectedProductIds([]);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                  isDeleteMode
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-[#E5E7EB] text-[#1A1D1E] hover:bg-gray-50'
                }`}
                title={isDeleteMode ? 'Batal Hapus' : 'Hapus Barang'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
              className="w-full h-8 text-center bg-gray-100 border border-[#E5E7EB] text-xs font-semibold text-[#1A1D1E] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Selection Utility Row */}
      {isDeleteMode && filteredProducts.length > 0 && (
        <div className="flex justify-between items-center px-1 py-1 text-xs text-gray-600">
          <button
            onClick={() => {
              const allIds = filteredProducts.map((p) => p.id);
              const isAllSelected = selectedProductIds.length === allIds.length;
              if (isAllSelected) {
                setSelectedProductIds([]);
              } else {
                setSelectedProductIds(allIds);
              }
            }}
            className="flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer font-bold"
          >
            <input
              type="checkbox"
              checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
              readOnly
              className="w-4 h-4 cursor-pointer accent-red-600"
            />
            <span>{selectedProductIds.length === filteredProducts.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
          </button>
          <span className="font-bold">
            {selectedProductIds.length} dari {filteredProducts.length} terpilih
          </span>
        </div>
      )}

      {/* 3. Product List Area */}
      <div className="flex flex-col space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-[#E5E7EB] text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs font-bold text-[#1A1D1E]">Barang tidak ditemukan</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const calc = calculateMargin(
              prod.buyPrice,
              prod.currentSellPrice,
              prod.targetMarginPercent || settings.defaultTargetMarginPercent,
              settings.roundingStep,
              settings.dangerThresholdPercent
            );

            const statusColor = calc.status === 'DANGER'
              ? 'text-red-600 bg-red-50 border-red-200'
              : calc.status === 'WARNING'
              ? 'text-amber-600 bg-amber-50 border-amber-200'
              : 'text-[#15803D] bg-emerald-50 border-emerald-200';

            const isSelected = selectedProductIds.includes(prod.id);
            const recommendedPrice = prod.recommendedSellPrice || calc.smartRoundedSellPrice;
            const hasRecommendation = recommendedPrice !== prod.currentSellPrice;

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
                className={`p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col gap-1.5 relative transition-all cursor-pointer select-none shadow-sm hover:border-[#15803D] ${
                  isSelected ? 'bg-red-50/50 border-red-500' : ''
                }`}
              >
                {isDeleteMode && (
                  <div className="absolute right-3 top-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Row 1: Product Title */}
                <div className="pr-8">
                  <h3 className="text-sm font-bold text-[#1A1D1E] leading-snug">
                    {prod.name}
                  </h3>
                </div>

                {/* Row 2: Category Name & Stok */}
                <div className="text-xs text-gray-500 font-medium">
                  {prod.category} • Stok: <strong className="text-[#1A1D1E] font-semibold tabular-nums">{prod.stockQty ?? 0}</strong> {prod.unit}
                </div>

                <div className="text-[10px] text-gray-400 font-medium">
                  Scan terakhir: {new Date(prod.lastUpdated).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>

                {/* Row 3: Shelf Price & Status Badge */}
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-[#F0F2F5]">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {calc.status === 'DANGER' ? 'Rugi' : calc.status === 'WARNING' ? 'Tipis' : 'Aman'} • {calc.activeMarginPercent.toFixed(1)}%
                  </span>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#15803D] tabular-nums">
                      {formatRupiah(prod.currentSellPrice)}
                    </span>
                  </div>
                </div>

                {hasRecommendation && (
                  <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#15803D]">Rekomendasi AI</span>
                        <div className="text-sm font-extrabold text-[#15803D] tabular-nums">
                          {formatRupiah(recommendedPrice)}
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#15803D] border border-emerald-200">
                        Margin {calc.recommendedMarginPercent.toFixed(1)}%
                      </span>
                    </div>
                    {!isDeleteMode && (
                      <div className="mt-2 flex gap-2" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onAcceptPrice?.(prod.id, recommendedPrice, prod.name)}
                          className="flex-1 h-9 rounded-lg bg-[#15803D] text-white text-[11px] font-bold hover:bg-[#15803D]/90"
                        >
                          Terapkan harga
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAlertModal({ ...prod, recommendedSellPrice: recommendedPrice })}
                          className="flex-1 h-9 rounded-lg border border-[#15803D] text-[#15803D] text-[11px] font-bold hover:bg-white"
                        >
                          Ketik pilihan sendiri
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar for Deletion */}
      {isDeleteMode && onDeleteProducts && (
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-40 bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#1A1D1E] px-1">
            <span>Terpilih: {selectedProductIds.length} produk</span>
          </div>

          <button
            disabled={selectedProductIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Terpilih ({selectedProductIds.length})</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xs bg-white border border-[#E5E7EB] p-5 rounded-2xl text-[#1A1D1E] font-sans text-center [&>button]:hidden shadow-xl">
          <DialogHeader className="border-b border-[#F0F2F5] pb-2">
            <DialogTitle className="text-sm font-bold text-[#1A1D1E] text-center">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-xs text-gray-600 font-medium leading-relaxed">
            {selectedProductIds.length === products.length
              ? 'Apakah Anda yakin ingin menghapus semua produk?'
              : `Apakah Anda yakin ingin menghapus ${selectedProductIds.length} produk terpilih?`}
          </div>
          <div className="flex gap-2 font-bold text-xs">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-10 rounded-xl bg-white border border-[#E5E7EB] text-[#1A1D1E] cursor-pointer hover:bg-gray-50"
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
              className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {selectedProductIds.length === products.length ? 'Hapus Semua' : 'Hapus'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-white border border-[#E5E7EB] p-5 rounded-2xl text-[#1A1D1E] font-sans [&>button]:hidden shadow-xl">
          <DialogHeader className="border-b border-[#F0F2F5] pb-2">
            <DialogTitle className="text-base font-bold text-[#1A1D1E]">
              Tambah Barang Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-3 mt-2 text-xs">
            {/* Field 1: Nama Produk */}
            <div>
              <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Nama Produk</label>
              <input
                type="text"
                placeholder="Contoh: Susu UHT Indomilk 200ml"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium"
                required
              />
            </div>

            {/* Field 2 & 4: Kategori Dropdown & Nama Stok/Satuan */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium"
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Makanan Instan">Makanan Instan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Satuan</label>
                <input
                  type="text"
                  placeholder="pcs / kg / renceng"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium"
                />
              </div>
            </div>

            {/* Field 3: Total Stok */}
            <div>
              <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Total Stok</label>
              <input
                type="number"
                placeholder="Contoh: 10"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium"
                required
              />
            </div>

            {/* Field 5 & 6: Harga Modal & Harga Jual */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Harga Modal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 4500"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-medium focus:outline-none focus:border-[#15803D]"
                  required
                />
              </div>

              <div>
                <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Harga Jual Rak (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 5500"
                  value={currentSellPrice}
                  onChange={(e) => setCurrentSellPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#15803D] font-bold focus:outline-none focus:border-[#15803D]"
                  required
                />
              </div>
            </div>

            {/* Computed Info Row */}
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E5E7EB] flex gap-3 text-[#1A1D1E]">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Profit Netto</span>
                <div className="text-sm font-extrabold text-[#1A1D1E] mt-0.5 tabular-nums">
                  {formatRupiah(computedProfit)}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Margin</span>
                <div className={`text-sm font-extrabold mt-0.5 tabular-nums ${computedMargin >= 15 ? 'text-[#15803D]' : (computedMargin < 5 ? 'text-red-600' : 'text-amber-600')}`}>
                  {computedMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-11 font-bold text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#1A1D1E] hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 h-11 font-bold text-xs rounded-xl bg-[#15803D] hover:bg-[#15803D]/90 text-white cursor-pointer shadow-sm"
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
