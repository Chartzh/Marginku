import React, { useState, useRef, useEffect } from 'react';
import { ProductItem, ReceiptScanData, ReceiptItem } from '@/types';
import { demoReceipts } from '@/data/mockProducts';
import { calculateMargin } from '@/lib/math';
import { formatRupiah } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Receipt,
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Edit3,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { scanNota } from '@/services/api';

interface ReceiptScanViewProps {
  products: ProductItem[];
  activeReceipt: ReceiptScanData | null;
  onActiveReceiptChange: (receipt: ReceiptScanData | null) => void;
  onUpdateProductBuyPrice?: (productName: string, newBuyPrice: number) => void;
  onUpdateBuyPrices?: (updatedItems: { productId: string; newBuyPrice: number; productName?: string }[]) => void;
  onOpenAlertModal?: (product: ProductItem) => void;
  onAcceptPrice?: (productId: string, newPrice: number, name?: string) => void;
  onRefreshKatalog?: () => void;
}

const AI_SCAN_STAGES = [
  'Mengunggah gambar nota...',
  'AI Gemini OCR membaca teks struk...',
  'Mengekstrak harga modal & kuantitas...',
  'Menyusun rekap kulakan...',
];

export const ReceiptScanView: React.FC<ReceiptScanViewProps> = ({
  products,
  activeReceipt,
  onActiveReceiptChange,
  onUpdateProductBuyPrice,
  onUpdateBuyPrices,
  onRefreshKatalog,
  onOpenAlertModal,
  onAcceptPrice,
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStageIndex, setAiStageIndex] = useState(0);
  const [syncApplied, setSyncApplied] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manual Editing States
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    rawName: string;
    qty: number;
    unitBuyPrice: number;
  } | null>(null);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<{ storeName: string; date: string }>({
    storeName: '',
    date: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animate AI stages when processing
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setAiStageIndex(0);
      interval = setInterval(() => {
        setAiStageIndex((prev) => (prev < AI_SCAN_STAGES.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadError(null);
    setEditingItemId(null);
    setEditForm(null);

    try {
      const result = await scanNota(file);
      const items: ReceiptItem[] = (result.detail?.items || []).map((item, index) => ({
        id: 'ri-' + index + '-' + Date.now(),
        rawName: item.nama,
        matchedProductName: item.nama,
        qty: item.jumlah || 1,
        unit: 'pcs',
        unitBuyPrice: item.harga_satuan,
        totalBuyPrice: item.total || item.harga_satuan * (item.jumlah || 1),
      }));
      const totalAmount = items.reduce((acc, curr) => acc + curr.totalBuyPrice, 0);

      const convertedData: ReceiptScanData = {
        id: 'rec-api-' + Date.now(),
        storeName: result.supplier || result.detail?.supplier || 'Supplier (AI Scan)',
        date: result.tanggal || result.detail?.tanggal || new Date().toLocaleDateString('id-ID'),
        totalAmount,
        items,
      };

      onActiveReceiptChange(convertedData);
      setSyncApplied(false);
      if (onRefreshKatalog) onRefreshKatalog();
    } catch (error: any) {
      setUploadError(error.message || 'Gagal me-scan nota');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateReceiptScan = () => {
    setIsProcessing(true);
    setSyncApplied(false);
    setEditingItemId(null);
    setEditForm(null);

    setTimeout(() => {
      onActiveReceiptChange(demoReceipts[0]);
      setIsProcessing(false);
    }, 1500);
  };

  // Start Edit Item
  const handleStartEditItem = (item: ReceiptItem) => {
    setEditingItemId(item.id);
    setEditForm({
      rawName: item.matchedProductName || item.rawName,
      qty: item.qty,
      unitBuyPrice: item.unitBuyPrice,
    });
  };

  // Save Edit Item
  const handleSaveEditItem = (itemId: string) => {
    if (!activeReceipt || !editForm) return;

    const updatedItems = activeReceipt.items.map((item) => {
      if (item.id === itemId) {
        const qty = Math.max(1, editForm.qty || 1);
        const unitBuyPrice = Math.max(0, editForm.unitBuyPrice || 0);
        const totalBuyPrice = qty * unitBuyPrice;
        return {
          ...item,
          rawName: editForm.rawName.trim() || item.rawName,
          matchedProductName: editForm.rawName.trim() || item.matchedProductName,
          qty,
          unitBuyPrice,
          totalBuyPrice,
        };
      }
      return item;
    });

    const totalAmount = updatedItems.reduce((acc, curr) => acc + curr.totalBuyPrice, 0);

    onActiveReceiptChange({
      ...activeReceipt,
      items: updatedItems,
      totalAmount,
    });

    setEditingItemId(null);
    setEditForm(null);
    setSyncApplied(false);
  };

  // Cancel Edit Item
  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditForm(null);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    if (!activeReceipt) return;

    const updatedItems = activeReceipt.items.filter((item) => item.id !== itemId);
    const totalAmount = updatedItems.reduce((acc, curr) => acc + curr.totalBuyPrice, 0);

    onActiveReceiptChange({
      ...activeReceipt,
      items: updatedItems,
      totalAmount,
    });

    if (editingItemId === itemId) {
      setEditingItemId(null);
      setEditForm(null);
    }
    setSyncApplied(false);
  };

  // Add Item Manual
  const handleAddItem = () => {
    if (!activeReceipt) return;

    const newItemId = 'ri-' + Date.now();
    const newItem: ReceiptItem = {
      id: newItemId,
      rawName: 'Produk Baru',
      matchedProductName: 'Produk Baru',
      qty: 1,
      unit: 'pcs',
      unitBuyPrice: 10000,
      totalBuyPrice: 10000,
    };

    const updatedItems = [...activeReceipt.items, newItem];
    const totalAmount = updatedItems.reduce((acc, curr) => acc + curr.totalBuyPrice, 0);

    onActiveReceiptChange({
      ...activeReceipt,
      items: updatedItems,
      totalAmount,
    });

    setEditingItemId(newItemId);
    setEditForm({
      rawName: newItem.rawName,
      qty: newItem.qty,
      unitBuyPrice: newItem.unitBuyPrice,
    });
    setSyncApplied(false);
  };

  // Start Header Edit
  const handleStartEditHeader = () => {
    if (!activeReceipt) return;
    setHeaderForm({
      storeName: activeReceipt.storeName,
      date: activeReceipt.date,
    });
    setIsEditingHeader(true);
  };

  // Save Header Edit
  const handleSaveHeader = () => {
    if (!activeReceipt) return;
    onActiveReceiptChange({
      ...activeReceipt,
      storeName: headerForm.storeName.trim() || activeReceipt.storeName,
      date: headerForm.date.trim() || activeReceipt.date,
    });
    setIsEditingHeader(false);
  };

  const handleSyncAllPrices = async () => {
    if (!activeReceipt) return;

    setIsSyncingSupabase(true);
    const updates: { productId: string; newBuyPrice: number; productName?: string }[] = [];

    activeReceipt.items.forEach((item) => {
      const matchName = item.matchedProductName || item.rawName;
      const match = products.find(
        (p) => p.name.toLowerCase() === matchName.toLowerCase()
      );
      if (match) {
        if (onUpdateProductBuyPrice) {
          onUpdateProductBuyPrice(match.name, item.unitBuyPrice);
        }
        updates.push({
          productId: match.id,
          newBuyPrice: item.unitBuyPrice,
          productName: match.name,
        });
      }
    });

    if (onUpdateBuyPrices) {
      onUpdateBuyPrices(updates);
    }

    if (user?.id) {
      try {
        for (const item of activeReceipt.items) {
          const matchName = (item.matchedProductName || item.rawName).trim();
          if (!matchName || item.unitBuyPrice <= 0) continue;

          const { data: existingRows } = await supabase
            .from('katalog_produk')
            .select('id, harga_jual, target_margin_persen')
            .eq('user_id', user.id)
            .ilike('nama', matchName);

          if (existingRows && existingRows.length > 0) {
            const row = existingRows[0];
            const targetMargin = row.target_margin_persen || 15.0;
            const targetRaw = item.unitBuyPrice / (1 - targetMargin / 100);
            const smartRounded = Math.ceil(targetRaw / 500) * 500;
            const newSellPrice = row.harga_jual > 0 ? row.harga_jual : smartRounded;

            await supabase
              .from('katalog_produk')
              .update({
                harga_modal: item.unitBuyPrice,
                harga_jual: newSellPrice,
              })
              .eq('id', row.id);
          } else {
            const targetRaw = item.unitBuyPrice / 0.85;
            const smartRounded = Math.ceil(targetRaw / 500) * 500;
            await supabase.from('katalog_produk').insert({
              user_id: user.id,
              nama: matchName,
              harga_modal: item.unitBuyPrice,
              harga_jual: smartRounded,
              kategori: 'Umum',
              satuan: item.unit || 'pcs',
              stok: item.qty || 10,
              target_margin_persen: 15.0,
            });
          }
        }

        if (onRefreshKatalog) {
          onRefreshKatalog();
        }
      } catch (err) {
        console.error('Gagal sinkronkan ke Supabase:', err);
      }
    }

    setIsSyncingSupabase(false);
    setSyncApplied(true);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#1B6440', '#86D6BE', '#154E30'],
    });
  };

  return (
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* 1. Screen Header */}
      <div className="bg-[#15803D] rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Scan Nota Grosir
          </h1>
          <p className="text-xs font-medium text-white/90 mt-1">
            Perbarui harga modal kulakan langsung dari struk agen belanja.
          </p>
        </div>
      </div>

      {/* 2. Upload Zone Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-2.5">
          <div>
            <div className="text-sm font-bold text-[#1A1D1E]">
              Ekstraksi Nota Agen Otomatis
            </div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">
              Mendeteksi barang kulakan & kenaikan harga beli
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Real-time AI Progress Bar */}
        {isProcessing && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-[#15803D] space-y-1.5 text-[#1A1D1E]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#15803D] font-bold">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI Gemini Vision OCR</span>
              </div>
              <span className="text-[#15803D] text-xs font-bold">
                Tahap {aiStageIndex + 1}/{AI_SCAN_STAGES.length}
              </span>
            </div>

            <p className="text-xs text-[#1A1D1E] font-bold truncate">
              {AI_SCAN_STAGES[aiStageIndex]}
            </p>

            <div className="w-full bg-white h-2 rounded-full border border-[#E5E7EB] overflow-hidden">
              <div
                className="h-full bg-[#15803D] transition-all duration-500 rounded-full"
                style={{
                  width: `${((aiStageIndex + 1) / AI_SCAN_STAGES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={simulateReceiptScan}
            disabled={isProcessing}
            className="h-11 px-3 rounded-xl bg-[#15803D] hover:bg-[#15803D]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membaca...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-white" />
                <span>Simulasi scan</span>
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="h-11 px-3 rounded-xl bg-white hover:bg-gray-50 text-[#1A1D1E] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-[#E5E7EB] shadow-xs"
          >
            <Upload className="w-4 h-4 text-[#1A1D1E]" />
            <span>Upload struk</span>
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleRealUpload}
            className="hidden"
          />
        </div>

        {uploadError && (
          <p className="text-xs text-red-600 font-bold mt-1">{uploadError}</p>
        )}
      </div>

      {/* 3. Extracted Receipt Details Card */}
      {activeReceipt && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3.5 shadow-sm">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-[#F0F2F5] pb-3">
            {isEditingHeader ? (
              <div className="space-y-2 w-full pr-2">
                <input
                  type="text"
                  value={headerForm.storeName}
                  onChange={(e) => setHeaderForm({ ...headerForm, storeName: e.target.value })}
                  className="w-full h-10 bg-white border border-[#E5E7EB] text-xs font-bold text-[#1A1D1E] px-3 rounded-xl focus:outline-none focus:border-[#15803D]"
                  placeholder="Nama Supplier"
                />
                <input
                  type="text"
                  value={headerForm.date}
                  onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                  className="w-full h-10 bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-medium px-3 rounded-xl focus:outline-none focus:border-[#15803D]"
                  placeholder="Tanggal Nota"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveHeader}
                    className="h-9 px-3 bg-[#15803D] hover:bg-[#15803D]/90 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="h-9 px-3 bg-white text-[#1A1D1E] text-xs font-bold rounded-xl border border-[#E5E7EB] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[#1A1D1E]">
                    {activeReceipt.storeName}
                  </h2>
                  <button
                    onClick={handleStartEditHeader}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                    title="Edit info supplier"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5 tabular-nums">
                  {activeReceipt.date} • {activeReceipt.items.length} Barang Terdeteksi
                </div>
              </div>
            )}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-gray-500 font-medium uppercase block">Total Belanja</span>
              <div className="text-base font-extrabold text-[#15803D] tabular-nums">
                {formatRupiah(activeReceipt.totalAmount)}
              </div>
            </div>
          </div>

          {/* Edit Instruction Notice */}
          <div className="flex items-center gap-1.5 text-xs text-[#1A1D1E] font-medium bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
            <span className="text-amber-600">💡</span>
            <span>Tekan ikon pensil pada barang untuk mengoreksi pembacaan AI.</span>
          </div>

          {/* Item Breakdown List */}
          <div className="flex flex-col space-y-2">
            {activeReceipt.items.map((item) => {
              const isEditing = editingItemId === item.id;
              const matchName = item.matchedProductName || item.rawName;
              const currentProduct = products.find(
                (p) => p.name.toLowerCase() === matchName.toLowerCase()
              );

              const oldBuyPrice = currentProduct?.buyPrice || item.unitBuyPrice;
              const priceIncreased = item.unitBuyPrice > oldBuyPrice;
              const selisihKenaikan = item.unitBuyPrice - oldBuyPrice;
              const recommendation = calculateMargin(
                item.unitBuyPrice,
                currentProduct?.currentSellPrice || 0,
                currentProduct?.targetMarginPercent || 15,
                500,
                5
              );

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5 text-[#1A1D1E]"
                  >
                    <div className="text-xs font-bold text-[#15803D] flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" />
                      <span>Koreksi Hasil Pemindaian</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[#1A1D1E] font-bold block">
                        Nama Barang di Struk / Katalog:
                      </label>
                      <input
                        type="text"
                        value={editForm?.rawName || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm!, rawName: e.target.value })
                        }
                        className="w-full h-10 bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-medium px-3 rounded-xl focus:outline-none focus:border-[#15803D]"
                        placeholder="Contoh: Indomie Goreng 85g"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-[#1A1D1E] font-bold block">
                          Jumlah (Qty):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm?.qty ?? 1}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, qty: Number(e.target.value) })
                          }
                          className="w-full h-10 bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-medium px-3 rounded-xl focus:outline-none focus:border-[#15803D] tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-[#1A1D1E] font-bold block">
                          Harga Modal Satuan (Rp):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={editForm?.unitBuyPrice ?? 0}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm!,
                              unitBuyPrice: Number(e.target.value),
                            })
                          }
                          className="w-full h-10 bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] font-medium px-3 rounded-xl focus:outline-none focus:border-[#15803D] tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200">
                      <span>Subtotal Koreksi:</span>
                      <span className="font-extrabold text-sm text-[#1A1D1E] tabular-nums">
                        {formatRupiah((editForm?.qty || 0) * (editForm?.unitBuyPrice || 0))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEditItem(item.id)}
                          className="h-9 px-3.5 bg-[#15803D] hover:bg-[#15803D]/90 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-4 h-4" /> Simpan
                        </button>
                        <button
                          onClick={handleCancelEditItem}
                          className="h-9 px-3.5 bg-white text-[#1A1D1E] text-xs font-bold rounded-xl border border-[#E5E7EB] hover:bg-gray-50 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" /> Batal
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hapus barang ini dari nota"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col gap-2 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#1A1D1E] leading-snug">
                        {matchName}
                      </h3>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">
                        {item.qty} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 font-medium uppercase block">Modal Baru</span>
                        <div className="text-sm font-extrabold text-[#1A1D1E] tabular-nums">
                          {formatRupiah(item.unitBuyPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleStartEditItem(item)}
                          className="w-7 h-7 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:bg-gray-100 transition-colors cursor-pointer bg-white"
                          title="Edit item ini"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-white"
                          title="Hapus item ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0F2F5] text-xs">
                    {priceIncreased ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold text-[11px] inline-flex items-center gap-1 tabular-nums">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Modal naik +{formatRupiah(selisihKenaikan)}/item</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#15803D] font-bold text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                        <span>Modal tetap</span>
                      </span>
                    )}

                    <span className="text-xs text-gray-500 font-medium tabular-nums">
                      Subtotal: <strong className="text-[#1A1D1E] font-bold text-xs">{formatRupiah(item.totalBuyPrice)}</strong>
                    </span>
                  </div>

                  {recommendation.smartRoundedSellPrice !== (currentProduct?.currentSellPrice || 0) && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#15803D]">Rekomendasi AI</span>
                          <div className="text-sm font-extrabold text-[#15803D] tabular-nums">
                            {formatRupiah(recommendation.smartRoundedSellPrice)}
                          </div>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#15803D] border border-emerald-200">
                          Margin {recommendation.recommendedMarginPercent.toFixed(1)}%
                        </span>
                      </div>
                      {currentProduct && (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onAcceptPrice?.(currentProduct.id, recommendation.smartRoundedSellPrice, currentProduct.name)}
                            className="flex-1 h-9 rounded-lg bg-[#15803D] text-white text-[11px] font-bold hover:bg-[#15803D]/90"
                          >
                            Terapkan harga
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenAlertModal?.({ ...currentProduct, recommendedSellPrice: recommendation.smartRoundedSellPrice })}
                            className="flex-1 h-9 rounded-lg border border-[#15803D] text-[#15803D] text-[11px] font-bold hover:bg-white"
                          >
                            Ketik pilihan sendiri
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            className="w-full h-10 rounded-xl border border-dashed border-[#E5E7EB] bg-white hover:bg-emerald-50 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Barang Manual</span>
          </button>

          {/* Primary Sync CTA Button */}
          <button
            onClick={handleSyncAllPrices}
            disabled={syncApplied || isSyncingSupabase}
            className={`w-full h-11 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed ${
              syncApplied
                ? 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                : 'bg-[#15803D] hover:bg-[#15803D]/90 text-white'
            }`}
          >
            {isSyncingSupabase ? (
              <div className="flex items-center gap-2 justify-center w-full">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan ke database katalog...</span>
              </div>
            ) : syncApplied ? (
              <div className="flex items-center justify-center w-full gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Seluruh harga modal telah disinkronkan</span>
              </div>
            ) : (
              <>
                <span>Sinkronkan ke database warung ({activeReceipt.items.length} barang)</span>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
