import React, { useState, useRef } from 'react';
import { ProductItem, ShelfScanData, StoreSettings } from '@/types';
import { demoShelfPresets } from '@/data/mockProducts';
import { calculateMargin, fuzzyMatchScore } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Image as ImageIcon,
  AlertOctagon,
  ArrowRight,
  Flashlight,
  Scan,
  RefreshCw,
} from 'lucide-react';
import { auditLabelRak } from '@/services/api';

interface ShelfScanViewProps {
  products: ProductItem[];
  settings: StoreSettings;
  onOpenAlertModal: (product: ProductItem) => void;
}

export const ShelfScanView: React.FC<ShelfScanViewProps> = ({
  products,
  settings,
  onOpenAlertModal,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(demoShelfPresets[0].id);
  const [scanResult, setScanResult] = useState<{
    shelfData: ShelfScanData;
    matchedProduct: ProductItem | null;
    analysis: ReturnType<typeof calculateMargin> | null;
  } | null>(() => {
    const initial = demoShelfPresets[0];
    const match = products[0];
    const calc = calculateMargin(
      match.buyPrice,
      initial.detectedPrice,
      match.targetMarginPercent || settings.defaultTargetMarginPercent,
      settings.roundingStep,
      settings.dangerThresholdPercent
    );
    return {
      shelfData: initial,
      matchedProduct: { ...match, currentSellPrice: initial.detectedPrice },
      analysis: calc,
    };
  });

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processDetection = (preset: typeof demoShelfPresets[0]) => {
    setActivePresetId(preset.id);

    let bestMatch: ProductItem | null = null;
    let highestScore = 0;

    for (const prod of products) {
      const score = fuzzyMatchScore(preset.detectedName, prod.name);
      if (score > highestScore && score >= 0.4) {
        highestScore = score;
        bestMatch = prod;
      }
    }

    if (!bestMatch && products.length > 0) {
      bestMatch = products[0];
    }

    if (bestMatch) {
      const updatedMatch: ProductItem = {
        ...bestMatch,
        currentSellPrice: preset.detectedPrice,
      };

      const analysis = calculateMargin(
        bestMatch.buyPrice,
        preset.detectedPrice,
        bestMatch.targetMarginPercent || settings.defaultTargetMarginPercent,
        settings.roundingStep,
        settings.dangerThresholdPercent
      );

      setScanResult({
        shelfData: preset,
        matchedProduct: updatedMatch,
        analysis,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setApiLoading(true);
    setApiError(null);

    try {
      const result = await auditLabelRak(file);
      if (result.status === 'success') {
        // Cari ProductItem di products yang namanya paling cocok dengan nama_di_nota
        const matched =
          products.find(
            (p) => p.name.toLowerCase() === result.nama_di_nota.toLowerCase()
          ) ??
          products.find((p) =>
            p.name.toLowerCase().includes(result.nama_di_nota.toLowerCase().split(' ')[0])
          ) ??
          null;

        const fakeProduct: ProductItem = {
          id: matched?.id ?? 'api-result',
          name: result.nama_label_rak,
          category: matched?.category ?? 'Produk Terdeteksi',
          buyPrice: result.harga_modal,
          currentSellPrice: result.harga_rak,
          targetMarginPercent: matched?.targetMarginPercent ?? settings.defaultTargetMarginPercent,
          unit: matched?.unit ?? 'pcs',
          lastUpdated: new Date().toISOString(),
        };

        const analysis = calculateMargin(
          result.harga_modal,
          result.harga_rak,
          fakeProduct.targetMarginPercent,
          settings.roundingStep,
          settings.dangerThresholdPercent
        );

        setScanResult({
          shelfData: {
            id: 'api-' + Date.now(),
            detectedName: result.nama_label_rak,
            detectedPrice: result.harga_rak,
            confidence: result.match_score,
          },
          matchedProduct: fakeProduct,
          analysis,
        });

        setActivePresetId('');
      } else if (result.status === 'not_found') {
        setApiError('Produk tidak ditemukan di database nota. Scan nota supplier terlebih dahulu.');
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Gagal menghubungi server AI');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* Swiss Style Title Header */}
      <div className="border-b border-[#262830] pb-2">
        <h1 className="text-xl font-extrabold text-[#f3f4f6] tracking-tight">
          Pemeriksaan Label Rak
        </h1>
        <p className="text-xs text-[#9ca3af] mt-0.5">
          Arahkan kamera ke label harga barang di etalase toko
        </p>
      </div>

      {/* Swiss Functional Viewfinder Area */}
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#18191e] border border-[#262830] flex flex-col justify-between p-3">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131417] text-xs font-bold text-[#f3f4f6] border border-[#262830]">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span>Kamera Pemindai</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFlashlightOn(!flashlightOn)}
              aria-label="Senter"
              className={`p-2 rounded border transition-colors cursor-pointer ${
                flashlightOn
                  ? 'bg-amber-500 text-black border-amber-500 font-bold'
                  : 'bg-[#131417] text-[#f3f4f6] border-[#262830] hover:border-[#373a46]'
              }`}
            >
              <Flashlight className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Pilih Foto Galeri"
              className="p-2 rounded bg-[#131417] text-[#f3f4f6] border border-[#262830] hover:border-[#373a46] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Reticle Focus Area */}
        <div className="my-auto flex flex-col items-center justify-center">
          <div className="w-64 h-24 rounded border border-[#373a46] bg-[#131417] flex flex-col items-center justify-center p-3 text-center">
            {apiLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#22c55e]" />
                <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider mt-1">
                  AI menganalisis...
                </span>
              </>
            ) : (
              <>
                <Scan className="w-5 h-5 text-[#16a34a] mb-1 opacity-90" />
                <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">
                  Posisikan Label Rak di Sini
                </span>
                <span className="text-xs font-bold text-[#f3f4f6] mt-0.5 truncate max-w-[220px]">
                  {scanResult ? scanResult.shelfData.detectedName : 'Menunggu target label...'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Bottom Status Grid */}
        <div className="flex items-center justify-between text-xs text-[#9ca3af] border-t border-[#262830] pt-1.5 px-0.5 font-medium">
          <span>Mode: Otomatis</span>
          <span className="text-[#f3f4f6] font-bold tabular-nums">Akurasi 98.4%</span>
        </div>
      </div>

      {/* Error Message if API Error */}
      {apiError && (
        <div className="text-xs text-[#f87171] font-bold px-1 py-2">
          {apiError}
        </div>
      )}

      {/* Preset Chips (Swiss Horizontal Row) */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-[#9ca3af] block">
          Pilih sampel label rak fisik:
        </span>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {demoShelfPresets.map((preset) => {
            const isSelected = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                onClick={() => processDetection(preset)}
                className={`px-3 py-2 rounded-lg border shrink-0 transition-colors text-xs text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#262830] border-[#373a46] text-[#f3f4f6] font-bold'
                    : 'bg-[#18191e] border-[#262830] text-[#9ca3af] hover:border-[#373a46] hover:text-[#f3f4f6]'
                }`}
              >
                <div className="truncate max-w-[140px] font-bold">{preset.detectedName}</div>
                <div className="text-[11px] text-[#9ca3af] mt-0.5 tabular-nums">
                  Rak: <strong className="text-[#22c55e] font-bold">{formatRupiah(preset.detectedPrice)}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Swiss Financial Diagnosis Panel */}
      {scanResult && scanResult.matchedProduct && scanResult.analysis && (
        <div
          className={`rounded-lg p-4 border transition-colors space-y-3 ${
            scanResult.analysis.status === 'DANGER'
              ? 'bg-[#18191e] border-[#b91c1c]'
              : scanResult.analysis.status === 'WARNING'
              ? 'bg-[#18191e] border-[#b45309]'
              : 'bg-[#18191e] border-[#262830]'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 border-b border-[#262830] pb-3">
            <div>
              <span className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider block">
                Barang Terdeteksi
              </span>
              <h2 className="text-base font-extrabold text-[#f3f4f6] mt-0.5">
                {scanResult.matchedProduct.name}
              </h2>
            </div>

            {/* Triple-Redundancy Badge */}
            <div className="text-right">
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 tabular-nums ${
                  scanResult.analysis.status === 'DANGER'
                    ? 'bg-[#3b181b] text-[#f87171] border border-[#b91c1c]'
                    : scanResult.analysis.status === 'WARNING'
                    ? 'bg-[#3d2612] text-[#fbbf24] border border-[#b45309]'
                    : 'bg-[#142e1f] text-[#22c55e] border border-[#166534]'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                {scanResult.analysis.status === 'DANGER'
                  ? 'Jual rugi'
                  : scanResult.analysis.status === 'WARNING'
                  ? 'Untung tipis'
                  : 'Margin aman'}
              </span>
              <div className="text-xs font-bold text-[#f3f4f6] mt-1 tabular-nums">
                Rak: {formatRupiah(scanResult.shelfData.detectedPrice)}
              </div>
            </div>
          </div>

          {/* 3-Column Numbers Grid (Swiss Tabular Numbers) */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded bg-[#131417] border border-[#262830]">
            <div>
              <span className="text-[10px] text-[#9ca3af] block font-medium">Modal Kulakan</span>
              <div className="text-sm font-bold text-[#f3f4f6] mt-0.5 tabular-nums">
                {formatRupiah(scanResult.matchedProduct.buyPrice)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#9ca3af] block font-medium">Margin Aktif</span>
              <div
                className={`text-sm font-extrabold mt-0.5 tabular-nums ${
                  scanResult.analysis.status === 'DANGER'
                    ? 'text-[#f87171]'
                    : scanResult.analysis.status === 'WARNING'
                    ? 'text-[#fbbf24]'
                    : 'text-[#22c55e]'
                }`}
              >
                {scanResult.analysis.activeMarginPercent.toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#9ca3af] block font-medium">Saran Harga</span>
              <div className="text-sm font-extrabold text-[#22c55e] mt-0.5 tabular-nums">
                {formatRupiah(scanResult.analysis.smartRoundedSellPrice)}
              </div>
            </div>
          </div>

          {/* Swiss Solid Action Button (Min Height 52px) */}
          <button
            onClick={() => {
              if (scanResult.matchedProduct) {
                onOpenAlertModal(scanResult.matchedProduct);
              }
            }}
            className={`w-full min-h-[52px] px-4 rounded-lg font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
              scanResult.analysis.status === 'DANGER'
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white'
                : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
            }`}
          >
            {scanResult.analysis.status === 'DANGER' ? (
              <>
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Amankan margin (ubah ke {formatRupiah(scanResult.analysis.smartRoundedSellPrice)})</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Lihat rekomendasi harga toko</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
