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
  Camera,
  RefreshCw,
  X,
  Upload,
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

  const processDetection = (preset: typeof demoShelfPresets[0]) => {
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
    <div className="space-y-6 pb-28 text-[#1A1A1A] font-sans bg-white min-h-screen">
      {/* 1. Header Bar */}
      <div className="-mx-4 -mt-4 mb-6 bg-[#15803D] p-5 text-white flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-none">
            Scan Label Rak
          </h1>
          <p className="text-lg font-medium text-white/90 mt-1">
            Periksa harga label etalase toko & kecocokan margin.
          </p>
        </div>
      </div>

      {/* 2. Viewfinder Camera Box */}
      <div className="bg-[#1A1D1E] border-2 border-[#1A1A1A] rounded-lg p-4 space-y-4 shadow text-white relative overflow-hidden min-h-[320px] flex flex-col justify-between">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#86D6BE] text-sm font-bold backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#86D6BE] animate-pulse" />
            <span>{isCameraActive ? 'Live Camera Active' : 'Kamera Pemindai'}</span>
          </div>

          <div className="flex items-center gap-2 z-10">
            {isCameraActive && (
              <button
                onClick={toggleCameraFacingMode}
                title="Tukar Kamera"
                className="w-[44px] h-[44px] rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={toggleFlashlight}
              aria-label="Senter"
              className={`w-[44px] h-[44px] rounded-lg flex items-center justify-center border-2 transition-colors cursor-pointer ${
                flashlightOn
                  ? 'bg-amber-500 text-black border-amber-600 shadow'
                  : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
              }`}
            >
              <Flashlight className="w-5 h-5" />
            </button>

            {isCameraActive && (
              <button
                onClick={stopLiveCamera}
                title="Tutup Kamera Live"
                className="w-[44px] h-[44px] rounded-lg bg-red-600/80 text-white hover:bg-red-700 border border-red-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Viewfinder Center Area */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-2 min-h-[200px] overflow-hidden rounded-lg">
          {/* STATE A: Live Web Camera Active */}
          {isCameraActive ? (
            <div className="relative w-full h-[260px] bg-black rounded-lg overflow-hidden border border-white/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Reticle Overlay */}
              <div className="absolute inset-4 border-2 border-dashed border-[#86D6BE]/80 rounded-lg pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-[#86D6BE] absolute top-0 left-0" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-[#86D6BE] absolute top-0 right-0" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-[#86D6BE] absolute bottom-0 left-0" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-[#86D6BE] absolute bottom-0 right-0" />
                <span className="text-xs font-extrabold text-[#86D6BE] bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                  Posisikan Label Rak di Tengah
                </span>
              </div>
            </div>
          ) : apiLoading ? (
            /* STATE B: AI Processing Loading */
            <div className="p-5 rounded-lg bg-emerald-950/80 border-2 border-[#15803D] space-y-3 text-white w-full max-w-xs text-center shadow-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#86D6BE] font-black">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>AI Gemini Vision</span>
                </div>
                <span className="text-[#86D6BE] text-xs font-black">
                  Tahap {aiStageIndex + 1}/{AI_AUDIT_STAGES.length}
                </span>
              </div>
              <p className="text-base text-white font-extrabold truncate">
                {AI_AUDIT_STAGES[aiStageIndex]}
              </p>
              <div className="w-full bg-white/20 h-3 rounded-lg border border-white/30 overflow-hidden">
                <div
                  className="h-full bg-[#86D6BE] transition-all duration-500 rounded-lg"
                  style={{ width: `${((aiStageIndex + 1) / AI_AUDIT_STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          ) : scanResult?.shelfData ? (
            /* STATE C: Scan Detected Result State */
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
              <span className="text-xs font-black text-[#86D6BE] uppercase tracking-widest">
                ✓ Terdeteksi
              </span>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#15803D] border-2 border-white/40 text-white shadow font-bold text-base max-w-[260px]">
                <Scan className="w-5 h-5 shrink-0 text-[#86D6BE]" />
                <span className="truncate">{scanResult.shelfData.detectedName}</span>
              </div>
              <button
                onClick={() => startLiveCamera()}
                className="text-xs text-[#86D6BE] hover:underline font-bold mt-1 cursor-pointer"
              >
                Ketuk di sini untuk aktifkan kamera live & scan lagi
              </button>
            </div>
          ) : (
            /* STATE D: Idle Initial State */
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-dashed border-[#86D6BE] flex items-center justify-center text-[#86D6BE]">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-black text-white">
                  Kamera Pemindai Label Rak
                </p>
                <p className="text-sm text-white/70 font-bold mt-0.5">
                  Aktifkan kamera live di web app atau gunakan app kamera HP
                </p>
              </div>
              <button
                onClick={() => startLiveCamera()}
                className="min-h-[52px] px-6 rounded-lg bg-[#15803D] hover:bg-[#15803D]/90 text-white border-2 border-white/30 font-extrabold text-base inline-flex items-center gap-2 shadow cursor-pointer transition-colors mt-1"
              >
                <Camera className="w-5 h-5" />
                <span>Buka Live Kamera Web</span>
              </button>
            </div>
          )}
        </div>

        {/* Shutter Button when Live Camera is Active */}
        {isCameraActive && (
          <div className="flex items-center justify-center pt-2 border-t border-white/15">
            <button
              onClick={capturePhotoFromLiveStream}
              className="w-16 h-16 rounded-full bg-white text-[#15803D] hover:bg-gray-100 flex items-center justify-center shadow-xl border-4 border-[#15803D] active:scale-95 transition-all cursor-pointer"
              title="Jepret Foto Label Rak"
            >
              <div className="w-10 h-10 rounded-full bg-[#15803D] flex items-center justify-center">
                <Scan className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>
        )}

        {/* Hidden Canvas for Live Stream Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Hidden File Inputs */}
      {/* 1. App Kamera HP (Native Camera Capture) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={nativeCameraInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* 2. Galeri Foto */}
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
          className={`min-h-[54px] px-2 rounded-lg font-extrabold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 shadow ${
            isCameraActive
              ? 'bg-amber-500 text-black border-amber-600'
              : 'bg-[#15803D] text-white border-[#1A1A1A] hover:bg-[#15803D]/90'
          }`}
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>{isCameraActive ? 'Tutup Live' : 'Kamera Live'}</span>
        </button>

        <button
          onClick={() => nativeCameraInputRef.current?.click()}
          className="min-h-[54px] px-2 rounded-lg bg-white hover:bg-gray-100 text-[#1A1A1A] font-extrabold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#1A1A1A] shadow"
        >
          <Camera className="w-4 h-4 shrink-0 text-[#15803D]" />
          <span>App Kamera</span>
        </button>

        <button
          onClick={() => galleryInputRef.current?.click()}
          className="min-h-[54px] px-2 rounded-lg bg-white hover:bg-gray-100 text-[#1A1A1A] font-extrabold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-2 border-[#1A1A1A] shadow"
        >
          <ImageIcon className="w-4 h-4 shrink-0 text-[#1A1A1A]" />
          <span>Galeri Foto</span>
        </button>
      </div>

      {/* Camera & API Error Banners */}
      {(cameraError || apiError) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border-2 border-red-600 text-red-600 font-extrabold text-base">
          <AlertOctagon className="w-6 h-6 text-red-600 shrink-0" />
          <span>{cameraError || apiError}</span>
        </div>
      )}

      {/* 4. Sample Chips (Presets) */}
      <div className="space-y-3">
        <label className="text-base font-extrabold text-[#1A1A1A] block">
          Pilih sampel label rak fisik:
        </label>
        <div className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {demoShelfPresets.map((preset) => {
            const isSelected = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                onClick={() => processDetection(preset)}
                className={`min-h-[60px] px-5 rounded-lg font-black text-base transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap border-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#15803D] text-white border-[#15803D] shadow'
                    : 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-gray-100'
                }`}
              >
                <span>{preset.detectedName}</span>
                <span className={`text-sm font-bold ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                  ({formatRupiah(preset.detectedPrice)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

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

        return (
          <div className="bg-white border-2 border-[#1A1A1A] rounded-lg p-5 space-y-4 shadow">
            {/* Status Header Stripe */}
            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                {an.status === 'HEALTHY' ? (
                  <CheckCircle2 className="w-6 h-6 text-[#15803D]" />
                ) : (
                  <AlertOctagon className={`w-6 h-6 ${statusColorClass}`} />
                )}
                <span className={`text-lg font-black uppercase ${statusColorClass}`}>
                  [{statusText} - Margin {an.activeMarginPercent.toFixed(1)}%]
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-600 font-extrabold uppercase block">Harga Terdeteksi</span>
                <span className="text-xl font-black text-[#15803D] tabular-nums">
                  {formatRupiah(sd.detectedPrice)}
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h2 className="text-[22px] font-black text-[#1A1A1A] leading-tight">
                {mp.name}
              </h2>
              <p className="text-[16px] text-gray-700 font-bold mt-1">
                Kategori: {mp.category}
              </p>
            </div>

            {/* Financial Metrics Row */}
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-3 rounded-lg border-2 border-gray-300 text-[#1A1A1A]">
              <div>
                <span className="text-xs font-bold text-gray-600 uppercase block">Modal (Nota)</span>
                <div className="text-lg font-black text-[#1A1A1A] mt-0.5 tabular-nums">
                  {formatRupiah(mp.buyPrice)}
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-600 uppercase block">Margin Aktif</span>
                <div className={`text-lg font-black mt-0.5 tabular-nums ${statusColorClass}`}>
                  {an.activeMarginPercent.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-[#15803D] uppercase block">Saran Jual</span>
                <div className="text-lg font-black text-[#15803D] mt-0.5 tabular-nums">
                  {formatRupiah(an.smartRoundedSellPrice)}
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => {
                if (scanResult.matchedProduct) onOpenAlertModal(scanResult.matchedProduct);
              }}
              className="w-full min-h-[60px] px-5 rounded-lg bg-[#15803D] hover:bg-[#15803D]/90 text-white font-extrabold text-lg flex items-center justify-between transition-colors cursor-pointer border-2 border-[#1A1A1A] shadow"
            >
              <span>
                {an.status === 'DANGER'
                  ? `Amankan margin (ubah ke ${formatRupiah(an.smartRoundedSellPrice)})`
                  : `Amankan margin etalase (${formatRupiah(an.smartRoundedSellPrice)})`}
              </span>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>
        );
      })()}
    </div>
  );
};


