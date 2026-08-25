import React, { useState, useMemo } from 'react';
import { PriceAuditLog } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  History,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AuditHistoryViewProps {
  logs: PriceAuditLog[];
  onDeleteLogs?: (logIds: string[]) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ logs, onDeleteLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Deduplicate logs using unique key (productId + newPrice + timestamp or id)
  const uniqueLogs = useMemo(() => {
    const seenKeys = new Set<string>();
    const result: PriceAuditLog[] = [];

    for (const log of logs) {
      const uniqueKey = `${log.productId || ''}-${log.newPrice}-${log.timestamp}-${log.actionType}`;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        result.push(log);
      }
    }

    return result;
  }, [logs]);

  // Filter logs based on search query and date
  const filteredLogs = useMemo(() => {
    return uniqueLogs.filter((log) => {
      const matchesSearch = log.productName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (dateFilter) {
        const logDate = log.timestamp.split('T')[0];
        matchesDate = logDate === dateFilter;
      }

      return matchesSearch && matchesDate;
    });
  }, [uniqueLogs, searchQuery, dateFilter]);

  const handleToggleSelectAll = () => {
    if (selectedLogIds.length === filteredLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map((log) => log.id));
    }
  };

  return (
    <div className="space-y-6 pb-28 text-[#1A1A1A] font-sans bg-white min-h-screen">
      {/* 1. Header Area */}
      <div className="-mx-4 -mt-4 mb-6 bg-[#15803D] p-5 text-white flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-none">
            Riwayat
          </h1>
          <p className="text-lg font-medium text-white/90 mt-1">
            Log transparansi seluruh perubahan harga di rak warung
          </p>
        </div>

        <div>
          {logs.length > 0 && onDeleteLogs && (
            <button
              onClick={() => {
                setIsDeleteMode(!isDeleteMode);
                setSelectedLogIds([]);
              }}
              className={`min-h-[52px] px-4 rounded-lg font-extrabold text-base flex items-center gap-2 transition-colors cursor-pointer border-2 shadow ${
                isDeleteMode
                  ? 'bg-red-600 border-white text-white'
                  : 'bg-white text-[#15803D] hover:bg-white/95 border-white'
              }`}
            >
              <Trash2 className="w-5 h-5 stroke-[2.5]" />
              <span>{isDeleteMode ? 'Batal Hapus' : 'Hapus Log'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Row (Search & Date Picker) */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-6 h-6 text-[#1A1A1A] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[60px] pl-12 pr-4 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] placeholder:text-gray-500 focus:outline-none focus:border-[#15803D] font-bold"
              />
            </div>

            {/* Date Input */}
            <div className="relative w-1/3 min-w-[140px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-[60px] px-3 rounded-lg bg-white border-2 border-[#1A1A1A] text-lg text-[#1A1A1A] focus:outline-none focus:border-[#15803D] font-bold dark:[color-scheme:light]"
              />
            </div>
          </div>

          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
              className="w-full h-[40px] text-center bg-gray-100 border border-[#1A1A1A] text-sm font-bold text-[#1A1A1A] rounded hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Selection Utility Row */}
      {isDeleteMode && filteredLogs.length > 0 && (
        <div className="flex justify-between items-center px-1 py-1 text-base text-gray-700">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 hover:text-black transition-colors cursor-pointer font-extrabold"
          >
            <input
              type="checkbox"
              checked={selectedLogIds.length === filteredLogs.length && filteredLogs.length > 0}
              readOnly
              className="w-6 h-6 cursor-pointer accent-red-600"
            />
            <span>{selectedLogIds.length === filteredLogs.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
          </button>
          <span className="font-extrabold">
            {selectedLogIds.length} dari {filteredLogs.length} terpilih
          </span>
        </div>
      )}

      {/* 3. Logs List Area (Alternating white/subtle gray) */}
      <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-[#F9F9F9]">
            <History className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-lg font-bold">
              {logs.length === 0 ? 'Belum ada riwayat penyesuaian harga' : 'Riwayat tidak ditemukan'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const marginGained = log.newPrice - log.oldPrice;
            const isProfitGain = marginGained > 0;
            const isSelected = selectedLogIds.includes(log.id);
            const isEven = index % 2 === 0;

            const handleItemClick = () => {
              if (isDeleteMode) {
                if (isSelected) {
                  setSelectedLogIds((prev) => prev.filter((id) => id !== log.id));
                } else {
                  setSelectedLogIds((prev) => [...prev, log.id]);
                }
              }
            };

            return (
              <div
                key={log.id}
                onClick={handleItemClick}
                className={`p-5 flex flex-col gap-3 relative transition-colors cursor-pointer select-none border-b border-gray-200 ${
                  isEven ? 'bg-[#F9F9F9]' : 'bg-[#FFFFFF]'
                } ${
                  isSelected ? 'bg-red-50 border-l-4 border-l-red-600' : 'border-l-4 border-l-transparent'
                }`}
              >
                {isDeleteMode && (
                  <div className="absolute right-4 top-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-6 h-6 accent-red-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Row 1: Product Title & Date */}
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div>
                    <h3 className="text-[20px] font-black text-[#1A1A1A] leading-tight">
                      {log.productName}
                    </h3>
                    <div className="text-[14px] text-gray-600 font-bold mt-1 tabular-nums">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Profit gain/change pill */}
                  <span
                    className={`text-[15px] font-black tabular-nums px-3 py-1.5 rounded-md border-2 inline-flex items-center shrink-0 ${
                      isProfitGain
                        ? 'bg-emerald-50 text-[#15803D] border-[#15803D]'
                        : marginGained < 0
                        ? 'bg-red-50 text-red-600 border-red-600'
                        : 'bg-gray-100 text-gray-700 border-gray-400'
                    }`}
                  >
                    {isProfitGain ? `+${formatRupiah(marginGained)}` : formatRupiah(marginGained)}
                  </span>
                </div>

                {/* Row 2: Old Price -> New Price & Action Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-[16px] font-bold text-gray-400 line-through">
                      {formatRupiah(log.oldPrice)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
                    <span className="text-[22px] font-black text-[#15803D]">
                      {formatRupiah(log.newPrice)}
                    </span>
                  </div>

                  <div className="text-right">
                    {log.actionType === 'ACCEPT_RECOMMENDATION' ? (
                      <span className="px-3 py-1 rounded-md bg-emerald-100 text-[#15803D] border border-[#15803D] text-[13px] font-black inline-flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                        <span>Rekomendasi</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-600 text-[13px] font-black inline-flex items-center gap-1">
                        <SlidersHorizontal className="w-4 h-4 text-amber-800" />
                        <span>Manual</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar for Deletion */}
      {isDeleteMode && onDeleteLogs && (
        <div className="fixed bottom-24 inset-x-4 max-w-md mx-auto z-40 bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-base font-extrabold text-[#1A1A1A] px-1">
            <span>Terpilih: {selectedLogIds.length} item</span>
          </div>

          <button
            disabled={selectedLogIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full min-h-[60px] rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            <span>Hapus Terpilih ({selectedLogIds.length})</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xs bg-white border-2 border-[#1A1A1A] p-6 rounded-lg text-[#1A1A1A] font-sans text-center [&>button]:hidden">
          <DialogHeader className="border-b-2 border-gray-200 pb-2">
            <DialogTitle className="text-lg font-black text-[#1A1A1A] text-center">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-base text-gray-700 font-bold leading-relaxed">
            {selectedLogIds.length === logs.length
              ? 'Apakah Anda yakin ingin menghapus semua riwayat?'
              : `Apakah Anda yakin ingin menghapus ${selectedLogIds.length} riwayat terpilih?`}
          </div>
          <div className="flex gap-2 font-bold text-base">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-[52px] rounded-lg bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (onDeleteLogs) {
                  onDeleteLogs(selectedLogIds);
                }
                setIsDeleteMode(false);
                setSelectedLogIds([]);
                setIsConfirmOpen(false);
              }}
              className="flex-1 h-[52px] rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {selectedLogIds.length === logs.length ? 'Hapus Semua' : 'Hapus'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

