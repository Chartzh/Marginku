import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import { Type, AlertOctagon, CheckCircle2, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import logoIcon from '@/assets/logo.png';
import logoText from '@/assets/logo-wordmark.png';

interface HeaderProps {
  settings: StoreSettings;
  dangerCount: number;
  isEasyMode: boolean;
  onToggleEasyMode: () => void;
  onOpenDangerFilter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  dangerCount,
  isEasyMode,
  onToggleEasyMode,
  onOpenDangerFilter,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5">
            <img
              src={logoIcon}
              alt="Marginku"
              className="w-10 h-10 object-contain"
            />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <img
                  src={logoText}
                  alt="Marginku"
                  className="h-5 w-auto object-contain"
                />
                <span className="bg-[#EBF5F0] text-[#1B6440] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI
                </span>
              </div>
              <div className="text-[12px] text-[#6B7280] font-medium leading-none mt-1">
                {settings.storeName || 'Warung Berkah Jaya'}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Guide Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              aria-label="Panduan"
              title="Panduan Cara Pakai"
              className="w-9 h-9 rounded-full bg-[#F4F6F5] text-[#6B7280] hover:text-[#1B6440] hover:bg-[#EBF5F0] border border-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Easy Mode Toggle Button */}
            <button
              onClick={onToggleEasyMode}
              aria-label={isEasyMode ? "Nonaktifkan mode teks besar" : "Aktifkan mode teks besar"}
              title="Mode Teks Besar"
              className={`h-9 px-3 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-sm ${
                isEasyMode
                  ? 'bg-[#1B6440] text-white border-[#1B6440]'
                  : 'bg-[#F4F6F5] text-[#6B7280] border-[#E5E7EB] hover:text-[#1A1D1E]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Teks</span>
            </button>

            {/* Status Alert Badge */}
            {dangerCount > 0 ? (
              <button
                onClick={onOpenDangerFilter}
                className="h-9 px-3.5 rounded-full bg-[#EF4444] text-white text-xs font-bold transition-all flex items-center gap-1.5 tabular-nums cursor-pointer active:scale-95 shadow-sm hover:bg-[#DC2626]"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{dangerCount} bahaya</span>
              </button>
            ) : (
              <div className="h-9 px-3 rounded-full bg-[#EBF5F0] border border-[#D1E7DD] text-[#1B6440] flex items-center gap-1.5 text-xs font-bold" title="Toko Aman">
                <CheckCircle2 className="w-4 h-4 text-[#1B6440]" />
                <span className="text-[11px]">Aman</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Guide Dialog */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-md bg-white border-[#E5E7EB] p-6 rounded-3xl text-[#1A1D1E] font-sans shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A1D1E]">
              Panduan Cara Pakai Marginku
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280] mt-1">
              Alur 3 langkah mudah mengamankan keuntungan toko Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4 text-xs text-[#1A1D1E]">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-start gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#1B6440] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                1
              </span>
              <div>
                <strong className="text-[#1A1D1E] block text-xs font-bold">Scan Nota Belanja Grosir</strong>
                <span className="text-[#6B7280]">Perbarui harga modal kulakan dari struk belanja di tab <strong>Scan Nota</strong>.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-start gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#1B6440] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                2
              </span>
              <div>
                <strong className="text-[#1A1D1E] block text-xs font-bold">Scan Label Rak Toko</strong>
                <span className="text-[#6B7280]">Arahkan kamera ke label harga barang di etalase/rak warung.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-start gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#1B6440] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                3
              </span>
              <div>
                <strong className="text-[#1A1D1E] block text-xs font-bold">Terapkan Rekomendasi</strong>
                <span className="text-[#6B7280]">Terapkan harga baru otomatis dengan pembulatan pecahan Rp 500 / Rp 1.000.</span>
              </div>
            </div>
          </div>

          <button
            className="w-full h-[48px] font-bold text-xs bg-[#1B6440] hover:bg-[#154E30] text-white rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            onClick={() => setShowHelpModal(false)}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mengerti & Tutup</span>
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};
