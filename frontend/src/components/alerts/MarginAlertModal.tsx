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
      colors: ['#1B6440', '#86D6BE', '#154E30'],
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
      <DialogContent className="max-w-md p-0 overflow-hidden border-[#E5E7EB] bg-white rounded-3xl text-[#1A1D1E] font-sans shadow-2xl">
        {/* Header Alert Banner */}
        <div
          className={`p-5 border-b ${isCritical
            ? 'bg-[#FEE2E2] border-[#FECACA]'
            : analysis.status === 'WARNING'
              ? 'bg-[#FEF3C7] border-[#FDE68A]'
              : 'bg-[#EBF5F0] border-[#D1E7DD]'
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {isCritical ? (
                <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
              ) : analysis.status === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5 text-[#B45309]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#1B6440]" />
              )}
            </div>
            <div className="flex-1">
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${isCritical ? 'bg-[#DC2626] text-white' : analysis.status === 'WARNING' ? 'bg-[#B45309] text-white' : 'bg-[#1B6440] text-white'
                }`}>
                {isLoss ? 'Jual rugi' : isCritical ? 'Margin kritis' : analysis.status === 'WARNING' ? 'Untung tipis' : 'Margin aman'}
              </span>
              <DialogTitle className="text-lg font-extrabold mt-1 text-[#1A1D1E] leading-snug">
                {product.name}
              </DialogTitle>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 2-Column Price Comparison Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] font-medium block">Harga Modal Kulakan</span>
              <div className="text-base font-extrabold text-[#1A1D1E] mt-0.5 tabular-nums">
                {formatRupiah(product.buyPrice)}
              </div>
              <span className="text-[10px] text-[#DC2626] font-semibold block mt-0.5">
                Struk Agen Grosir
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] font-medium block">Harga Jual Rak Toko</span>
              <div className="text-base font-extrabold text-[#1A1D1E] mt-0.5 tabular-nums">
                {formatRupiah(product.currentSellPrice)}
              </div>
              <span
                className={`text-[10px] font-bold mt-0.5 block tabular-nums ${isCritical ? 'text-[#DC2626]' : 'text-[#B45309]'
                  }`}
              >
                Margin: {analysis.activeMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {!isOverrideMode ? (
            /* Recommendation Action Box */
            <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-[#D1E7DD] space-y-3.5">
              <div className="flex items-baseline justify-between border-b border-[#D1E7DD] pb-2.5">
                <div>
                  <span className="text-xs font-bold text-[#1B6440] block">
                    Rekomendasi Harga Jual Baru
                  </span>
                  <div className="text-2xl font-extrabold text-[#1B6440] tracking-tight tabular-nums mt-0.5">
                    {formatRupiah(analysis.smartRoundedSellPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#6B7280] block font-medium">Untung Bersih</span>
                  <div className="text-xs font-bold text-[#1B6440] tabular-nums">
                    +{formatRupiah(untungNominalPerItem)} ({analysis.recommendedMarginPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  className="w-full h-[50px] px-5 rounded-full font-bold text-xs bg-[#1B6440] hover:bg-[#154E30] text-white flex items-center justify-between transition-all cursor-pointer shadow-floating active:scale-[0.98] group"
                  onClick={handleAccept}
                >
                  <span>Terapkan harga {formatRupiah(analysis.smartRoundedSellPrice)}</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>

                <button
                  className="w-full h-[46px] px-4 rounded-full font-bold text-xs text-[#6B7280] hover:text-[#1A1D1E] bg-white border border-[#E5E7EB] hover:bg-[#F4F6F5] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
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
            <form onSubmit={handleCustomSubmit} className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1D1E]">
                  Ketik Harga Jual Pilihan
                </span>
                <button
                  type="button"
                  onClick={() => setIsOverrideMode(false)}
                  className="text-xs font-semibold text-[#6B7280] hover:text-[#1A1D1E] cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <input
                type="number"
                placeholder="Contoh: 3500"
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full h-[48px] px-4 rounded-2xl bg-white border border-[#E5E7EB] text-lg font-extrabold text-[#1B6440] tabular-nums focus:outline-none focus:border-[#1B6440]"
                autoFocus
              />

              {parseInt(customPriceInput, 10) > 0 && (
                <div className="text-xs text-[#1A1D1E] bg-white p-3 rounded-xl border border-[#E5E7EB]">
                  {(() => {
                    const price = parseInt(customPriceInput, 10);
                    const custMargin = ((price - product.buyPrice) / price) * 100;
                    return (
                      <div className="flex items-center justify-between tabular-nums">
                        <span className="text-[#6B7280]">Margin baru:</span>
                        <strong className={`font-bold ${custMargin >= 10 ? 'text-[#1B6440]' : 'text-[#DC2626]'}`}>
                          {custMargin.toFixed(1)}% (+{formatRupiah(price - product.buyPrice)}/item)
                        </strong>
                      </div>
                    );
                  })()}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-[48px] rounded-full font-bold text-xs bg-[#1B6440] hover:bg-[#154E30] text-white transition-all cursor-pointer shadow-floating disabled:opacity-50"
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
