import React, { useState, useEffect } from 'react';
import { ProductItem, StoreSettings } from '@/types';
import { calculateMargin } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Pencil,
} from 'lucide-react';
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

  // Sync state with product data when modal opens or product changes
  useEffect(() => {
    if (product) {
      setNameInput(product.name || '');
      setCategoryInput(product.category || 'Sembako');
      setStockInput(product.stockQty?.toString() || '0');
      setUnitInput(product.unit || 'pcs');
      setBuyPriceInput(product.buyPrice?.toString() || '0');
      setCustomPriceInput(product.currentSellPrice?.toString() || '0');
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

  // Real-time calculations inside the form
  const parsedBuyPrice = parseFloat(buyPriceInput) || 0;
  const parsedSellPrice = parseFloat(customPriceInput) || 0;
  const computedProfit = parsedSellPrice - parsedBuyPrice;
  const computedMargin = parsedSellPrice > 0 ? (computedProfit / parsedSellPrice) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-2 border-[#1A1A1A] p-6 rounded-lg text-[#1A1A1A] font-sans [&>button]:hidden">
        <DialogHeader className="border-b-2 border-gray-200 pb-3">
          <DialogTitle className="text-2xl font-black text-[#1A1A1A]">
            Detail & Edit Barang
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCustomSubmit} className="space-y-4 mt-3 text-lg">
          {/* Field 1: Nama Produk */}
          <div>
            <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Nama Produk</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
              required
            />
          </div>

          {/* Field 2 & 4: Kategori Dropdown & Nama Stok/Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Kategori</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
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
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
                required
              />
            </div>
          </div>

          {/* Field 3: Total Stok */}
          <div>
            <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Total Stok</label>
            <input
              type="number"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
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
                value={buyPriceInput}
                onChange={(e) => setBuyPriceInput(e.target.value)}
                className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[#1A1A1A] font-extrabold block mb-1 text-base">Harga Jual Rak (Rp)</label>
              <input
                type="number"
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#15803D] focus:outline-none focus:border-[#15803D] font-bold"
                required
              />
            </div>
          </div>

          {/* Calculated Data: Profit Netto & Margin in massive bold boxes */}
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

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
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
  );
};
