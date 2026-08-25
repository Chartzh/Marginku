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
    <div className="space-y-6 pb-28 text-[#1A1A1A] font-sans bg-white min-h-screen">
      {/* 1. Screen Header */}
      <div className="-mx-4 -mt-4 mb-6 bg-[#15803D] p-5 text-white flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-none">
            Scan Nota Grosir
          </h1>
          <p className="text-lg font-medium text-white/90 mt-1">
            Perbarui harga modal kulakan langsung dari struk agen belanja.
          </p>
        </div>
      </div>

      {/* 2. Upload Zone Card */}
      <div className="bg-white border-2 border-[#1A1A1A] rounded-lg p-5 space-y-4 shadow">
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
          <div>
            <div className="text-lg font-black text-[#1A1A1A]">
              Ekstraksi Nota Agen Otomatis
            </div>
            <div className="text-base text-gray-700 font-bold mt-0.5">
              Mendeteksi barang kulakan & kenaikan harga beli
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[#15803D] text-white flex items-center justify-center shrink-0 border-2 border-[#1A1A1A]">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Real-time AI Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-lg bg-emerald-50 border-2 border-[#15803D] space-y-2 text-[#1A1A1A]">
            <div className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2 text-[#15803D] font-black">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>AI Gemini Vision OCR</span>
              </div>
              <span className="text-[#15803D] text-sm font-black">
                Tahap {aiStageIndex + 1}/{AI_SCAN_STAGES.length}
              </span>
            </div>

            <p className="text-base text-[#1A1A1A] font-extrabold truncate">
              {AI_SCAN_STAGES[aiStageIndex]}
            </p>

            <div className="w-full bg-white h-3 rounded-lg border border-[#1A1A1A] overflow-hidden">
              <div
                className="h-full bg-[#15803D] transition-all duration-500 rounded-lg"
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
            className="min-h-[60px] px-4 rounded-lg bg-[#15803D] hover:bg-[#15803D]/90 text-white font-extrabold text-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 border-2 border-[#1A1A1A] shadow"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Membaca...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 text-white" />
                <span>Simulasi scan</span>
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="min-h-[60px] px-4 rounded-lg bg-white hover:bg-gray-100 text-[#1A1A1A] font-extrabold text-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 border-2 border-[#1A1A1A] shadow"
          >
            <Upload className="w-5 h-5 text-[#1A1A1A]" />
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
          <p className="text-base text-red-600 font-extrabold mt-1">{uploadError}</p>
        )}
      </div>

      {/* 3. Extracted Receipt Details Card */}
      {activeReceipt && (
        <div className="bg-white border-2 rounded-lg p-5 space-y-5">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b-2 border-gray-200 pb-4">
            {isEditingHeader ? (
              <div className="space-y-3 w-full pr-2">
                <input
                  type="text"
                  value={headerForm.storeName}
                  onChange={(e) => setHeaderForm({ ...headerForm, storeName: e.target.value })}
                  className="w-full h-[52px] bg-white border-2 border-[#1A1A1A] text-lg font-bold text-[#1A1A1A] px-4 rounded-lg focus:outline-none focus:border-[#15803D]"
                  placeholder="Nama Supplier"
                />
                <input
                  type="text"
                  value={headerForm.date}
                  onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                  className="w-full h-[52px] bg-white border-2 border-[#1A1A1A] text-base text-[#1A1A1A] font-bold px-4 rounded-lg focus:outline-none focus:border-[#15803D]"
                  placeholder="Tanggal Nota"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveHeader}
                    className="h-[44px] px-4 bg-[#15803D] hover:bg-[#15803D]/90 text-white text-base font-extrabold rounded-lg border-2 border-[#1A1A1A] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-5 h-5" /> Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="h-[44px] px-4 bg-white text-[#1A1A1A] text-base font-extrabold rounded-lg border-2 border-[#1A1A1A] hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-5 h-5" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2">
                  <h2 className="text-2xl font-black text-[#1A1A1A]">
                    {activeReceipt.storeName}
                  </h2>
                  <button
                    onClick={handleStartEditHeader}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1A1A1A] hover:bg-gray-100 transition-colors cursor-pointer shrink-0 mt-5"
                    title="Edit info supplier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-base text-gray-700 font-bold mt-1 tabular-nums">
                  {activeReceipt.date} • {activeReceipt.items.length} Barang Terdeteksi
                </div>
              </div>
            )}
            <div className="text-right shrink-0">
              <span className="text-xs text-gray-600 font-extrabold uppercase block">Total Belanja</span>
              <div className="text-[24px] font-black text-[#15803D] tabular-nums">
                {formatRupiah(activeReceipt.totalAmount)}
              </div>
            </div>
          </div>

          {/* Edit Instruction Notice */}
          <div className="flex items-center gap-2 text-base text-[#1A1A1A] font-bold bg-amber-50 px-4 py-3 rounded-lg border-2 border-amber-400">
            <span className="text-amber-600 text-lg">💡</span>
            <span>Tekan ikon pensil pada barang untuk mengoreksi pembacaan AI.</span>
          </div>

          {/* Item Breakdown List */}
          <div className="flex flex-col border-2 rounded-lg overflow-hidden divide-y-2 divide-gray-200">
            {activeReceipt.items.map((item, index) => {
              const isEditing = editingItemId === item.id;
              const matchName = item.matchedProductName || item.rawName;
              const currentProduct = products.find(
                (p) => p.name.toLowerCase() === matchName.toLowerCase()
              );

              const oldBuyPrice = currentProduct?.buyPrice || item.unitBuyPrice;
              const priceIncreased = item.unitBuyPrice > oldBuyPrice;
              const selisihKenaikan = item.unitBuyPrice - oldBuyPrice;
              const isEven = index % 2 === 0;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="p-5 bg-amber-50/60 border-b-2 border-gray-200 space-y-4 text-[#1A1A1A]"
                  >
                    <div className="text-base font-black text-[#15803D] flex items-center gap-2">
                      <Edit3 className="w-5 h-5" />
                      <span>Koreksi Hasil Pemindaian</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-base text-[#1A1A1A] font-extrabold block">
                        Nama Barang di Struk / Katalog:
                      </label>
                      <input
                        type="text"
                        value={editForm?.rawName || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm!, rawName: e.target.value })
                        }
                        className="w-full h-[60px] bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] font-bold px-4 rounded-lg focus:outline-none focus:border-[#15803D]"
                        placeholder="Contoh: Indomie Goreng 85g"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-base text-[#1A1A1A] font-extrabold block">
                          Jumlah (Qty):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm?.qty ?? 1}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, qty: Number(e.target.value) })
                          }
                          className="w-full h-[60px] bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] font-bold px-4 rounded-lg focus:outline-none focus:border-[#15803D] tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-base text-[#1A1A1A] font-extrabold block">
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
                          className="w-full h-[60px] bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] font-bold px-4 rounded-lg focus:outline-none focus:border-[#15803D] tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-base font-bold text-gray-700 bg-white p-3 rounded-lg border border-gray-300">
                      <span>Subtotal Koreksi:</span>
                      <span className="font-black text-xl text-[#1A1A1A] tabular-nums">
                        {formatRupiah((editForm?.qty || 0) * (editForm?.unitBuyPrice || 0))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEditItem(item.id)}
                          className="h-[52px] px-5 bg-[#15803D] hover:bg-[#15803D]/90 text-white text-base font-extrabold rounded-lg border-2 border-[#1A1A1A] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Check className="w-5 h-5" /> Simpan
                        </button>
                        <button
                          onClick={handleCancelEditItem}
                          className="h-[52px] px-5 bg-white text-[#1A1A1A] text-base font-extrabold rounded-lg border-2 border-[#1A1A1A] hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <X className="w-5 h-5" /> Batal
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-[52px] px-4 bg-red-600 hover:bg-red-700 text-white text-base font-extrabold rounded-lg border-2 border-[#1A1A1A] flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Hapus barang ini dari nota"
                      >
                        <Trash2 className="w-5 h-5" /> Hapus
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className={`p-5 flex flex-col gap-3 transition-colors ${
                    isEven ? 'bg-[#F9F9F9]' : 'bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[20px] font-black text-[#1A1A1A] leading-tight">
                        {matchName}
                      </h3>
                      <div className="text-[16px] text-gray-700 font-bold mt-1">
                        {item.qty} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <span className="text-xs text-gray-600 font-extrabold uppercase block">Modal Baru</span>
                        <div className="text-xl font-black text-[#1A1A1A] tabular-nums">
                          {formatRupiah(item.unitBuyPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          onClick={() => handleStartEditItem(item)}
                          className="w-10 h-10 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] hover:bg-gray-200 transition-colors cursor-pointer bg-white"
                          title="Edit item ini"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-10 h-10 rounded-lg border-2 border-red-600 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-white"
                          title="Hapus item ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-base">
                    {priceIncreased ? (
                      <span className="px-3 py-1 rounded-lg bg-red-100 border-2 border-red-600 text-red-600 font-black text-sm inline-flex items-center gap-1.5 tabular-nums">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Modal naik +{formatRupiah(selisihKenaikan)}/item</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-emerald-100 border-2 border-[#15803D] text-[#15803D] font-black text-sm inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                        <span>Modal tetap</span>
                      </span>
                    )}

                    <span className="text-base text-gray-700 font-bold tabular-nums">
                      Subtotal: <strong className="text-[#1A1A1A] font-black text-lg">{formatRupiah(item.totalBuyPrice)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            className="w-full h-[60px] rounded-lg border-2 border-dashed border-[#1A1A1A] bg-white hover:bg-emerald-50 text-base font-extrabold text-[#15803D] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Tambah Barang Manual</span>
          </button>

          {/* Primary Sync CTA Button */}
          <button
            onClick={handleSyncAllPrices}
            disabled={syncApplied || isSyncingSupabase}
            className={`w-full min-h-[60px] px-5 rounded-lg font-extrabold text-lg flex items-center justify-between transition-colors cursor-pointer border-2 border-[#1A1A1A] shadow disabled:opacity-75 disabled:cursor-not-allowed ${
              syncApplied
                ? 'bg-emerald-100 text-[#15803D]'
                : 'bg-[#15803D] hover:bg-[#15803D]/90 text-white'
            }`}
          >
            {isSyncingSupabase ? (
              <div className="flex items-center gap-2 justify-center w-full">
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Menyimpan ke database katalog...</span>
              </div>
            ) : syncApplied ? (
              <div className="flex items-center justify-center w-full gap-2">
                <CheckCircle2 className="w-6 h-6 text-[#15803D]" />
                <span>Seluruh harga modal telah disinkronkan</span>
              </div>
            ) : (
              <>
                <span>Sinkronkan ke database warung ({activeReceipt.items.length} barang)</span>
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
