import React, { useState, useRef } from 'react';
import { ProductItem, ReceiptScanData, ReceiptItem } from '@/types';
import { demoReceipts } from '@/data/mockProducts';
import { formatRupiah } from '@/lib/utils';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { scanNota } from '@/services/api';

interface ReceiptScanViewProps {
  products: ProductItem[];
  onUpdateProductBuyPrice?: (productName: string, newBuyPrice: number) => void;
  onUpdateBuyPrices?: (updatedItems: { productId: string; newBuyPrice: number }[]) => void;
  onOpenAlertModal?: (product: ProductItem) => void;
}

export const ReceiptScanView: React.FC<ReceiptScanViewProps> = ({
  products,
  onUpdateProductBuyPrice,
  onUpdateBuyPrices,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptScanData | null>(demoReceipts[0]);
  const [syncApplied, setSyncApplied] = useState(false);
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

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadError(null);
    setEditingItemId(null);
    setEditForm(null);

    try {
      const result = await scanNota(file);
      const items = result.detail.items.map((item, index) => ({
        id: 'ri-' + index + '-' + Date.now(),
        rawName: item.nama,
        matchedProductName: item.nama,
        qty: item.jumlah,
        unit: 'pcs',
        unitBuyPrice: item.harga_satuan,
        totalBuyPrice: item.total,
      }));
      const totalAmount = result.detail.items.reduce((acc, curr) => acc + curr.total, 0);

      const convertedData: ReceiptScanData = {
        id: 'rec-api-' + Date.now(),
        storeName: result.supplier ?? 'Supplier (AI Scan)',
        date: result.tanggal ?? new Date().toLocaleDateString('id-ID'),
        totalAmount,
        items,
      };

      setActiveReceipt(convertedData);
      setSyncApplied(false);
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
      setActiveReceipt(demoReceipts[0]);
      setIsProcessing(false);
    }, 500);
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

    setActiveReceipt({
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

    setActiveReceipt({
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

    setActiveReceipt({
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
    setActiveReceipt({
      ...activeReceipt,
      storeName: headerForm.storeName.trim() || activeReceipt.storeName,
      date: headerForm.date.trim() || activeReceipt.date,
    });
    setIsEditingHeader(false);
  };

  const handleSyncAllPrices = () => {
    if (!activeReceipt) return;

    const updates: { productId: string; newBuyPrice: number }[] = [];

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
        });
      }
    });

    if (onUpdateBuyPrices) {
      onUpdateBuyPrices(updates);
    }
    setSyncApplied(true);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#22c55e', '#15803d'],
    });
  };

  return (
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* Swiss Style Title Header */}
      <div className="border-b border-[#262830] pb-2">
        <h1 className="text-xl font-extrabold text-[#f3f4f6] tracking-tight">
          Scan Nota Grosir
        </h1>
        <p className="text-xs text-[#9ca3af] mt-0.5">
          Perbarui harga modal kulakan langsung dari struk agen belanja
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-3">
        <div className="flex items-center justify-between border-b border-[#262830] pb-3">
          <div>
            <div className="text-xs font-bold text-[#f3f4f6]">
              Ekstraksi Nota Agen Otomatis
            </div>
            <div className="text-xs text-[#9ca3af] mt-0.5">
              Mendeteksi barang kulakan & kenaikan harga beli
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#131417] border border-[#262830] flex items-center justify-center text-[#f3f4f6]">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={simulateReceiptScan}
            disabled={isProcessing}
            className="min-h-[52px] px-3 rounded-lg font-bold text-xs bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membaca struk...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Simulasi scan nota</span>
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="min-h-[52px] px-3 rounded-lg font-bold text-xs bg-[#131417] hover:bg-[#262830] text-[#f3f4f6] border border-[#262830] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Upload foto struk</span>
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
          <p className="text-xs text-[#f87171] mt-1">{uploadError}</p>
        )}
      </div>

      {/* Extracted Receipt Details (Swiss Financial Ledger) */}
      {activeReceipt && (
        <div className="rounded-lg p-4 bg-[#18191e] border border-[#262830] space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-[#262830] pb-3">
            {isEditingHeader ? (
              <div className="space-y-1.5 w-full pr-2">
                <input
                  type="text"
                  value={headerForm.storeName}
                  onChange={(e) => setHeaderForm({ ...headerForm, storeName: e.target.value })}
                  className="w-full bg-[#131417] border border-[#373a46] text-xs font-bold text-[#f3f4f6] px-2 py-1 rounded focus:outline-none focus:border-[#16a34a]"
                  placeholder="Nama Supplier"
                />
                <input
                  type="text"
                  value={headerForm.date}
                  onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                  className="w-full bg-[#131417] border border-[#373a46] text-xs text-[#9ca3af] px-2 py-1 rounded focus:outline-none focus:border-[#16a34a]"
                  placeholder="Tanggal Nota"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveHeader}
                    className="px-2.5 py-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="px-2.5 py-1 bg-[#262830] hover:bg-[#373a46] text-[#9ca3af] text-xs rounded flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-extrabold text-[#f3f4f6]">
                    {activeReceipt.storeName}
                  </h2>
                  <button
                    onClick={handleStartEditHeader}
                    className="p-1 text-[#9ca3af] hover:text-[#f3f4f6] rounded hover:bg-[#262830] transition-colors cursor-pointer"
                    title="Edit info supplier"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-[#9ca3af] mt-0.5 tabular-nums">
                  {activeReceipt.date} • {activeReceipt.items.length} Barang Terdeteksi
                </div>
              </div>
            )}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#9ca3af] font-medium block">Total Belanja</span>
              <div className="text-sm font-extrabold text-[#f3f4f6] tabular-nums">
                {formatRupiah(activeReceipt.totalAmount)}
              </div>
            </div>
          </div>

          {/* Edit Instruction Notice */}
          <div className="flex items-center justify-between text-[11px] text-[#9ca3af] bg-[#131417] px-2.5 py-1.5 rounded border border-[#262830]">
            <span>💡 Tekan ikon pensil pada barang untuk mengoreksi pembacaan AI.</span>
          </div>

          {/* Item Breakdown List */}
          <div className="space-y-2">
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
                    className="p-3 rounded-lg bg-[#131417] border border-[#16a34a] space-y-2.5"
                  >
                    <div className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Koreksi Hasil Pemindaian</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#9ca3af] font-medium block">
                        Nama Barang di Struk / Katalog:
                      </label>
                      <input
                        type="text"
                        value={editForm?.rawName || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm!, rawName: e.target.value })
                        }
                        className="w-full bg-[#18191e] border border-[#373a46] text-xs text-[#f3f4f6] p-2 rounded focus:outline-none focus:border-[#16a34a]"
                        placeholder="Contoh: Indomie Goreng 85g"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#9ca3af] font-medium block">
                          Jumlah (Qty):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editForm?.qty ?? 1}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, qty: Number(e.target.value) })
                          }
                          className="w-full bg-[#18191e] border border-[#373a46] text-xs text-[#f3f4f6] p-2 rounded focus:outline-none focus:border-[#16a34a] tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#9ca3af] font-medium block">
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
                          className="w-full bg-[#18191e] border border-[#373a46] text-xs text-[#f3f4f6] p-2 rounded focus:outline-none focus:border-[#16a34a] tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#9ca3af] pt-1">
                      <span>Subtotal Koreksi:</span>
                      <span className="font-extrabold text-[#f3f4f6] tabular-nums">
                        {formatRupiah((editForm?.qty || 0) * (editForm?.unitBuyPrice || 0))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#262830]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEditItem(item.id)}
                          className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Simpan
                        </button>
                        <button
                          onClick={handleCancelEditItem}
                          className="px-3 py-1.5 bg-[#262830] hover:bg-[#373a46] text-[#9ca3af] text-xs font-medium rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Batal
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-2.5 py-1.5 text-[#f87171] hover:bg-[#3b181b] text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
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
                  className="p-3 rounded-lg bg-[#131417] border border-[#262830] space-y-2 group transition-colors hover:border-[#373a46]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#f3f4f6]">
                        {matchName}
                      </h3>
                      <div className="text-xs text-[#9ca3af] mt-0.5">
                        {item.qty} {item.unit}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-[#9ca3af] block">Modal Baru</span>
                        <div className="text-xs font-extrabold text-[#f3f4f6] tabular-nums">
                          {formatRupiah(item.unitBuyPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleStartEditItem(item)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#262830] rounded transition-colors cursor-pointer"
                          title="Edit item ini"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#f87171] hover:bg-[#3b181b] rounded transition-colors cursor-pointer"
                          title="Hapus item ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#262830] text-xs">
                    {priceIncreased ? (
                      <span className="text-[#f87171] font-bold flex items-center gap-1 tabular-nums text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Modal naik +{formatRupiah(selisihKenaikan)}/item</span>
                      </span>
                    ) : (
                      <span className="text-[#9ca3af] font-medium flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>Modal tetap</span>
                      </span>
                    )}

                    <span className="text-xs text-[#9ca3af] tabular-nums font-bold">
                      Subtotal: {formatRupiah(item.totalBuyPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            className="w-full py-2.5 px-3 rounded-lg border border-dashed border-[#373a46] bg-[#131417] hover:bg-[#18191e] text-xs font-bold text-[#9ca3af] hover:text-[#f3f4f6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#16a34a]" />
            <span>Tambah Barang Manual</span>
          </button>

          {/* Sync Button (Min Height 52px) */}
          <button
            onClick={handleSyncAllPrices}
            disabled={syncApplied}
            className={`w-full min-h-[52px] px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              syncApplied
                ? 'bg-[#131417] border border-[#262830] text-[#22c55e]'
                : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
            }`}
          >
            {syncApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <span>Seluruh harga modal telah disinkronkan</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Sinkronkan ke database warung ({activeReceipt.items.length} barang)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
