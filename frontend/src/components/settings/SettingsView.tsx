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
    <div className="space-y-6 pb-28 text-[#1A1A1A] font-sans bg-white min-h-screen">
      {/* 1. Header Area */}
      <div className="-mx-4 -mt-4 mb-6 bg-[#15803D] p-5 text-white flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-none">
            Setelan Toko
          </h1>
          <p className="text-lg font-medium text-white/90 mt-1">
            Atur target keuntungan margin, pembulatan harga, dan profil akun
          </p>
        </div>
      </div>

      {/* Account Info Card (Supabase Auth) */}
      {user && (
        <div className="border-2 border-[#1A1A1A] rounded-lg p-5 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#EBF5F0] border-2 border-[#15803D] flex items-center justify-center text-[#15803D]">
                <User className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                  Akun Terdaftar
                </span>
                <span className="text-lg font-black text-[#1A1A1A] truncate max-w-[200px] sm:max-w-[280px] block">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="min-h-[48px] px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 font-extrabold text-base flex items-center gap-2 transition-colors cursor-pointer shadow"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              <span>Keluar</span>
            </button>
          </div>
          <p className="text-base text-gray-700 font-bold">
            Sesi aktif terhubung ke database Supabase Marginku.
          </p>
        </div>
      )}

      {/* Store Name Input */}
      <div className="border-2 border-[#1A1A1A] rounded-lg p-5 bg-white space-y-3 shadow-sm">
        <label className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
          <Store className="w-5 h-5 text-[#15803D] stroke-[2.5]" />
          <span>Nama Warung / Toko</span>
        </label>
        <input
          type="text"
          value={settings.storeName}
          onChange={(e) => update({ storeName: e.target.value })}
          className="w-full h-[60px] px-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] font-bold focus:outline-none focus:border-[#15803D]"
        />
      </div>

      {/* Target Margin % */}
      <div className="border-2 border-[#1A1A1A] rounded-lg p-5 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
          <label className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
            <Percent className="w-5 h-5 text-[#15803D] stroke-[2.5]" />
            <span>Target Margin Keuntungan Toko</span>
          </label>
          <span className="text-2xl font-black text-[#15803D] tabular-nums bg-emerald-50 px-3 py-1 rounded-lg border-2 border-[#15803D]">
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
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#15803D]"
        />

        <div className="flex justify-between text-sm font-extrabold text-gray-700 tabular-nums">
          <span>5% (Tipis)</span>
          <span>15% (Standar Warung)</span>
          <span>35% (Tinggi)</span>
        </div>

        <div className="text-base text-gray-800 bg-gray-100 p-4 rounded-lg border-2 border-gray-300 font-bold leading-relaxed">
          💡 Menggeser margin akan memperbarui analisis batas kesehatan produk (Margin Kritis / Untung Tipis). Tekan tombol di bawah untuk langsung memperbarui seluruh harga jual barang di katalog.
        </div>

        <button
          onClick={handleApplyToAll}
          className={`w-full min-h-[60px] px-5 rounded-lg font-extrabold text-lg flex items-center justify-center gap-2 border-2 transition-colors cursor-pointer shadow ${
            isAppliedSuccess
              ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
              : 'bg-[#15803D] hover:bg-[#15803D]/90 border-[#15803D] text-white'
          }`}
        >
          {isAppliedSuccess ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-[#15803D] stroke-[2.5]" />
              <span>Seluruh harga barang telah disesuaikan ({settings.defaultTargetMarginPercent}%)</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-6 h-6 stroke-[2.5]" />
              <span>Terapkan Margin {settings.defaultTargetMarginPercent}% ke Seluruh Harga Barang</span>
            </>
          )}
        </button>
      </div>

      {/* Rupiah Rounding Step */}
      <div className="border-2 border-[#1A1A1A] rounded-lg p-5 bg-white space-y-4 shadow-sm">
        <div className="border-b-2 border-gray-200 pb-3">
          <label className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#15803D] stroke-[2.5]" />
            <span>Pembulatan Pecahan Uang Kembalian</span>
          </label>
          <p className="text-base text-gray-600 font-bold mt-1">
            Harga jual otomatis dibulatkan ke atas agar tidak butuh koin receh langka
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => update({ roundingStep: 500 })}
            className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
              settings.roundingStep === 500
                ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                : 'bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-50'
            }`}
          >
            <span className="text-lg font-black block tabular-nums text-[#1A1A1A]">Kelipatan Rp 500</span>
            <span className="text-sm font-bold block mt-1 text-gray-600">
              Contoh: Rp 3.120 → Rp 3.500
            </span>
          </button>

          <button
            onClick={() => update({ roundingStep: 1000 })}
            className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
              settings.roundingStep === 1000
                ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                : 'bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-50'
            }`}
          >
            <span className="text-lg font-black block tabular-nums text-[#1A1A1A]">Kelipatan Rp 1.000</span>
            <span className="text-sm font-bold block mt-1 text-gray-600">
              Contoh: Rp 3.120 → Rp 4.000
            </span>
          </button>
        </div>
      </div>

      {/* Reset Demo Button */}
      <div className="pt-2">
        <button
          onClick={onResetDemoData}
          className="w-full min-h-[60px] px-5 rounded-lg font-extrabold text-lg bg-white hover:bg-gray-100 text-gray-700 hover:text-[#1A1A1A] border-2 border-[#1A1A1A] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          <span>Reset ulang seluruh data demo</span>
        </button>
      </div>
    </div>
  );
};

