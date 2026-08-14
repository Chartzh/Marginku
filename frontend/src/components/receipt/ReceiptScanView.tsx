import React, { useState } from 'react';
import { ProductItem, ReceiptScanData, StoreSettings } from '@/types';
import { demoReceipts } from '@/data/mockProducts';
import { formatRupiah } from '@/lib/utils';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptScanViewProps {
  products: ProductItem[];
  onUpdateProductBuyPrice?: (productName: string, newBuyPrice: number) => void;
  onUpdateBuyPrices?: (updatedItems: { productId: string; newBuyPrice: number }[]) => void;
  onOpenAlertModal?: (product: ProductItem) => void;
}

export const ReceiptScanView: React.FC<ReceiptScanViewProps> = ({
  products,
  onUpdateProductBuyPrice,
  onUpdateBuyPrices,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptScanData | null>(demoReceipts[0]);
  const [syncApplied, setSyncApplied] = useState(false);

  const simulateReceiptScan = () => {
    setIsProcessing(true);
    setSyncApplied(false);

    setTimeout(() => {
      setActiveReceipt(demoReceipts[0]);
      setIsProcessing(false);
    }, 500);
  };

  const handleSyncAllPrices = () => {
    if (!activeReceipt) return;

    const updates: { productId: string; newBuyPrice: number }[] = [];

    activeReceipt.items.forEach((item) => {
      const matchName = item.matchedProductName || item.rawName;
      const match = products.find(
        (p) => p.name.toLowerCase() === matchName.toLowerCase()
      );
      if (match) {
        if (onUpdateProductBuyPrice) {
          onUpdateProductBuyPrice(match.name, item.unitBuyPrice);
        }
        updates.push({
          productId: match.id,
          newBuyPrice: item.unitBuyPrice,
        });
      }
    });

    if (onUpdateBuyPrices) {
      onUpdateBuyPrices(updates);
    }
    setSyncApplied(true);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#22c55e', '#15803d'],
    });
  };

  return (
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* Swiss Style Title Header */}
      <div className="border-b border-[#262830] pb-2">
        <h1 className="text-xl font-extrabold text-[#f3f4f6] tracking-tight">
          Scan Nota Grosir
        </h1>
        <p className="text-xs text-[#9ca3af] mt-0.5">
          Perbarui harga modal kulakan langsung dari struk agen belanja
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-3">
        <div className="flex items-center justify-between border-b border-[#262830] pb-3">
          <div>
            <div className="text-xs font-bold text-[#f3f4f6]">
              Ekstraksi Nota Agen Otomatis
            </div>
            <div className="text-xs text-[#9ca3af] mt-0.5">
              Mendeteksi barang kulakan & kenaikan harga beli
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#131417] border border-[#262830] flex items-center justify-center text-[#f3f4f6]">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={simulateReceiptScan}
            disabled={isProcessing}
            className="min-h-[52px] px-3 rounded-lg font-bold text-xs bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membaca struk...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Simulasi scan nota</span>
              </>
            )}
          </button>

          <button
            onClick={simulateReceiptScan}
            disabled={isProcessing}
            className="min-h-[52px] px-3 rounded-lg font-bold text-xs bg-[#131417] hover:bg-[#262830] text-[#f3f4f6] border border-[#262830] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Upload foto struk</span>
          </button>
        </div>
      </div>

      {/* Extracted Receipt Details (Swiss Financial Ledger) */}
      {activeReceipt && (
        <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-[#262830] pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#f3f4f6]">
                {activeReceipt.storeName}
              </h2>
              <div className="text-xs text-[#9ca3af] mt-0.5 tabular-nums">
                {activeReceipt.date} • {activeReceipt.items.length} Barang Terdeteksi
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#9ca3af] font-medium block">Total Belanja</span>
              <div className="text-sm font-extrabold text-[#f3f4f6] tabular-nums">
                {formatRupiah(activeReceipt.totalAmount)}
              </div>
            </div>
          </div>

          {/* Item Breakdown List */}
          <div className="space-y-2">
            {activeReceipt.items.map((item) => {
              const matchName = item.matchedProductName || item.rawName;
              const currentProduct = products.find(
                (p) => p.name.toLowerCase() === matchName.toLowerCase()
              );

              const oldBuyPrice = currentProduct?.buyPrice || item.unitBuyPrice;
              const priceIncreased = item.unitBuyPrice > oldBuyPrice;
              const selisihKenaikan = item.unitBuyPrice - oldBuyPrice;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#131417] border border-[#262830] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#f3f4f6]">
                        {matchName}
                      </h3>
                      <div className="text-xs text-[#9ca3af] mt-0.5">
                        {item.qty} {item.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#9ca3af] block">Modal Baru</span>
                      <div className="text-xs font-extrabold text-[#f3f4f6] tabular-nums">
                        {formatRupiah(item.unitBuyPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#262830] text-xs">
                    {priceIncreased ? (
                      <span className="text-[#f87171] font-bold flex items-center gap-1 tabular-nums text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Modal naik +{formatRupiah(selisihKenaikan)}/item</span>
                      </span>
                    ) : (
                      <span className="text-[#9ca3af] font-medium flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>Modal tetap</span>
                      </span>
                    )}

                    <span className="text-xs text-[#9ca3af] tabular-nums font-bold">
                      Subtotal: {formatRupiah(item.totalBuyPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sync Button (Min Height 52px) */}
          <button
            onClick={handleSyncAllPrices}
            disabled={syncApplied}
            className={`w-full min-h-[52px] px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              syncApplied
                ? 'bg-[#131417] border border-[#262830] text-[#22c55e]'
                : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
            }`}
          >
            {syncApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <span>Seluruh harga modal telah disinkronkan</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Sinkronkan ke database warung ({activeReceipt.items.length} barang)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
