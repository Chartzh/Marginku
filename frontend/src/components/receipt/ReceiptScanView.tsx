import React, { useState, useRef, useEffect } from 'react';
import { ProductItem, ReceiptScanData, ReceiptItem } from '@/types';
import { demoReceipts } from '@/data/mockProducts';
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

    // Update local state products
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

    // Sync to Supabase `katalog_produk` if user is logged in
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
    <div className="space-y-4 pb-20 text-[#1A1D1E] font-sans" style={{ backgroundColor: '#FFFFFF', minHeight: '100%' }}>
      {/* 1. Screen Title */}
      <div style={{ backgroundColor: '#15803D' }} className="px-4 pt-4 pb-5">
        <div className="pt-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
            Scan Nota Grosir
          </h1>
          <p style={{ fontSize: 15, color: '#BBF7D0', fontWeight: 500, marginTop: 3 }}>
            Perbarui harga modal kulakan langsung dari struk agen belanja.
          </p>
        </div>
      </div>

      {/* 2. Upload Zone Card (Clean White Surface) */}
      <div className="rounded-3xl p-5 bg-white border border-[#E5E7EB] space-y-4 shadow-card">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
          <div>
            <div className="text-sm font-extrabold text-[#1A1D1E]">
              Ekstraksi Nota Agen Otomatis
            </div>
            <div className="text-xs text-[#6B7280] mt-0.5">
              Mendeteksi barang kulakan & kenaikan harga beli
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#EBF5F0] border border-[#15803D] flex items-center justify-center text-[#1B6440]">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Real-time AI Progress Bar */}
        {isProcessing && (
          <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-[#D1E7DD] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#1B6440] font-bold">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span className="text-xs">AI Gemini Vision OCR</span>
              </div>
              <span className="text-[#1B6440] text-[11px] font-bold">
                Tahap {aiStageIndex + 1}/{AI_SCAN_STAGES.length}
              </span>
            </div>

            <p className="text-xs text-[#1A1D1E] font-medium truncate">
              {AI_SCAN_STAGES[aiStageIndex]}
            </p>

            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1B6440] transition-all duration-500 rounded-full"
                style={{
                  width: `${((aiStageIndex + 1) / AI_SCAN_STAGES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={simulateReceiptScan}
            disabled={isProcessing}
            className="h-[48px] px-4 rounded-full font-bold text-xs bg-[#15803D] hover:bg-[#154E30] text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-floating"
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
            className="h-[48px] px-4 rounded-full font-bold text-xs bg-[#F4F6F5] hover:bg-[#EAECEB] text-[#1A1D1E] border border-[#E5E7EB] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-[#6B7280]" />
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
          <p className="text-xs text-[#DC2626] font-medium mt-1">{uploadError}</p>
        )}
      </div>

      {/* 3. Extracted Receipt Details Card */}
      {activeReceipt && (
        <div className="rounded-3xl p-5 bg-white border border-[#E5E7EB] space-y-4 shadow-card">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-[#F0F2F5] pb-3">
            {isEditingHeader ? (
              <div className="space-y-2 w-full pr-2">
                <input
                  type="text"
                  value={headerForm.storeName}
                  onChange={(e) => setHeaderForm({ ...headerForm, storeName: e.target.value })}
                  className="w-full bg-[#F4F6F5] border border-[#E5E7EB] text-xs font-bold text-[#1A1D1E] px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#1B6440]"
                  placeholder="Nama Supplier"
                />
                <input
                  type="text"
                  value={headerForm.date}
                  onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                  className="w-full bg-[#F4F6F5] border border-[#E5E7EB] text-xs text-[#6B7280] px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#1B6440]"
                  placeholder="Tanggal Nota"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveHeader}
                    className="px-3.5 py-1.5 bg-[#15803D] hover:bg-[#154E30] text-white text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="px-3.5 py-1.5 bg-[#F4F6F5] text-[#6B7280] text-xs rounded-full border border-[#E5E7EB] flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#1A1D1E]">
                    {activeReceipt.storeName}
                  </h2>
                  <button
                    onClick={handleStartEditHeader}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1A1D1E] hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                    title="Edit info supplier"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                  {activeReceipt.date} • {activeReceipt.items.length} Barang Terdeteksi
                </div>
              </div>
            )}
            <div className="text-right shrink-0">
              <span className="text-[11px] text-[#6B7280] font-medium block">Total Belanja</span>
              <div className="text-lg font-extrabold text-[#15803D] tabular-nums">
                {formatRupiah(activeReceipt.totalAmount)}
              </div>
            </div>
          </div>

          {/* Edit Instruction Notice */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-[#F8F9FA] px-3.5 py-2.5 rounded-2xl border border-[#E5E7EB]">
            <span className="text-amber-500">💡</span>
            <span>Tekan ikon pensil pada barang untuk mengoreksi pembacaan AI.</span>
          </div>

          {/* Item Breakdown List */}
          <div className="space-y-3">
            {activeReceipt.items.map((item) => {
              const isEditing = editingItemId === item.id;
              const matchName = item.matchedProductName || item.rawName;
              const currentProduct = products.find(
                (p) => p.name.toLowerCase() === matchName.toLowerCase()
              );

              const oldBuyPrice = currentProduct?.buyPrice || item.unitBuyPrice;
              const priceIncreased = item.unitBuyPrice > oldBuyPrice;
              const selisihKenaikan = item.unitBuyPrice - oldBuyPrice;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#1B6440] space-y-3"
                  >
                    <div className="text-xs font-bold text-[#1B6440] flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" />
                      <span>Koreksi Hasil Pemindaian</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6B7280] font-medium block">
                        Nama Barang di Struk / Katalog:
                      </label>
                      <input
                        type="text"
                        value={editForm?.rawName || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm!, rawName: e.target.value })
                        }
                        className="w-full bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] p-2.5 rounded-xl focus:outline-none focus:border-[#1B6440]"
                        placeholder="Contoh: Indomie Goreng 85g"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6B7280] font-medium block">
                          Jumlah (Qty):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm?.qty ?? 1}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, qty: Number(e.target.value) })
                          }
                          className="w-full bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] p-2.5 rounded-xl focus:outline-none focus:border-[#1B6440] tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6B7280] font-medium block">
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
                          className="w-full bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] p-2.5 rounded-xl focus:outline-none focus:border-[#1B6440] tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
                      <span>Subtotal Koreksi:</span>
                      <span className="font-bold text-[#1A1D1E] tabular-nums">
                        {formatRupiah((editForm?.qty || 0) * (editForm?.unitBuyPrice || 0))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEditItem(item.id)}
                          className="px-4 py-2 bg-[#15803D] hover:bg-[#154E30] text-white text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Simpan
                        </button>
                        <button
                          onClick={handleCancelEditItem}
                          className="px-4 py-2 bg-white text-[#6B7280] text-xs font-medium rounded-full border border-[#E5E7EB] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Batal
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3.5 py-2 text-[#DC2626] hover:bg-[#FEE2E2] text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hapus barang ini dari nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-3 group transition-colors hover:border-[#1B6440]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1D1E]">
                        {matchName}
                      </h3>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        {item.qty} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-[#6B7280] block font-medium">Modal Baru</span>
                        <div className="text-sm font-bold text-[#1A1D1E] tabular-nums">
                          {formatRupiah(item.unitBuyPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleStartEditItem(item)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1A1D1E] hover:bg-white transition-colors cursor-pointer"
                          title="Edit item ini"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          title="Hapus item ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E7EB] text-xs">
                    {priceIncreased ? (
                      <span className="px-3 py-1 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] font-bold text-[11px] inline-flex items-center gap-1 tabular-nums">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Modal naik +{formatRupiah(selisihKenaikan)}/item</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-[#EBF5F0] border border-[#D1E7DD] text-[#1B6440] font-medium text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1B6440]" />
                        <span>Modal tetap</span>
                      </span>
                    )}

                    <span className="text-xs text-[#6B7280] tabular-nums font-bold">
                      Subtotal: <strong className="text-[#1A1D1E]">{formatRupiah(item.totalBuyPrice)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            className="w-full h-[46px] rounded-full border border-dashed border-[#D1D5DB] bg-[#F8F9FA] hover:bg-[#EBF5F0] hover:border-[#1B6440] text-xs font-bold text-[#1B6440] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Manual</span>
          </button>

          {/* Primary Sync CTA Button */}
          <button
            onClick={handleSyncAllPrices}
            disabled={syncApplied || isSyncingSupabase}
            className={`w-full h-[52px] px-5 rounded-full font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-floating active:scale-[0.98] group ${syncApplied
              ? 'bg-[#EBF5F0] border border-[#D1E7DD] text-[#1B6440]'
              : 'bg-[#15803D] hover:bg-[#154E30] text-white'
              }`}
          >
            {isSyncingSupabase ? (
              <div className="flex items-center gap-2 justify-center w-full">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan ke database katalog...</span>
              </div>
            ) : syncApplied ? (
              <div className="flex items-center justify-center w-full gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B6440]" />
                <span>Seluruh harga modal telah disinkronkan</span>
              </div>
            ) : (
              <>
                <span>Sinkronkan ke database warung ({activeReceipt.items.length} barang)</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
