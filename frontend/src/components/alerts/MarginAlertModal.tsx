import React, { useState, useEffect } from 'react';
import { ProductItem, StoreSettings } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import confetti from 'canvas-confetti';

interface MarginAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  settings: StoreSettings;
  onAcceptPrice: (productId: string, newPrice: number, name?: string) => void;
  onOverridePrice: (
    productId: string,
    overridePrice: number,
    category?: string,
    stock?: number,
    name?: string,
    note?: string,
    unit?: string,
    buyPrice?: number
  ) => void;
}

export const MarginAlertModal: React.FC<MarginAlertModalProps> = ({
  isOpen,
  onClose,
  product,
  onAcceptPrice,
  onOverridePrice,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [buyPriceInput, setBuyPriceInput] = useState('');
  const [customPriceInput, setCustomPriceInput] = useState('');
  const recommendedPrice = product?.recommendedSellPrice;

  // Sync state with product data when modal opens or product changes
  useEffect(() => {
    if (product) {
      setNameInput(product.name || '');
      setCategoryInput(product.category || 'Sembako');
      setStockInput(product.stockQty?.toString() || '0');
      setUnitInput(product.unit || 'pcs');
      setBuyPriceInput(product.buyPrice?.toString() || '0');
      setCustomPriceInput((product.recommendedSellPrice ?? product.currentSellPrice)?.toString() || '0');
    }
  }, [product]);

  if (!product) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customPriceInput);
    const stockNum = parseInt(stockInput, 10);
    const buyNum = parseFloat(buyPriceInput);

    if (priceNum >= 0 && nameInput.trim()) {
      onOverridePrice(
        product.id,
        priceNum,
        categoryInput,
        isNaN(stockNum) ? undefined : stockNum,
        nameInput.trim(),
        undefined, // note
        unitInput.trim(),
        buyNum
      );
      
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#10B981', '#22c55e', '#15803D'],
      });
      
      onClose();
    }
  };

  const handleAcceptRecommendation = () => {
    if (recommendedPrice === undefined || !nameInput.trim()) return;
    onAcceptPrice(product.id, recommendedPrice, nameInput.trim());
    onClose();
  };

  // Real-time calculations inside the form
  const parsedBuyPrice = parseFloat(buyPriceInput) || 0;
  const parsedSellPrice = parseFloat(customPriceInput) || 0;
  const computedProfit = parsedSellPrice - parsedBuyPrice;
  const computedMargin = parsedSellPrice > 0 ? (computedProfit / parsedSellPrice) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border border-[#E5E7EB] p-5 rounded-2xl text-[#1A1D1E] font-sans [&>button]:hidden shadow-xl">
        <DialogHeader className="border-b border-[#F0F2F5] pb-2">
          <DialogTitle className="text-base font-bold text-[#1A1D1E]">
            Detail & Edit Barang
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCustomSubmit} className="space-y-3 mt-2 text-xs">
          {/* Field 1: Nama Produk */}
          <div>
            <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Nama Produk</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium"
              required
            />
          </div>

          {/* Field 2 & 4: Kategori Dropdown & Nama Stok/Satuan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Kategori</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
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
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium"
                required
              />
            </div>
          </div>

          {recommendedPrice !== undefined && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px]">
              <span className="font-semibold text-emerald-800">
                Rekomendasi AI: <strong>{formatRupiah(recommendedPrice)}</strong>
              </span>
              <button
                type="button"
                onClick={handleAcceptRecommendation}
                className="shrink-0 rounded-lg bg-[#15803D] px-2.5 py-1.5 font-bold text-white hover:bg-[#15803D]/90"
              >
                Terapkan saran AI
              </button>
            </div>
          )}

          {/* Field 3: Total Stok */}
          <div>
            <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Total Stok</label>
            <input
              type="number"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
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
                value={buyPriceInput}
                onChange={(e) => setBuyPriceInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-medium focus:outline-none focus:border-[#15803D]"
                required
              />
            </div>

            <div>
              <label className="text-[#1A1D1E] font-bold block mb-1 text-xs">Harga Jual Rak (Rp)</label>
              <input
                type="number"
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#15803D] font-bold focus:outline-none focus:border-[#15803D]"
                required
              />
            </div>
          </div>

          {/* Calculated Data: Profit Netto & Margin */}
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

          {/* Action buttons */}
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
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
  );
};
