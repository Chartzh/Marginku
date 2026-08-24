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
      {/* Title Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
          Setelan Toko
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Atur target keuntungan margin, pembulatan harga, dan profil akun
        </p>
      </div>

      {/* Account Info Card (Supabase Auth) */}
      {user && (
        <div className="rounded-3xl p-5 bg-white border border-[#E5E7EB] space-y-3 shadow-card">
          <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF5F0] border border-[#D1E7DD] flex items-center justify-center text-[#1B6440]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] block font-medium">Akun Terdaftar</span>
                <span className="text-xs font-bold text-[#1A1D1E] truncate max-w-[200px] block">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="h-[38px] px-3.5 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FDD8D8] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
          <div className="text-xs text-[#6B7280]">
            Sesi aktif terhubung ke database Supabase Marginku.
          </div>
        </div>
      )}

      {/* Store Name Input */}
      <div className="rounded-3xl p-5 bg-white border border-[#E5E7EB] space-y-3 shadow-card">
        <label className="text-xs font-bold text-[#1A1D1E] flex items-center gap-1.5">
          <Store className="w-4 h-4 text-[#1B6440]" />
          <span>Nama Warung / Toko</span>
        </label>
        <input
          type="text"
          value={settings.storeName}
          onChange={(e) => update({ storeName: e.target.value })}
          className="w-full h-[48px] px-4 rounded-2xl bg-[#F4F6F5] border border-[#E5E7EB] text-xs text-[#1A1D1E] font-bold focus:outline-none focus:border-[#1B6440] focus:ring-2 focus:ring-[#1B6440]/15"
        />
      </div>

      {/* Target Margin % */}
      <div className="rounded-3xl p-5 bg-white border border-[#E5E7EB] space-y-4 shadow-card">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
          <label className="text-xs font-bold text-[#1A1D1E] flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-[#1B6440]" />
            <span>Target Margin Keuntungan Toko</span>
          </label>
          <span className="text-base font-extrabold text-[#1B6440] tabular-nums">
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
          className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#1B6440]"
        />

        <div className="flex justify-between text-[11px] text-[#6B7280] tabular-nums font-medium">
          <span>5% (Tipis)</span>
          <span>15% (Standar Warung)</span>
          <span>35% (Tinggi)</span>
        </div>

        <p className="text-xs text-[#6B7280] bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB] leading-relaxed">
          💡 Menggeser margin akan memperbarui analisis batas kesehatan produk (Margin Kritis / Untung Tipis). Tekan tombol di bawah untuk langsung memperbarui seluruh harga jual barang di katalog.
        </p>

        <button
          onClick={handleApplyToAll}
          className={`w-full h-[48px] px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-floating ${
            isAppliedSuccess
              ? 'bg-[#EBF5F0] border border-[#D1E7DD] text-[#1B6440]'
              : 'bg-[#1B6440] hover:bg-[#154E30] text-white'
          }`}
        >
          {isAppliedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#1B6440]" />
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
      <div className="rounded-3xl p-5 bg-white border border-[#E5E7EB] space-y-4 shadow-card">
        <div className="border-b border-[#F0F2F5] pb-3">
          <label className="text-xs font-bold text-[#1A1D1E] flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#1B6440]" />
            <span>Pembulatan Pecahan Uang Kembalian</span>
          </label>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Harga jual otomatis dibulatkan ke atas agar tidak butuh koin receh langka
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => update({ roundingStep: 500 })}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
              settings.roundingStep === 500
                ? 'bg-[#EBF5F0] border-[#1B6440] text-[#1B6440]'
                : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280] hover:border-[#1B6440]'
            }`}
          >
            <span className="text-xs font-bold block tabular-nums text-[#1A1D1E]">Kelipatan Rp 500</span>
            <span className="text-[11px] text-[#6B7280] block mt-0.5">
              Contoh: Rp 3.120 → Rp 3.500
            </span>
          </button>

          <button
            onClick={() => update({ roundingStep: 1000 })}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
              settings.roundingStep === 1000
                ? 'bg-[#EBF5F0] border-[#1B6440] text-[#1B6440]'
                : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280] hover:border-[#1B6440]'
            }`}
          >
            <span className="text-xs font-bold block tabular-nums text-[#1A1D1E]">Kelipatan Rp 1.000</span>
            <span className="text-[11px] text-[#6B7280] block mt-0.5">
              Contoh: Rp 3.120 → Rp 4.000
            </span>
          </button>
        </div>
      </div>

      {/* Reset Demo Button */}
      <div className="pt-1">
        <button
          onClick={onResetDemoData}
          className="w-full h-[48px] rounded-full font-bold text-xs bg-white hover:bg-[#F4F6F5] text-[#6B7280] hover:text-[#1A1D1E] border border-[#E5E7EB] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset ulang seluruh data demo</span>
        </button>
      </div>
    </div>
  );
};
