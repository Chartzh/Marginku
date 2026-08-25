import React from 'react';
import { ProductItem, StoreSettings } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Camera,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DashboardMobileProps {
  products: ProductItem[];
  settings: StoreSettings;
  isEasyMode?: boolean;
  onToggleEasyMode?: () => void;
  onOpenAlertModal: (product: ProductItem) => void;
  onNavigateTab: (tab: 'DASHBOARD' | 'SCAN_SHELF' | 'SCAN_RECEIPT' | 'CATALOG' | 'SETTINGS') => void;
}

export const DashboardMobile: React.FC<DashboardMobileProps> = ({
  products,
  settings,
  onOpenAlertModal,
  onNavigateTab,
}) => {
  const criticalProducts = products.filter((p) => {
    const margin = ((p.currentSellPrice - p.buyPrice) / p.currentSellPrice) * 100;
    return margin < settings.dangerThresholdPercent;
  });

  const thinMarginProducts = products.filter((p) => {
    const margin = ((p.currentSellPrice - p.buyPrice) / p.currentSellPrice) * 100;
    return margin >= settings.dangerThresholdPercent && margin < settings.defaultTargetMarginPercent;
  });

  const safeProducts = products.filter((p) => {
    const margin = ((p.currentSellPrice - p.buyPrice) / p.currentSellPrice) * 100;
    return margin >= settings.defaultTargetMarginPercent;
  });

  let totalProtectedProfit = 0;
  criticalProducts.forEach((p) => {
    const targetPrice = Math.ceil((p.buyPrice / (1 - (p.targetMarginPercent || 15) / 100)) / 500) * 500;
    totalProtectedProfit += (targetPrice - p.currentSellPrice) * (p.stockQty || 10);
  });

  return (
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* 1. Main KPI Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4 shadow-card">
        <div className="border-b border-[#F0F2F5] pb-3">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold mb-1">
            <span>Laporan Margin Toko</span>
            <span className="text-[#1B6440] flex items-center gap-1 font-bold">
              <ShieldCheck className="w-4 h-4" />
              Harga terlindungi
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1D1E] tracking-tight tabular-nums mt-1">
            +{formatRupiah(totalProtectedProfit)}
          </div>

          <div className="text-xs text-[#6B7280] mt-1 font-medium">
            Total potensi rugi yang dapat dicegah hari ini
          </div>
        </div>

        {/* 3-Column Status Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB] hover:border-[#DC2626] text-left transition-all cursor-pointer shadow-sm"
          >
            <div className="text-[11px] text-[#DC2626] font-bold flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              Jual rugi
            </div>
            <div className="text-xl font-extrabold text-[#1A1D1E] mt-1 tabular-nums">
              {criticalProducts.length}
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB] hover:border-[#B45309] text-left transition-all cursor-pointer shadow-sm"
          >
            <div className="text-[11px] text-[#B45309] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Untung tipis
            </div>
            <div className="text-xl font-extrabold text-[#1A1D1E] mt-1 tabular-nums">
              {thinMarginProducts.length}
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="bg-[#EBF5F0] p-3 rounded-2xl border border-[#D1E7DD] hover:border-[#1B6440] text-left transition-all cursor-pointer shadow-sm"
          >
            <div className="text-[11px] text-[#1B6440] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Margin aman
            </div>
            <div className="text-xl font-extrabold text-[#1B6440] mt-1 tabular-nums">
              {safeProducts.length}
            </div>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => onNavigateTab('SCAN_SHELF')}
          className="w-full h-[52px] px-5 rounded-full bg-[#1B6440] hover:bg-[#154E30] text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-floating active:scale-[0.98] group"
        >
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Periksa label harga rak sekarang</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>

      {/* 2. Alert List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5 pt-1">
          <h2 className="text-xs font-bold text-[#6B7280]">
            Daftar barang perlu penyesuaian harga ({criticalProducts.length})
          </h2>
          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="text-xs font-bold text-[#1B6440] hover:underline cursor-pointer"
          >
            Lihat semua katalog
          </button>
        </div>

        {criticalProducts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] text-center space-y-1 shadow-card">
            <CheckCircle2 className="w-8 h-8 text-[#1B6440] mx-auto mb-1.5" />
            <div className="text-xs font-bold text-[#1A1D1E]">Seluruh harga di rak sudah aman</div>
            <div className="text-xs text-[#6B7280]">Tidak ada barang yang dijual di bawah harga modal</div>
          </div>
        ) : (
          criticalProducts.map((prod) => {
            const activeMargin = ((prod.currentSellPrice - prod.buyPrice) / prod.currentSellPrice) * 100;
            const targetPrice = Math.ceil((prod.buyPrice / (1 - (prod.targetMarginPercent || 15) / 100)) / 500) * 500;
            const profitGain = targetPrice - prod.buyPrice;

            return (
              <div
                key={prod.id}
                onClick={() => onOpenAlertModal(prod)}
                className="bg-white border border-[#E5E7EB] hover:border-[#DC2626] rounded-2xl p-4 transition-all cursor-pointer select-none space-y-3 shadow-card"
              >
                {/* Top Line */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1A1D1E] truncate">
                      {prod.name}
                    </h3>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {prod.category} • Stok: <strong className="text-[#1A1D1E] font-semibold tabular-nums">{prod.stockQty || 0}</strong> {prod.unit}
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-bold flex items-center gap-1 shrink-0 tabular-nums">
                    <AlertOctagon className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Jual rugi ({activeMargin.toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Middle Line */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#F0F2F5] text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block font-medium">Harga rak saat ini</span>
                    <div className="font-bold text-[#1A1D1E] tabular-nums mt-0.5">
                      {formatRupiah(prod.currentSellPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#6B7280] block font-medium">Saran harga baru</span>
                    <div className="font-extrabold text-[#1B6440] tabular-nums mt-0.5">
                      {formatRupiah(targetPrice)}
                    </div>
                  </div>
                </div>

                {/* Bottom Line */}
                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#F0F2F5]">
                  <span className="text-[#6B7280]">
                    Modal kulakan: <strong className="text-[#1A1D1E] font-semibold tabular-nums">{formatRupiah(prod.buyPrice)}</strong>
                  </span>
                  <span className="text-[#1B6440] font-extrabold tabular-nums">
                    Untung +{formatRupiah(profitGain)}/barang
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DashboardMobile;
