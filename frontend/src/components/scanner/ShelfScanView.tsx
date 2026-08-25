import React, { useState, useRef, useEffect } from 'react';
import { ProductItem, ShelfScanData, StoreSettings } from '@/types';
import { calculateMargin, fuzzyMatchScore } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import {
  Image as ImageIcon,
  AlertOctagon,
  Flashlight,
  Scan,
  Sparkles,
  CheckCircle2,
  Camera,
  RefreshCw,
  X,
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
  onAcceptPrice?: (productId: string, newPrice: number, name?: string) => void;
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
  onAcceptPrice,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [apiLoading, setApiLoading] = useState(false);
  const [aiStageIndex, setAiStageIndex] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live WebRTC Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize scanResult safely if null and products available
  useEffect(() => {
    if (!scanResult && products.length > 0) {
      const match = products[0];
      if (match) {
        const calc = calculateMargin(
          match.buyPrice || 0,
          match.currentSellPrice || 0,
          match.targetMarginPercent || settings.defaultTargetMarginPercent,
          settings.roundingStep,
          settings.dangerThresholdPercent
        );
        onScanResultChange({
          shelfData: {
            id: `catalog-${match.id}`,
            detectedName: match.name,
            detectedPrice: match.currentSellPrice,
            confidence: 1,
          },
          matchedProduct: {
            ...match,
            recommendedSellPrice: calc.smartRoundedSellPrice,
          },
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

  // Start Live WebRTC Camera Stream
  const startLiveCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setApiError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera live. Pastikan izin kamera diizinkan di browser.');
      setIsCameraActive(false);
    }
  };

  // Stop Live Camera Stream
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Toggle Camera Facing Mode (Front / Rear)
  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startLiveCamera(nextMode);
    }
  };

  // Toggle Flashlight (Torch) if supported
  const toggleFlashlight = async () => {
    if (!streamRef.current) {
      setFlashlightOn(!flashlightOn);
      return;
    }
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const capabilities = (track.getCapabilities?.() || {}) as any;
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn } as any],
          });
          setFlashlightOn(!flashlightOn);
        } catch (e) {
          console.warn('Flashlight error:', e);
        }
      } else {
        setFlashlightOn(!flashlightOn);
      }
    }
  };

  // Capture current frame from Live Video Stream and process
  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `shelf-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopLiveCamera();
          processImageFile(file);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const processDetection = (preset: ShelfScanData) => {
    setActivePresetId(preset.id);
    stopLiveCamera();

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
        recommendedSellPrice: calculateMargin(
          bestMatch.buyPrice,
          preset.detectedPrice,
          bestMatch.targetMarginPercent || settings.defaultTargetMarginPercent,
          settings.roundingStep,
          settings.dangerThresholdPercent
        ).smartRoundedSellPrice,
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

  const processImageFile = async (file: File) => {
    setApiLoading(true);
    setApiError(null);

    try {
      const result = await auditLabelRak(file, settings.defaultTargetMarginPercent);
      if (result.status === 'success') {
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
          recommendedSellPrice: result.harga_rekomendasi,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopLiveCamera();
      processImageFile(file);
    }
  };

  return (
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* 1. Header Bar */}
      <div className="bg-[#15803D] rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Scan Label Rak
          </h1>
          <p className="text-xs font-medium text-white/90 mt-1">
            Periksa harga label etalase toko & kecocokan margin.
          </p>
        </div>
      </div>

      {/* 2. Viewfinder Camera Box */}
      <div className="bg-[#1A1D1E] border border-[#E5E7EB] rounded-2xl p-3.5 space-y-3 shadow-sm text-white relative overflow-hidden min-h-[280px] flex flex-col justify-between">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#86D6BE] text-xs font-bold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#86D6BE] animate-pulse" />
            <span>{isCameraActive ? 'Live Camera Active' : 'Kamera Pemindai'}</span>
          </div>

          <div className="flex items-center gap-1.5 z-10">
            {isCameraActive && (
              <button
                onClick={toggleCameraFacingMode}
                title="Tukar Kamera"
                className="w-9 h-9 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleFlashlight}
              aria-label="Senter"
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                flashlightOn
                  ? 'bg-amber-500 text-black border-amber-600 shadow-sm'
                  : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
              }`}
            >
              <Flashlight className="w-4 h-4" />
            </button>

            {isCameraActive && (
              <button
                onClick={stopLiveCamera}
                title="Tutup Kamera Live"
                className="w-9 h-9 rounded-lg bg-red-600/80 text-white hover:bg-red-700 border border-red-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Viewfinder Center Area */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-1 min-h-[180px] overflow-hidden rounded-xl">
          {/* STATE A: Live Web Camera Active */}
          {isCameraActive ? (
            <div className="relative w-full h-[220px] bg-black rounded-xl overflow-hidden border border-white/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Reticle Overlay */}
              <div className="absolute inset-3 border-2 border-dashed border-[#86D6BE]/80 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-10 h-10 border-t-2 border-l-2 border-[#86D6BE] absolute top-0 left-0" />
                <div className="w-10 h-10 border-t-2 border-r-2 border-[#86D6BE] absolute top-0 right-0" />
                <div className="w-10 h-10 border-b-2 border-l-2 border-[#86D6BE] absolute bottom-0 left-0" />
                <div className="w-10 h-10 border-b-2 border-r-2 border-[#86D6BE] absolute bottom-0 right-0" />
                <span className="text-[11px] font-bold text-[#86D6BE] bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Posisikan Label Rak di Tengah
                </span>
              </div>
            </div>
          ) : apiLoading ? (
            /* STATE B: AI Processing Loading */
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-[#15803D] space-y-2 text-white w-full max-w-xs text-center shadow-md">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#86D6BE] font-bold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Gemini Vision</span>
                </div>
                <span className="text-[#86D6BE] text-xs font-bold">
                  Tahap {aiStageIndex + 1}/{AI_AUDIT_STAGES.length}
                </span>
              </div>
              <p className="text-xs text-white font-bold truncate">
                {AI_AUDIT_STAGES[aiStageIndex]}
              </p>
              <div className="w-full bg-white/20 h-2 rounded-full border border-white/30 overflow-hidden">
                <div
                  className="h-full bg-[#86D6BE] transition-all duration-500 rounded-full"
                  style={{ width: `${((aiStageIndex + 1) / AI_AUDIT_STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          ) : scanResult?.shelfData ? (
            /* STATE C: Scan Detected Result State */
            <div className="flex flex-col items-center justify-center p-3 text-center space-y-1.5">
              <span className="text-[11px] font-bold text-[#86D6BE] uppercase tracking-wider">
                ✓ Terdeteksi
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#15803D] border border-white/30 text-white shadow-xs font-bold text-xs max-w-[240px]">
                <Scan className="w-4 h-4 shrink-0 text-[#86D6BE]" />
                <span className="truncate">{scanResult.shelfData.detectedName}</span>
              </div>
              <button
                onClick={() => startLiveCamera()}
                className="text-[11px] text-[#86D6BE] hover:underline font-bold cursor-pointer"
              >
                Ketuk di sini untuk aktifkan kamera live & scan lagi
              </button>
            </div>
          ) : (
            /* STATE D: Idle Initial State */
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-dashed border-[#86D6BE] flex items-center justify-center text-[#86D6BE]">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Kamera Pemindai Label Rak
                </p>
                <p className="text-xs text-white/70 font-medium mt-0.5">
                  Aktifkan kamera live di web app atau gunakan app kamera HP
                </p>
              </div>
              <button
                onClick={() => startLiveCamera()}
                className="h-10 px-4 rounded-xl bg-[#15803D] hover:bg-[#15803D]/90 text-white border border-white/30 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors mt-0.5"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Live Kamera Web</span>
              </button>
            </div>
          )}
        </div>

        {/* Shutter Button when Live Camera is Active */}
        {isCameraActive && (
          <div className="flex items-center justify-center pt-1 border-t border-white/15">
            <button
              onClick={capturePhotoFromLiveStream}
              className="w-14 h-14 rounded-full bg-white text-[#15803D] hover:bg-gray-100 flex items-center justify-center shadow-lg border-4 border-[#15803D] active:scale-95 transition-all cursor-pointer"
              title="Jepret Foto Label Rak"
            >
              <div className="w-8 h-8 rounded-full bg-[#15803D] flex items-center justify-center">
                <Scan className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        )}

        {/* Hidden Canvas for Live Stream Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={nativeCameraInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 3. Option Action Bar (Multi-Method Selection) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            if (isCameraActive) {
              stopLiveCamera();
            } else {
              startLiveCamera();
            }
          }}
          className={`h-11 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border shadow-xs ${
            isCameraActive
              ? 'bg-amber-500 text-black border-amber-600'
              : 'bg-[#15803D] text-white border-[#15803D] hover:bg-[#15803D]/90'
          }`}
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>{isCameraActive ? 'Tutup Live' : 'Kamera Live'}</span>
        </button>

        <button
          onClick={() => nativeCameraInputRef.current?.click()}
          className="h-11 px-2 rounded-xl bg-white hover:bg-gray-50 text-[#1A1D1E] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[#E5E7EB] shadow-xs"
        >
          <Camera className="w-4 h-4 shrink-0 text-[#15803D]" />
          <span>App Kamera</span>
        </button>

        <button
          onClick={() => galleryInputRef.current?.click()}
          className="h-11 px-2 rounded-xl bg-white hover:bg-gray-50 text-[#1A1D1E] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[#E5E7EB] shadow-xs"
        >
          <ImageIcon className="w-4 h-4 shrink-0 text-[#1A1D1E]" />
          <span>Galeri Foto</span>
        </button>
      </div>

      {/* Camera & API Error Banners */}
      {(cameraError || apiError) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-xs">
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
          <span>{cameraError || apiError}</span>
        </div>
      )}

      {/* 4. Catalog shortcuts for local testing */}
      {products.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#1A1D1E] block">
            Pilih produk katalog untuk simulasi label:
          </label>
          <div className="flex w-full gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            {products.map((product) => {
              const preset: ShelfScanData = {
                id: `catalog-${product.id}`,
                detectedName: product.name,
                detectedPrice: product.currentSellPrice,
                confidence: 1,
              };
              const isSelected = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                onClick={() => processDetection(preset)}
                className={`h-9 px-3 rounded-full font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap border shrink-0 ${
                  isSelected
                    ? 'bg-[#15803D] text-white border-[#15803D] shadow-xs'
                    : 'bg-white text-[#1A1D1E] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                <span>{preset.detectedName}</span>
                <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  ({formatRupiah(preset.detectedPrice)})
                </span>
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Scan Result Analysis Card */}
      {scanResult && scanResult.matchedProduct && scanResult.analysis && (() => {
        const { matchedProduct: mp, analysis: an, shelfData: sd } = scanResult;
        const statusText = an.status === 'DANGER' ? 'Rugi' : an.status === 'WARNING' ? 'Tipis' : 'Aman';
        const statusColorClass =
          an.status === 'DANGER'
            ? 'text-red-600'
            : an.status === 'WARNING'
            ? 'text-amber-600'
            : 'text-[#15803D]';
          const recommendedPrice = mp.recommendedSellPrice ?? an.smartRoundedSellPrice;

        return (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-sm">
            {/* Status Header Stripe */}
            <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-2.5">
              <div className="flex items-center gap-1.5">
                {an.status === 'HEALTHY' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                ) : (
                  <AlertOctagon className={`w-5 h-5 ${statusColorClass}`} />
                )}
                <span className={`text-sm font-bold uppercase ${statusColorClass}`}>
                  [{statusText} • Margin {an.activeMarginPercent.toFixed(1)}%]
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-medium uppercase block">Harga Terdeteksi</span>
                <span className="text-base font-extrabold text-[#15803D] tabular-nums">
                  {formatRupiah(sd.detectedPrice)}
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h2 className="text-sm font-bold text-[#1A1D1E] leading-snug">
                {mp.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Kategori: {mp.category}
              </p>
            </div>

            {/* Financial Metrics Row */}
            <div className="grid grid-cols-3 gap-2 bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E5E7EB] text-[#1A1D1E]">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Modal (Nota)</span>
                <div className="text-xs font-bold text-[#1A1D1E] mt-0.5 tabular-nums">
                  {formatRupiah(mp.buyPrice)}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Margin Aktif</span>
                <div className={`text-xs font-bold mt-0.5 tabular-nums ${statusColorClass}`}>
                  {an.activeMarginPercent.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#15803D] uppercase block">Saran Jual</span>
                <div className="text-xs font-extrabold text-[#15803D] mt-0.5 tabular-nums">
                  {formatRupiah(an.smartRoundedSellPrice)}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#15803D]">Rekomendasi AI</span>
                  <div className="text-sm font-extrabold text-[#15803D] tabular-nums">
                    {formatRupiah(recommendedPrice)}
                  </div>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#15803D] border border-emerald-200">
                  Margin {an.recommendedMarginPercent.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onAcceptPrice?.(mp.id, recommendedPrice, mp.name)}
                  className="flex-1 h-9 rounded-lg bg-[#15803D] text-white text-[11px] font-bold hover:bg-[#15803D]/90"
                >
                  Terapkan harga
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAlertModal({ ...mp, recommendedSellPrice: recommendedPrice })}
                  className="flex-1 h-9 rounded-lg border border-[#15803D] text-[#15803D] text-[11px] font-bold hover:bg-white"
                >
                  Ketik pilihan sendiri
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
