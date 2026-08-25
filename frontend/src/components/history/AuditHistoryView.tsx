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

  // Deduplicate logs using unique key
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
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* 1. Header Area */}
      <div className="bg-[#15803D] rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Riwayat Penyesuaian
          </h1>
          <p className="text-xs font-medium text-white/90 mt-1">
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
              className={`h-10 px-3.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border shadow-xs ${
                isDeleteMode
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white text-[#15803D] hover:bg-white/95 border-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleteMode ? 'Batal Hapus' : 'Hapus Log'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Row (Search & Date Picker) */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] placeholder:text-gray-400 focus:outline-none focus:border-[#15803D] font-medium"
              />
            </div>

            {/* Date Input */}
            <div className="relative w-1/3 min-w-[120px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-10 px-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#15803D] font-medium dark:[color-scheme:light]"
              />
            </div>
          </div>

          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
              className="w-full h-8 text-center bg-gray-100 border border-[#E5E7EB] text-xs font-semibold text-[#1A1D1E] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Selection Utility Row */}
      {isDeleteMode && filteredLogs.length > 0 && (
        <div className="flex justify-between items-center px-1 py-1 text-xs text-gray-600">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer font-bold"
          >
            <input
              type="checkbox"
              checked={selectedLogIds.length === filteredLogs.length && filteredLogs.length > 0}
              readOnly
              className="w-4 h-4 cursor-pointer accent-red-600"
            />
            <span>{selectedLogIds.length === filteredLogs.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
          </button>
          <span className="font-bold">
            {selectedLogIds.length} dari {filteredLogs.length} terpilih
          </span>
        </div>
      )}

      {/* 3. Logs List Area */}
      <div className="flex flex-col space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-[#E5E7EB] text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs font-bold text-[#1A1D1E]">
              {logs.length === 0 ? 'Belum ada riwayat penyesuaian harga' : 'Riwayat tidak ditemukan'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const marginGained = log.newPrice - log.oldPrice;
            const isProfitGain = marginGained > 0;
            const isSelected = selectedLogIds.includes(log.id);

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
                className={`p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex flex-col gap-2 relative transition-all cursor-pointer select-none shadow-xs hover:border-[#15803D] ${
                  isSelected ? 'bg-red-50/50 border-red-500' : ''
                }`}
              >
                {isDeleteMode && (
                  <div className="absolute right-3 top-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Row 1: Product Title & Date */}
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1D1E] leading-snug">
                      {log.productName}
                    </h3>
                    <div className="text-xs text-gray-500 font-medium mt-0.5 tabular-nums">
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
                    className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border inline-flex items-center shrink-0 ${
                      isProfitGain
                        ? 'bg-emerald-50 text-[#15803D] border-emerald-200'
                        : marginGained < 0
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {isProfitGain ? `+${formatRupiah(marginGained)}` : formatRupiah(marginGained)}
                  </span>
                </div>

                {/* Row 2: Old Price -> New Price & Action Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0F2F5] text-xs">
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-gray-400 line-through">
                      {formatRupiah(log.oldPrice)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-extrabold text-[#15803D]">
                      {formatRupiah(log.newPrice)}
                    </span>
                  </div>

                  <div className="text-right">
                    {log.actionType === 'ACCEPT_RECOMMENDATION' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                        <span>Rekomendasi</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3 text-amber-700" />
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
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-40 bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold text-[#1A1D1E] px-1">
            <span>Terpilih: {selectedLogIds.length} item</span>
          </div>

          <button
            disabled={selectedLogIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Terpilih ({selectedLogIds.length})</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xs bg-white border border-[#E5E7EB] p-5 rounded-2xl text-[#1A1D1E] font-sans text-center [&>button]:hidden shadow-xl">
          <DialogHeader className="border-b border-[#F0F2F5] pb-2">
            <DialogTitle className="text-sm font-bold text-[#1A1D1E] text-center">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-xs text-gray-600 font-medium leading-relaxed">
            {selectedLogIds.length === logs.length
              ? 'Apakah Anda yakin ingin menghapus semua riwayat?'
              : `Apakah Anda yakin ingin menghapus ${selectedLogIds.length} riwayat terpilih?`}
          </div>
          <div className="flex gap-2 font-bold text-xs">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-10 rounded-xl bg-white border border-[#E5E7EB] text-[#1A1D1E] cursor-pointer hover:bg-gray-50"
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
              className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {selectedLogIds.length === logs.length ? 'Hapus Semua' : 'Hapus'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
