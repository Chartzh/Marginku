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
    <div className="space-y-6 pb-28 text-[#1A1A1A] font-sans bg-white min-h-screen">
      {/* 1. Header Area */}
      <div className="-mx-4 -mt-4 mb-6 bg-[#15803D] p-5 text-white flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-none">
            Marginku
          </h1>
          <p className="text-lg font-medium text-white/90 mt-1">
            Warung Berkah Jaya
          </p>
        </div>

        <div>
          {!isDeleteMode && onAddNewProduct && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="min-h-[60px] px-5 rounded-lg bg-white text-[#15803D] hover:bg-white/95 font-extrabold text-lg flex items-center gap-2 transition-colors cursor-pointer border-2 border-white shadow"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Pills Area */}
      <div className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`min-h-[60px] px-6 rounded-lg font-black text-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap border-2 ${
            statusFilter === 'ALL'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-gray-100'
          }`}
        >
          Semua ({products.length})
        </button>

        <button
          onClick={() => setStatusFilter('DANGER')}
          className={`min-h-[60px] px-6 rounded-lg font-black text-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap border-2 ${
            statusFilter === 'DANGER'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-red-600 border-[#1A1A1A] hover:bg-red-50'
          }`}
        >
          <AlertOctagon className="w-5 h-5 text-red-600" />
          <span>Rugi ({metrics.dangerCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('WARNING')}
          className={`min-h-[60px] px-6 rounded-lg font-black text-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap border-2 ${
            statusFilter === 'WARNING'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-amber-600 border-[#1A1A1A] hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Tipis ({metrics.warningCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('HEALTHY')}
          className={`min-h-[60px] px-6 rounded-lg font-black text-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap border-2 ${
            statusFilter === 'HEALTHY'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white text-[#15803D] border-[#1A1A1A] hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
          <span>Aman ({metrics.healthyCount})</span>
        </button>
      </div>

      {/* 2b. Search & Date Filter Area */}
      {products.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-6 h-6 text-[#1A1A1A] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[60px] pl-12 pr-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] placeholder:text-gray-500 focus:outline-none focus:border-[#15803D] font-bold"
              />
            </div>

            {/* Date Input */}
            <div className="relative w-1/3 min-w-[140px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-[60px] px-3 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold dark:[color-scheme:light]"
              />
            </div>

            {/* Trash Delete Toggle Button */}
            {onDeleteProducts && (
              <button
                onClick={() => {
                  setIsDeleteMode(!isDeleteMode);
                  setSelectedProductIds([]);
                }}
                className={`w-[60px] h-[60px] rounded-lg flex items-center justify-center transition-colors cursor-pointer border-2 ${
                  isDeleteMode
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100'
                }`}
                title={isDeleteMode ? 'Batal Hapus' : 'Hapus Barang'}
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>

          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
              className="w-full h-[40px] text-center bg-gray-100 border border-[#1A1A1A] text-sm font-bold text-[#1A1A1A] rounded hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Selection Utility Row */}
      {isDeleteMode && filteredProducts.length > 0 && (
        <div className="flex justify-between items-center px-1 py-1 text-base text-gray-700">
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
            className="flex items-center gap-2 hover:text-black transition-colors cursor-pointer font-extrabold"
          >
            <input
              type="checkbox"
              checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
              readOnly
              className="w-6 h-6 cursor-pointer accent-red-600"
            />
            <span>{selectedProductIds.length === filteredProducts.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
          </button>
          <span className="font-extrabold">
            {selectedProductIds.length} dari {filteredProducts.length} terpilih
          </span>
        </div>
      )}

      {/* 3. Product List Area (Alternating white/subtle gray) */}
      <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-[#F9F9F9]">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-lg font-bold">Barang tidak ditemukan</p>
          </div>
        ) : (
          filteredProducts.map((prod, index) => {
            const calc = calculateMargin(
              prod.buyPrice,
              prod.currentSellPrice,
              prod.targetMarginPercent || settings.defaultTargetMarginPercent,
              settings.roundingStep,
              settings.dangerThresholdPercent
            );

            const isEven = index % 2 === 0;
            const statusColor = calc.status === 'DANGER'
              ? 'text-red-600'
              : calc.status === 'WARNING'
              ? 'text-amber-600'
              : 'text-[#15803D]';

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
                className={`p-5 flex flex-col gap-2 relative transition-colors cursor-pointer select-none border-b border-gray-200 ${
                  isEven ? 'bg-[#F9F9F9]' : 'bg-[#FFFFFF]'
                } ${
                  isSelected ? 'bg-red-50 border-l-4 border-l-red-600' : 'border-l-4 border-l-transparent'
                }`}
              >
                {isDeleteMode && (
                  <div className="absolute right-4 top-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-6 h-6 accent-red-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Row 1: Product Title (Bold, Min 20px) */}
                <div className="pr-12">
                  <h3 className="text-[20px] font-black text-[#1A1A1A] leading-tight">
                    {prod.name}
                  </h3>
                </div>

                {/* Row 2: Category Name | Stok: Qty */}
                <div className="text-[16px] text-gray-700 font-bold">
                  {prod.category} | Stok: {prod.stockQty ?? 0} {prod.unit}
                </div>

                {/* Row 3 (Right Aligned): Shelf Price & Status Badge */}
                <div className="flex justify-between items-end mt-2">
                  {/* Status Badge Tag */}
                  <span className={`text-[16px] font-black uppercase ${statusColor}`}>
                    [{calc.status === 'DANGER' ? 'Rugi' : calc.status === 'WARNING' ? 'Tipis' : 'Aman'} - {calc.activeMarginPercent.toFixed(1)}%]
                  </span>

                  <div className="text-right">
                    <span className="text-[24px] font-black text-[#15803D] tabular-nums">
                      {formatRupiah(prod.currentSellPrice)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
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

      {/* Add New Product Modal (Dropdown + Large touch targets) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#1A1A1A] p-6 rounded-lg text-[#1A1A1A] font-sans [&>button]:hidden">
          <DialogHeader className="border-b-2 border-gray-200 pb-3">
            <DialogTitle className="text-2xl font-black text-[#1A1A1A]">
              Tambah Barang Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 mt-3 text-lg">
            {/* Field 1: Nama Produk */}
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

            {/* Field 2 & 4: Kategori Dropdown & Nama Stok/Satuan */}
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

            {/* Field 3: Total Stok */}
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

            {/* Field 5 & 6: Harga Modal & Harga Jual */}
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

            {/* Computed Info Row */}
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
