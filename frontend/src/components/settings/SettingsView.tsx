import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import {
  Settings,
  Store,
  Percent,
  Coins,
  ShieldAlert,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings?: (newSettings: Partial<StoreSettings>) => void;
  onSaveSettings?: (newSettings: StoreSettings) => void;
  onResetDemoData: () => void;
  onApplyMarginToAllProducts?: (targetMargin: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSaveSettings,
  onResetDemoData,
  onApplyMarginToAllProducts,
}) => {
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);

  const update = (partial: Partial<StoreSettings>) => {
    setIsAppliedSuccess(false);
    if (onUpdateSettings) {
      onUpdateSettings(partial);
    } else if (onSaveSettings) {
      onSaveSettings({ ...settings, ...partial });
    }
  };

  const handleApplyToAll = () => {
    if (onApplyMarginToAllProducts) {
      onApplyMarginToAllProducts(settings.defaultTargetMarginPercent);
      setIsAppliedSuccess(true);
      setTimeout(() => setIsAppliedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* Swiss Title Header */}
      <div className="border-b border-[#262830] pb-2">
        <h1 className="text-xl font-extrabold text-[#f3f4f6] tracking-tight">
          Setelan Toko
        </h1>
        <p className="text-xs text-[#9ca3af] mt-0.5">
          Atur target keuntungan margin dan pembulatan pecahan uang
        </p>
      </div>

      {/* Store Name Input */}
      <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-2">
        <label className="text-xs font-bold text-[#f3f4f6] flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-[#9ca3af]" />
          <span>Nama Warung / Toko</span>
        </label>
        <input
          type="text"
          value={settings.storeName}
          onChange={(e) => update({ storeName: e.target.value })}
          className="w-full h-[52px] min-h-[52px] px-3 rounded-lg bg-[#131417] border border-[#262830] text-xs text-[#f3f4f6] font-bold focus:outline-none focus:border-[#16a34a]"
        />
      </div>

      {/* Target Margin % */}
      <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-3">
        <div className="flex items-center justify-between border-b border-[#262830] pb-2.5">
          <label className="text-xs font-bold text-[#f3f4f6] flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span>Target Margin Keuntungan Toko</span>
          </label>
          <span className="text-sm font-extrabold text-[#22c55e] tabular-nums">
            {settings.defaultTargetMarginPercent}%
          </span>
        </div>

        <input
          type="range"
          min={5}
          max={35}
          step={1}
          value={settings.defaultTargetMarginPercent}
          onChange={(e) =>
            update({ defaultTargetMarginPercent: parseInt(e.target.value, 10) })
          }
          className="w-full h-2 bg-[#262830] rounded-lg appearance-none cursor-pointer accent-[#16a34a]"
        />

        <div className="flex justify-between text-[11px] text-[#9ca3af] tabular-nums font-medium">
          <span>5% (Tipis)</span>
          <span>15% (Standar Warung)</span>
          <span>35% (Tinggi)</span>
        </div>

        <p className="text-[11px] text-[#9ca3af] bg-[#131417] p-2.5 rounded border border-[#262830] leading-relaxed">
          💡 Menggeser margin akan memperbarui analisis batas kesehatan produk (Margin Kritis / Untung Tipis). Tekan tombol di bawah untuk langsung memperbarui seluruh harga jual barang di katalog.
        </p>

        <button
          onClick={handleApplyToAll}
          className={`w-full min-h-[48px] px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isAppliedSuccess
              ? 'bg-[#131417] border border-[#166534] text-[#22c55e]'
              : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
          }`}
        >
          {isAppliedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              <span>Seluruh harga barang telah disesuaikan ({settings.defaultTargetMarginPercent}%)</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Terapkan Margin {settings.defaultTargetMarginPercent}% ke Seluruh Harga Barang</span>
            </>
          )}
        </button>
      </div>

      {/* Rupiah Rounding Step */}
      <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-3">
        <div className="border-b border-[#262830] pb-2.5">
          <label className="text-xs font-bold text-[#f3f4f6] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span>Pembulatan Pecahan Uang Kembalian</span>
          </label>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            Harga jual otomatis dibulatkan ke atas agar tidak butuh koin receh langka
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => update({ roundingStep: 500 })}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              settings.roundingStep === 500
                ? 'bg-[#142e1f] border-[#166534] text-[#22c55e]'
                : 'bg-[#131417] border-[#262830] text-[#9ca3af] hover:border-[#373a46]'
            }`}
          >
            <span className="text-xs font-bold block tabular-nums">Kelipatan Rp 500</span>
            <span className="text-[10px] text-[#9ca3af] block mt-0.5">
              Contoh: Rp 3.120 → Rp 3.500
            </span>
          </button>

          <button
            onClick={() => update({ roundingStep: 1000 })}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              settings.roundingStep === 1000
                ? 'bg-[#142e1f] border-[#166534] text-[#22c55e]'
                : 'bg-[#131417] border-[#262830] text-[#9ca3af] hover:border-[#373a46]'
            }`}
          >
            <span className="text-xs font-bold block tabular-nums">Kelipatan Rp 1.000</span>
            <span className="text-[10px] text-[#9ca3af] block mt-0.5">
              Contoh: Rp 3.120 → Rp 4.000
            </span>
          </button>
        </div>
      </div>

      {/* Reset Demo Button */}
      <div className="pt-2">
        <button
          onClick={onResetDemoData}
          className="w-full min-h-[52px] rounded-lg font-bold text-xs bg-[#18191e] hover:bg-[#262830] text-[#9ca3af] hover:text-[#f3f4f6] border border-[#262830] flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset ulang seluruh data demo</span>
        </button>
      </div>
    </div>
  );
};
