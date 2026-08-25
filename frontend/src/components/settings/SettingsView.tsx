import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Store,
  Percent,
  Coins,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  User,
  LogOut,
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
  const { user, signOut } = useAuth();
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
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* 1. Header Area */}
      <div className="bg-[#15803D] rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Setelan Toko
          </h1>
          <p className="text-xs font-medium text-white/90 mt-1">
            Atur target margin, pembulatan harga, dan profil akun
          </p>
        </div>
      </div>

      {/* Account Info Card (Supabase Auth) */}
      {user && (
        <div className="border border-[#E5E7EB] rounded-2xl p-4 bg-white space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] border border-[#15803D] flex items-center justify-center text-[#15803D]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Akun Terdaftar
                </span>
                <span className="text-xs font-bold text-[#1A1D1E] truncate max-w-[180px] sm:max-w-[240px] block">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="h-9 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            Sesi aktif terhubung ke database Supabase Marginku.
          </p>
        </div>
      )}

      {/* Store Name Input */}
      <div className="border border-[#E5E7EB] rounded-2xl p-4 bg-white space-y-2 shadow-sm">
        <label className="text-xs font-bold text-[#1A1D1E] flex items-center gap-1.5">
          <Store className="w-4 h-4 text-[#15803D]" />
          <span>Nama Warung / Toko</span>
        </label>
        <input
          type="text"
          value={settings.storeName}
          onChange={(e) => update({ storeName: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-bold focus:outline-none focus:border-[#15803D]"
        />
      </div>

      {/* Target Margin % */}
      <div className="border border-[#E5E7EB] rounded-2xl p-4 bg-white space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-2.5">
          <label className="text-xs font-bold text-[#1A1D1E] flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-[#15803D]" />
            <span>Target Margin Keuntungan Toko</span>
          </label>
          <span className="text-base font-extrabold text-[#15803D] tabular-nums bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
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
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#15803D]"
        />

        <div className="flex justify-between text-[11px] font-bold text-gray-500 tabular-nums">
          <span>5% (Tipis)</span>
          <span>15% (Standar Warung)</span>
          <span>35% (Tinggi)</span>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-[#E5E7EB] font-medium leading-relaxed">
          💡 Menggeser margin akan memperbarui analisis batas kesehatan produk (Margin Kritis / Untung Tipis). Tekan tombol di bawah untuk langsung memperbarui seluruh harga jual barang di katalog.
        </div>

        <button
          onClick={handleApplyToAll}
          className={`w-full h-11 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer shadow-sm ${
            isAppliedSuccess
              ? 'bg-emerald-50 border-emerald-200 text-[#15803D]'
              : 'bg-[#15803D] hover:bg-[#15803D]/90 border-[#15803D] text-white'
          }`}
        >
          {isAppliedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
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
      <div className="border border-[#E5E7EB] rounded-2xl p-4 bg-white space-y-3 shadow-sm">
        <div className="border-b border-[#F0F2F5] pb-2.5">
          <label className="text-xs font-bold text-[#1A1D1E] flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#15803D]" />
            <span>Pembulatan Pecahan Uang Kembalian</span>
          </label>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Harga jual otomatis dibulatkan ke atas agar tidak butuh koin receh langka
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => update({ roundingStep: 500 })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              settings.roundingStep === 500
                ? 'bg-emerald-50 border-emerald-300 text-[#15803D]'
                : 'bg-white border-[#E5E7EB] text-[#1A1D1E] hover:bg-gray-50'
            }`}
          >
            <span className="text-xs font-bold block tabular-nums text-[#1A1D1E]">Kelipatan Rp 500</span>
            <span className="text-[11px] font-medium block mt-0.5 text-gray-500">
              Contoh: Rp 3.120 → Rp 3.500
            </span>
          </button>

          <button
            onClick={() => update({ roundingStep: 1000 })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              settings.roundingStep === 1000
                ? 'bg-emerald-50 border-emerald-300 text-[#15803D]'
                : 'bg-white border-[#E5E7EB] text-[#1A1D1E] hover:bg-gray-50'
            }`}
          >
            <span className="text-xs font-bold block tabular-nums text-[#1A1D1E]">Kelipatan Rp 1.000</span>
            <span className="text-[11px] font-medium block mt-0.5 text-gray-500">
              Contoh: Rp 3.120 → Rp 4.000
            </span>
          </button>
        </div>
      </div>

      {/* Reset Demo Button */}
      <div className="pt-1">
        <button
          onClick={onResetDemoData}
          className="w-full h-11 px-4 rounded-xl font-bold text-xs bg-white hover:bg-gray-50 text-gray-700 hover:text-[#1A1D1E] border border-[#E5E7EB] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset ulang seluruh data demo</span>
        </button>
      </div>
    </div>
  );
};
