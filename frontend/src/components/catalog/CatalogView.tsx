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
  ArrowRight,
  SlidersHorizontal,
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
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  settings,
  onOpenAlertModal,
  onAddNewProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MarginStatus>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
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
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* Swiss Headline & Action Header */}
      <div className="flex items-end justify-between border-b border-[#262830] pb-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#f3f4f6] tracking-tight">
            Katalog Produk
          </h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            Daftar harga rak dan kesehatan margin toko
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-[44px] px-3.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Swiss Segmented Filter Tabs (Clean, Zero Bulky Cards) */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#18191e] border border-[#262830] text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`py-2 px-1 rounded font-bold transition-colors cursor-pointer text-center ${
            statusFilter === 'ALL'
              ? 'bg-[#262830] text-[#f3f4f6]'
              : 'text-[#9ca3af] hover:text-[#f3f4f6]'
          }`}
        >
          Semua ({products.length})
        </button>

        <button
          onClick={() => setStatusFilter('DANGER')}
          className={`py-2 px-1 rounded font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            statusFilter === 'DANGER'
              ? 'bg-[#3b181b] text-[#f87171] border border-[#b91c1c]'
              : 'text-[#f87171] hover:bg-[#262830]'
          }`}
        >
          <AlertOctagon className="w-3 h-3" />
          <span>Rugi ({metrics.dangerCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('WARNING')}
          className={`py-2 px-1 rounded font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            statusFilter === 'WARNING'
              ? 'bg-[#3d2612] text-[#fbbf24] border border-[#b45309]'
              : 'text-[#fbbf24] hover:bg-[#262830]'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Tipis ({metrics.warningCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('HEALTHY')}
          className={`py-2 px-1 rounded font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            statusFilter === 'HEALTHY'
              ? 'bg-[#142e1f] text-[#22c55e] border border-[#166534]'
              : 'text-[#22c55e] hover:bg-[#262830]'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Aman ({metrics.healthyCount})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari barang atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[48px] pl-10 pr-3 rounded-lg bg-[#18191e] border border-[#262830] text-xs text-[#f3f4f6] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#16a34a]"
        />
      </div>

      {/* Clean Swiss Financial Ledger Rows (Uniform Neutral Border, Clear Typography) */}
      <div className="bg-[#18191e] border border-[#262830] rounded-lg divide-y divide-[#262830] overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-[#9ca3af]">
            <Package className="w-6 h-6 mx-auto mb-1.5 text-[#6b7280]" />
            <p className="text-xs font-bold">Barang tidak ditemukan</p>
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

            const untungNominal = prod.currentSellPrice - prod.buyPrice;
            const isRugi = untungNominal < 0;

            return (
              <div
                key={prod.id}
                onClick={() => onOpenAlertModal(prod)}
                className="p-3.5 hover:bg-[#1f2127] transition-colors cursor-pointer select-none space-y-2"
              >
                {/* Row Header: Name & Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#f3f4f6] truncate">
                      {prod.name}
                    </h3>
                    <div className="text-xs text-[#9ca3af] mt-0.5">
                      {prod.category} • Stok: <strong className="text-[#f3f4f6] font-semibold tabular-nums">{prod.stockQty || 0}</strong> {prod.unit}
                    </div>
                  </div>

                  {/* Main Sell Price */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-[#f3f4f6] tabular-nums">
                      {formatRupiah(prod.currentSellPrice)}
                    </div>
                    <div className="text-[10px] text-[#9ca3af]">Harga rak</div>
                  </div>
                </div>

                {/* Row Sub-Data: Modal, Untung, Margin Badge */}
                <div className="flex items-center justify-between pt-1.5 text-xs border-t border-[#262830]/60">
                  <div className="text-xs text-[#9ca3af]">
                    Modal: <strong className="text-[#f3f4f6] font-medium tabular-nums">{formatRupiah(prod.buyPrice)}</strong>
                    <span className="mx-1.5 text-[#373a46]">•</span>
                    <span className={`font-bold tabular-nums ${isRugi ? 'text-[#f87171]' : 'text-[#22c55e]'}`}>
                      {isRugi ? 'Rugi ' : 'Untung +'}{formatRupiah(Math.abs(untungNominal))}
                    </span>
                  </div>

                  {/* Triple-Redundancy Margin Tag */}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold tabular-nums inline-flex items-center gap-1 shrink-0 ${
                      calc.status === 'DANGER'
                        ? 'bg-[#3b181b] text-[#f87171] border border-[#b91c1c]'
                        : calc.status === 'WARNING'
                        ? 'bg-[#3d2612] text-[#fbbf24] border border-[#b45309]'
                        : 'bg-[#142e1f] text-[#22c55e] border border-[#166534]'
                    }`}
                  >
                    {calc.status === 'DANGER' && <AlertOctagon className="w-3 h-3" />}
                    {calc.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                    {calc.status === 'HEALTHY' && <CheckCircle2 className="w-3 h-3" />}
                    <span>{calc.activeMarginPercent.toFixed(1)}%</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-[#18191e] border-[#262830] p-5 rounded-lg text-[#f3f4f6] font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#f3f4f6]">
              Tambah Barang Baru ke Toko
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-3 mt-2 text-xs">
            <div>
              <label className="text-[#f3f4f6] font-bold block mb-1">Nama Produk</label>
              <input
                type="text"
                placeholder="Contoh: Susu UHT Indomilk 200ml"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[48px] px-3 rounded-lg bg-[#131417] border border-[#262830] text-xs text-[#f3f4f6] focus:outline-none focus:border-[#16a34a]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#f3f4f6] font-bold block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-[48px] px-3 rounded-lg bg-[#131417] border border-[#262830] text-xs text-[#f3f4f6] focus:outline-none"
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Makanan Instan">Makanan Instan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="text-[#f3f4f6] font-bold block mb-1">Satuan</label>
                <input
                  type="text"
                  placeholder="pcs / kg / renceng"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-[48px] px-3 rounded-lg bg-[#131417] border border-[#262830] text-xs text-[#f3f4f6] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#f3f4f6] font-bold block mb-1">Harga Modal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 4500"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full h-[48px] px-3 rounded-lg bg-[#131417] border border-[#262830] text-xs text-[#f3f4f6] font-bold tabular-nums focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>

              <div>
                <label className="text-[#f3f4f6] font-bold block mb-1">Harga Jual Rak (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 5500"
                  value={currentSellPrice}
                  onChange={(e) => setCurrentSellPrice(e.target.value)}
                  className="w-full h-[48px] px-3 rounded-lg bg-[#131417] border border-[#262830] text-xs text-[#22c55e] font-bold tabular-nums focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-[52px] font-bold text-xs rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan ke katalog warung</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
