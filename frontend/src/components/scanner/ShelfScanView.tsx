import React, { useState, useRef, useEffect } from 'react';
import { ProductItem, ShelfScanData, StoreSettings } from '@/types';
import { demoShelfPresets } from '@/data/mockProducts';
import { calculateMargin, fuzzyMatchScore } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import {
  Image as ImageIcon,
  AlertOctagon,
  ArrowRight,
  Flashlight,
  Scan,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { auditLabelRak } from '@/services/api';

export interface ShelfScanState {
  shelfData: ShelfScanData;
  matchedProduct: ProductItem | null;
  analysis: ReturnType<typeof calculateMargin> | null;
}

interface ShelfScanViewProps {
  products: ProductItem[];
  settings: StoreSettings;
  scanResult: ShelfScanState | null;
  onScanResultChange: (result: ShelfScanState | null) => void;
  onOpenAlertModal: (product: ProductItem) => void;
}

const AI_AUDIT_STAGES = [
  'Mengunggah foto etalase toko...',
  'AI Gemini mendeteksi teks harga di label...',
  'Mencocokkan nama barang ke katalog nota...',
  'Menganalisis kalkulasi margin keuntungan...',
];

export const ShelfScanView: React.FC<ShelfScanViewProps> = ({
  products,
  settings,
  scanResult,
  onScanResultChange,
  onOpenAlertModal,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(demoShelfPresets[0]?.id || '');
  const [apiLoading, setApiLoading] = useState(false);
  const [aiStageIndex, setAiStageIndex] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize scanResult safely if null and products available
  useEffect(() => {
    if (!scanResult && products.length > 0) {
      const initial = demoShelfPresets[0];
      const match = products[0];
      if (initial && match) {
        const calc = calculateMargin(
          match.buyPrice || 0,
          initial.detectedPrice || 0,
          match.targetMarginPercent || settings.defaultTargetMarginPercent,
          settings.roundingStep,
          settings.dangerThresholdPercent
        );
        onScanResultChange({
          shelfData: initial,
          matchedProduct: { ...match, currentSellPrice: initial.detectedPrice },
          analysis: calc,
        });
      }
    }
  }, [products, settings, scanResult, onScanResultChange]);

  // Animate AI stages when loading
  useEffect(() => {
    let interval: any;
    if (apiLoading) {
      setAiStageIndex(0);
      interval = setInterval(() => {
        setAiStageIndex((prev) => (prev < AI_AUDIT_STAGES.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [apiLoading]);

  const processDetection = (preset: typeof demoShelfPresets[0]) => {
    setActivePresetId(preset.id);

    // Safe handling when products array is empty
    if (!products || products.length === 0) {
      const fallbackProd: ProductItem = {
        id: 'prod-fallback',
        name: preset.detectedName,
        category: 'Umum',
        buyPrice: Math.round(preset.detectedPrice * 0.8),
        currentSellPrice: preset.detectedPrice,
        targetMarginPercent: settings.defaultTargetMarginPercent,
        unit: 'pcs',
        lastUpdated: new Date().toISOString(),
      };

      const calc = calculateMargin(
        fallbackProd.buyPrice,
        preset.detectedPrice,
        settings.defaultTargetMarginPercent,
        settings.roundingStep,
        settings.dangerThresholdPercent
      );

      onScanResultChange({
        shelfData: preset,
        matchedProduct: fallbackProd,
        analysis: calc,
      });
      return;
    }

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

      onScanResultChange({
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
      const result = await auditLabelRak(file, settings.defaultTargetMarginPercent);
      if (result.status === 'success') {
        // Safe matching with products array
        const matched = products && products.length > 0
          ? products.find(
              (p) => p.name.toLowerCase() === result.nama_di_nota?.toLowerCase()
            ) ??
            products.find((p) =>
              result.nama_di_nota &&
              p.name.toLowerCase().includes(result.nama_di_nota.toLowerCase().split(' ')[0])
            ) ??
            null
          : null;

        const fakeProduct: ProductItem = {
          id: matched?.id ?? 'api-result-' + Date.now(),
          name: result.nama_label_rak || 'Produk Terdeteksi',
          category: matched?.category ?? 'Umum',
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

        onScanResultChange({
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
      } else {
        setApiError(result.pesan || 'Gagal memproses label rak');
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Gagal menghubungi server AI');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="pb-24 text-[#1A1A1A] font-sans" style={{ backgroundColor: '#FFFFFF', minHeight: '100%' }}>

      {/* ── GREEN APP BAR ── */}
      <div style={{ backgroundColor: '#15803D' }} className="px-4 pt-4 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              Scan Rak
            </h1>
            <p style={{ fontSize: 16, color: '#BBF7D0', fontWeight: 500, marginTop: 3 }}>
              Periksa harga label etalase toko
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── VIEWFINDER CARD ── */}
        <div className="relative w-full rounded-3xl bg-[#1A1D1E] overflow-hidden shadow-lg" style={{ minHeight: 180 }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#86D6BE] animate-pulse" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#86D6BE' }}>Kamera Pemindai</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlashlightOn(!flashlightOn)}
                aria-label="Senter"
                style={{ width: 40, height: 40 }}
                className={`rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  flashlightOn
                    ? 'bg-[#F59E0B] text-black shadow-md'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                }`}
              >
                <Flashlight className="w-5 h-5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Pilih Foto Galeri"
                style={{ width: 40, height: 40 }}
                className="rounded-full bg-white/15 text-white hover:bg-white/25 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center — 3 states: idle / loading / has-result */}
          <div
            className="flex flex-col items-center justify-center py-5 cursor-pointer select-none"
            onClick={() => !apiLoading && fileInputRef.current?.click()}
            role="button"
            aria-label="Buka kamera untuk scan label rak"
          >
            {apiLoading ? (
              /* STATE 2: AI Loading */
              <div className="relative rounded-2xl bg-black/40 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center p-5 text-center"
                style={{ width: 260, minHeight: 100 }}>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#86D6BE] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#86D6BE] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#86D6BE] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#86D6BE] rounded-br-lg" />
                <div className="flex items-center justify-center gap-2 text-[#86D6BE] mb-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>MEMINDAI AI...</span>
                </div>
                <p style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 500, maxWidth: 200 }} className="truncate mb-2">
                  {AI_AUDIT_STAGES[aiStageIndex]}
                </p>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#86D6BE] transition-all duration-500 rounded-full"
                    style={{ width: `${((aiStageIndex + 1) / AI_AUDIT_STAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            ) : scanResult?.shelfData ? (
              /* STATE 3: Has Result */
              <div className="relative rounded-2xl bg-black/40 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center p-4 text-center"
                style={{ width: 260, minHeight: 90 }}>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#86D6BE] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#86D6BE] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#86D6BE] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#86D6BE] rounded-br-lg" />
                <span style={{ fontSize: 10, color: '#86D6BE', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>
                  ✓ TERDETEKSI
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15803D]/80 border border-[#86D6BE]/40 text-white shadow-sm max-w-[220px]"
                  style={{ fontSize: 13, fontWeight: 700 }}>
                  <Scan className="w-4 h-4 shrink-0 text-[#86D6BE]" />
                  <span className="truncate">{scanResult.shelfData.detectedName}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontWeight: 500 }}>
                  Tap di sini untuk scan ulang
                </span>
              </div>
            ) : (
              /* STATE 1: Idle — belum pernah scan */
              <div className="flex flex-col items-center gap-3 py-2">
                <div
                  className="rounded-full border-2 border-dashed border-[#86D6BE]/60 flex items-center justify-center"
                  style={{ width: 72, height: 72, backgroundColor: 'rgba(134,214,190,0.1)' }}
                >
                  <ImageIcon style={{ width: 32, height: 32, color: '#86D6BE' }} />
                </div>
                <div className="text-center space-y-1">
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                    Tap untuk buka kamera
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                    Pilih foto label harga dari galeri atau kamera
                  </p>
                </div>
                <div
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
                  style={{ backgroundColor: '#15803D', fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}
                >
                  <Scan className="w-4 h-4" />
                  <span>Mulai Scan</span>
                </div>
              </div>
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

        {/* ── ERROR BANNER ── */}
        {apiError && (
          <div className="font-bold px-4 py-4 rounded-2xl bg-[#FEE2E2] border-2 border-[#FECACA] flex items-start gap-3">
            <AlertOctagon style={{ width: 22, height: 22, color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 16, color: '#DC2626', fontWeight: 700 }}>{apiError}</span>
          </div>
        )}

        {/* ── SAMPLE CHIPS ── */}
        <div className="space-y-3">
          <label style={{ fontSize: 15, fontWeight: 700, color: '#6B7280', display: 'block' }}>
            Pilih sampel label rak fisik:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {demoShelfPresets.map((preset) => {
              const isSelected = preset.id === activePresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => processDetection(preset)}
                  className="active:scale-95"
                  style={{
                    height: 52,
                    paddingLeft: 16,
                    paddingRight: 16,
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 700,
                    backgroundColor: isSelected ? '#15803D' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#1A1A1A',
                    border: isSelected ? 'none' : '2px solid #E5E7EB',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{preset.detectedName}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.75)' : '#6B7280' }}>
                    {formatRupiah(preset.detectedPrice)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SCAN RESULT CARD ── */}
        {scanResult && scanResult.matchedProduct && scanResult.analysis && (() => {
          const { matchedProduct: mp, analysis: an, shelfData: sd } = scanResult;
          const statusColor =
            an.status === 'DANGER'
              ? { text: '#DC2626', badgeBg: '#FEE2E2', border: '#FECACA', label: 'Rugi' }
              : an.status === 'WARNING'
              ? { text: '#B45309', badgeBg: '#FEF3C7', border: '#FDE68A', label: 'Tipis' }
              : { text: '#15803D', badgeBg: '#DCFCE7', border: '#BBF7D0', label: 'Aman' };

          return (
            <div
              className="rounded-3xl overflow-hidden bg-white"
              style={{ border: `2px solid ${statusColor.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            >
              {/* Status header stripe */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {an.status === 'HEALTHY'
                    ? <CheckCircle2 style={{ width: 18, height: 18, color: statusColor.text }} />
                    : <AlertOctagon style={{ width: 18, height: 18, color: statusColor.text }} />}
                  <span style={{ fontSize: 15, fontWeight: 800, color: statusColor.text }}>
                    {statusColor.label} - Margin {an.activeMarginPercent.toFixed(1)}%
                  </span>
                </div>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 13, fontWeight: 700, color: statusColor.text,
                    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 999,
                    paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                    border: `1px solid ${statusColor.border}`,
                  }}
                >
                  Rak: {formatRupiah(sd.detectedPrice)}
                </span>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Product name + category */}
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', lineHeight: 1.2 }}>
                    {mp.name}
                  </h2>
                  <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 500, marginTop: 4 }}>
                    Kategori: <strong style={{ color: '#1A1A1A', fontWeight: 700 }}>{mp.category}</strong>
                  </p>
                </div>

                {/* Financial metrics 3-column */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl p-3 border">
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Modal</span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }} className="tabular-nums">
                      {formatRupiah(mp.buyPrice)}
                    </div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ border: `1px solid ${statusColor.border}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor.text, display: 'block', marginBottom: 4 }}>Margin</span>
                    <div style={{ fontSize: 22, fontWeight: 900, color: statusColor.text }} className="tabular-nums">
                      {an.activeMarginPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-2xl p-3 border border-green-200">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D', display: 'block', marginBottom: 4 }}>Saran Harga</span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#15803D' }} className="tabular-nums">
                      {formatRupiah(an.smartRoundedSellPrice)}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => { if (scanResult.matchedProduct) onOpenAlertModal(scanResult.matchedProduct); }}
                  style={{ height: 60, fontSize: 17, fontWeight: 800, borderRadius: 16 }}
                  className="w-full bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-between px-5 transition-all cursor-pointer shadow-md active:scale-[0.98] group"
                >
                  <span>
                    {an.status === 'DANGER'
                      ? `Amankan margin (ubah ke ${formatRupiah(an.smartRoundedSellPrice)})`
                      : `Amankan margin etalase (${formatRupiah(an.smartRoundedSellPrice)})`}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

