import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import { Type, HelpCircle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
      <header className="sticky top-0 z-40 bg-[#18191e] border-b border-[#262830] px-4 py-2.5">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center text-white font-extrabold text-sm">
              M
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#f3f4f6] tracking-tight leading-none">
                Marginku
              </div>
              <div className="text-xs text-[#9ca3af] font-medium leading-none mt-1">
                {settings.storeName}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {/* Easy Mode Toggle Button (Min Height 48px, Min Width 48px) */}
            <button
              onClick={onToggleEasyMode}
              aria-label={isEasyMode ? "Nonaktifkan mode teks besar" : "Aktifkan mode teks besar"}
              title="Mode Teks Besar"
              className={`h-[48px] px-3 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                isEasyMode
                  ? 'bg-[#16a34a] text-white border-[#16a34a]'
                  : 'bg-[#131417] text-[#f3f4f6] border-[#262830] hover:border-[#373a46]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Teks besar</span>
            </button>

            {/* Status Alert Badge */}
            {dangerCount > 0 ? (
              <button
                onClick={onOpenDangerFilter}
                className="h-[48px] px-3 rounded-lg bg-[#3b181b] border border-[#b91c1c] text-[#f87171] text-xs font-bold transition-colors flex items-center gap-1.5 tabular-nums cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-[#f87171]" />
                <span>{dangerCount} bahaya</span>
              </button>
            ) : (
              <div className="h-[48px] px-3 rounded-lg bg-[#142e1f] border border-[#166534] text-[#22c55e] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Aman</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Guide Dialog */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-md bg-[#18191e] border-[#262830] p-5 rounded-lg text-[#f3f4f6] font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#f3f4f6]">
              Panduan Cara Pakai Marginku
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9ca3af] mt-0.5">
              Alur 3 langkah mudah mengamankan keuntungan toko Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 my-3 text-xs text-[#f3f4f6]">
            <div className="p-3 rounded-lg bg-[#131417] border border-[#262830] flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-[#16a34a] text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <div>
                <strong className="text-[#f3f4f6] block text-xs">Scan Nota Belanja Grosir</strong>
                <span className="text-[#9ca3af]">Perbarui harga modal kulakan dari struk belanja di tab <strong>Scan Nota</strong>.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#131417] border border-[#262830] flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-[#16a34a] text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <div>
                <strong className="text-[#f3f4f6] block text-xs">Scan Label Rak Toko</strong>
                <span className="text-[#9ca3af]">Arahkan kamera ke label harga barang di etalase/rak warung.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#131417] border border-[#262830] flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-[#16a34a] text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <div>
                <strong className="text-[#f3f4f6] block text-xs">Terapkan Rekomendasi</strong>
                <span className="text-[#9ca3af]">Terapkan harga baru otomatis dengan pembulatan pecahan Rp 500 / Rp 1.000.</span>
              </div>
            </div>
          </div>

          <button
            className="w-full min-h-[52px] font-bold text-xs mt-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            onClick={() => setShowHelpModal(false)}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tutup Panduan</span>
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};
