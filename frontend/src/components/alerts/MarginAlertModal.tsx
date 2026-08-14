import React, { useState } from 'react';
import { ProductItem, StoreSettings } from '@/types';
import { calculateMargin } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MarginAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  settings: StoreSettings;
  onAcceptPrice: (productId: string, newPrice: number) => void;
  onOverridePrice: (productId: string, overridePrice: number, note?: string) => void;
}

export const MarginAlertModal: React.FC<MarginAlertModalProps> = ({
  isOpen,
  onClose,
  product,
  settings,
  onAcceptPrice,
  onOverridePrice,
}) => {
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [overrideNote, setOverrideNote] = useState('');

  if (!product) return null;

  const analysis = calculateMargin(
    product.buyPrice,
    product.currentSellPrice,
    product.targetMarginPercent || settings.defaultTargetMarginPercent,
    settings.roundingStep,
    settings.dangerThresholdPercent
  );

  const handleAccept = () => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#16a34a', '#22c55e', '#15803d'],
    });

    onAcceptPrice(product.id, analysis.smartRoundedSellPrice);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(customPriceInput.replace(/\D/g, ''), 10);
    if (!isNaN(priceNum) && priceNum > 0) {
      onOverridePrice(product.id, priceNum, overrideNote);
      setIsOverrideMode(false);
      setCustomPriceInput('');
      onClose();
    }
  };

  const isCritical = analysis.status === 'DANGER';
  const isLoss = analysis.activeMarginPercent < 0;
  const untungNominalPerItem = analysis.smartRoundedSellPrice - product.buyPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-[#262830] bg-[#18191e] rounded-lg text-[#f3f4f6] font-sans">
        {/* Header Alert (Swiss Style) */}
        <div
          className={`p-4 border-b ${
            isCritical
              ? 'bg-[#3b181b] border-[#b91c1c]'
              : analysis.status === 'WARNING'
              ? 'bg-[#3d2612] border-[#b45309]'
              : 'bg-[#142e1f] border-[#166534]'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {isCritical ? (
                <AlertOctagon className="w-5 h-5 text-[#f87171]" />
              ) : analysis.status === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5 text-[#fbbf24]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-black/40 text-[#f3f4f6]">
                {isLoss ? 'Jual rugi' : isCritical ? 'Margin kritis' : analysis.status === 'WARNING' ? 'Untung tipis' : 'Margin aman'}
              </span>
              <DialogTitle className="text-base font-extrabold mt-1 text-[#f3f4f6] leading-snug">
                {product.name}
              </DialogTitle>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3.5">
          {/* 2-Column Price Comparison Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-[#131417] border border-[#262830]">
              <span className="text-[11px] text-[#9ca3af] font-medium block">Harga Modal Kulakan</span>
              <div className="text-sm font-extrabold text-[#f3f4f6] mt-0.5 tabular-nums">
                {formatRupiah(product.buyPrice)}
              </div>
              <span className="text-[10px] text-[#f87171] font-semibold block mt-0.5">
                Struk Agen Grosir
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#131417] border border-[#262830]">
              <span className="text-[11px] text-[#9ca3af] font-medium block">Harga Jual Rak Toko</span>
              <div className="text-sm font-extrabold text-[#f3f4f6] mt-0.5 tabular-nums">
                {formatRupiah(product.currentSellPrice)}
              </div>
              <span
                className={`text-[10px] font-bold mt-0.5 block tabular-nums ${
                  isCritical ? 'text-[#f87171]' : 'text-[#fbbf24]'
                }`}
              >
                Margin: {analysis.activeMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {!isOverrideMode ? (
            /* Swiss Recommendation Action Box */
            <div className="p-4 rounded-lg bg-[#131417] border border-[#166534] space-y-3">
              <div className="flex items-baseline justify-between border-b border-[#262830] pb-2.5">
                <div>
                  <span className="text-xs font-bold text-[#22c55e] block">
                    Rekomendasi Harga Jual Baru
                  </span>
                  <div className="text-3xl font-extrabold text-[#f3f4f6] tracking-tight tabular-nums mt-0.5">
                    {formatRupiah(analysis.smartRoundedSellPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#9ca3af] block font-medium">Untung Bersih</span>
                  <div className="text-xs font-extrabold text-[#22c55e] tabular-nums">
                    +{formatRupiah(untungNominalPerItem)} ({analysis.recommendedMarginPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  className="w-full min-h-[52px] px-4 rounded-lg font-bold text-xs bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center justify-between transition-colors cursor-pointer"
                  onClick={handleAccept}
                >
                  <span>Terapkan harga {formatRupiah(analysis.smartRoundedSellPrice)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  className="w-full min-h-[48px] px-4 rounded-lg font-semibold text-xs text-[#9ca3af] hover:text-[#f3f4f6] bg-[#18191e] border border-[#262830] hover:border-[#373a46] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  onClick={() => {
                    setIsOverrideMode(true);
                    setCustomPriceInput(analysis.smartRoundedSellPrice.toString());
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Ketik harga pilihan sendiri</span>
                </button>
              </div>
            </div>
          ) : (
            /* Manual Override Form */
            <form onSubmit={handleCustomSubmit} className="p-3.5 rounded-lg bg-[#131417] border border-[#262830] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f3f4f6]">
                  Ketik Harga Jual Pilihan
                </span>
                <button
                  type="button"
                  onClick={() => setIsOverrideMode(false)}
                  className="text-xs font-semibold text-[#9ca3af] hover:text-[#f3f4f6] cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <input
                type="number"
                placeholder="Contoh: 3500"
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full h-[52px] min-h-[52px] px-3 rounded-lg bg-[#18191e] border border-[#262830] text-lg font-extrabold text-[#22c55e] tabular-nums focus:outline-none focus:border-[#16a34a]"
                autoFocus
              />

              {parseInt(customPriceInput, 10) > 0 && (
                <div className="text-xs text-[#f3f4f6] bg-[#18191e] p-2.5 rounded-lg border border-[#262830]">
                  {(() => {
                    const price = parseInt(customPriceInput, 10);
                    const custMargin = ((price - product.buyPrice) / price) * 100;
                    return (
                      <div className="flex items-center justify-between tabular-nums">
                        <span className="text-[#9ca3af]">Margin baru:</span>
                        <strong className={`font-extrabold ${custMargin >= 10 ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                          {custMargin.toFixed(1)}% (+{formatRupiah(price - product.buyPrice)}/item)
                        </strong>
                      </div>
                    );
                  })()}
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[52px] rounded-lg font-bold text-xs bg-[#16a34a] hover:bg-[#15803d] text-white transition-colors cursor-pointer disabled:opacity-50"
                disabled={!customPriceInput || parseInt(customPriceInput, 10) <= 0}
              >
                Simpan harga baru
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
