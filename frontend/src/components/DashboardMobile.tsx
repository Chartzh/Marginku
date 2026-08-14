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
  // Financial Swiss KPI Calculations
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
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* 1. Main KPI Card (Swiss Financial Newspaper Lead Block) */}
      <div className="bg-[#18191e] border border-[#262830] rounded-lg p-4 space-y-3.5">
        <div className="border-b border-[#262830] pb-3">
          <div className="flex items-center justify-between text-xs text-[#9ca3af] font-semibold mb-1">
            <span>Laporan Margin Toko</span>
            <span className="text-[#22c55e] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Harga terlindungi
            </span>
          </div>

          {/* Swiss Huge Typographic Number */}
          <div className="text-3xl sm:text-4xl font-extrabold text-[#f3f4f6] tracking-tight tabular-nums mt-1">
            +{formatRupiah(totalProtectedProfit)}
          </div>

          <div className="text-xs text-[#9ca3af] mt-1 font-medium">
            Total potensi rugi yang dapat dicegah hari ini
          </div>
        </div>

        {/* 3-Column Asymmetric Status Grid */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="bg-[#131417] p-2.5 rounded-lg border border-[#262830] hover:border-[#b91c1c] text-left transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-[#f87171] font-bold flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              Jual rugi
            </div>
            <div className="text-xl font-extrabold text-[#f3f4f6] mt-1 tabular-nums">
              {criticalProducts.length}
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="bg-[#131417] p-2.5 rounded-lg border border-[#262830] hover:border-[#b45309] text-left transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-[#fbbf24] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Untung tipis
            </div>
            <div className="text-xl font-extrabold text-[#f3f4f6] mt-1 tabular-nums">
              {thinMarginProducts.length}
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="bg-[#131417] p-2.5 rounded-lg border border-[#262830] hover:border-[#166534] text-left transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-[#22c55e] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Margin aman
            </div>
            <div className="text-xl font-extrabold text-[#f3f4f6] mt-1 tabular-nums">
              {safeProducts.length}
            </div>
          </button>
        </div>

        {/* Primary Action Button (Min Height 52px, Solid Rectangular) */}
        <button
          onClick={() => onNavigateTab('SCAN_SHELF')}
          className="w-full min-h-[52px] px-4 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Periksa label harga rak sekarang</span>
          </div>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Alert List (Swiss Structured Flat Rows) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5 pt-1">
          <h2 className="text-xs font-bold text-[#9ca3af]">
            Daftar barang perlu penyesuaian harga ({criticalProducts.length})
          </h2>
          <button
            onClick={() => onNavigateTab('CATALOG')}
            className="text-xs font-bold text-[#22c55e] hover:underline cursor-pointer"
          >
            Lihat semua katalog
          </button>
        </div>

        {criticalProducts.length === 0 ? (
          <div className="p-6 rounded-lg bg-[#18191e] border border-[#262830] text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-[#22c55e] mx-auto mb-1" />
            <div className="text-xs font-bold text-[#f3f4f6]">Seluruh harga di rak sudah aman</div>
            <div className="text-[11px] text-[#9ca3af]">Tidak ada barang yang dijual di bawah harga modal</div>
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
                className="bg-[#18191e] border border-[#262830] hover:border-[#b91c1c] rounded-lg p-3.5 transition-colors cursor-pointer select-none space-y-2.5"
              >
                {/* Top Line: Product Name & Triple-Redundancy Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-[#f3f4f6] truncate">
                      {prod.name}
                    </h3>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">
                      {prod.category} • Stok: <strong className="text-[#f3f4f6] font-semibold tabular-nums">{prod.stockQty || 0}</strong> {prod.unit}
                    </div>
                  </div>

                  {/* Triple-Redundancy Badge: Color + Icon + Explicit Label */}
                  <div className="px-2.5 py-1 rounded bg-[#3b181b] border border-[#b91c1c] text-[#f87171] text-[11px] font-bold flex items-center gap-1 shrink-0 tabular-nums">
                    <AlertOctagon className="w-3.5 h-3.5 text-[#f87171]" />
                    <span>Jual rugi ({activeMargin.toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Middle Line: Tabular Price Comparison Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262830] text-xs">
                  <div>
                    <span className="text-[10px] text-[#9ca3af] block font-medium">Harga rak saat ini</span>
                    <div className="font-bold text-[#f3f4f6] tabular-nums mt-0.5">
                      {formatRupiah(prod.currentSellPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#9ca3af] block font-medium">Saran harga baru</span>
                    <div className="font-extrabold text-[#22c55e] tabular-nums mt-0.5">
                      {formatRupiah(targetPrice)}
                    </div>
                  </div>
                </div>

                {/* Bottom Line: Modal & Profit Nominal */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#262830]">
                  <span className="text-[#9ca3af]">
                    Modal kulakan: <strong className="text-[#f3f4f6] font-semibold tabular-nums">{formatRupiah(prod.buyPrice)}</strong>
                  </span>
                  <span className="text-[#22c55e] font-extrabold tabular-nums">
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
