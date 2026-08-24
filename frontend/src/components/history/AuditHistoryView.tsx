import React, { useState, useMemo } from 'react';
import { PriceAuditLog } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  History,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  Calendar,
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
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* Title Header */}
      <div className="flex items-end justify-between pt-1 border-b border-[#E5E7EB] pb-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
            Riwayat Penyesuaian
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Log transparansi seluruh perubahan harga di rak warung
          </p>
        </div>

        {logs.length > 0 && onDeleteLogs && (
          <button
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              setSelectedLogIds([]);
            }}
            className={`h-[36px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDeleteMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white border border-[#E5E7EB] hover:bg-[#F4F6F5] text-[#1A1D1E]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleteMode ? 'Batal' : 'Hapus'}</span>
          </button>
        )}
      </div>

      {/* Filter Row (Search & Date Picker) */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-2 bg-white border border-[#E5E7EB] p-3 rounded-2xl shadow-sm">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[36px] pl-9 pr-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#1A1D1E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1B6440]"
              />
            </div>

            {/* Date Input */}
            <div className="relative w-1/3 min-w-[110px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-[36px] px-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#1A1D1E] focus:outline-none focus:border-[#1B6440]"
              />
            </div>
          </div>

          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
              className="w-full py-1 text-center bg-[#F4F6F5] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[10px] font-bold text-[#1A1D1E] rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Selection Utility Row */}
      {isDeleteMode && filteredLogs.length > 0 && (
        <div className="flex justify-between items-center px-1 py-1 text-xs text-[#6B7280]">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 hover:text-[#1A1D1E] transition-colors cursor-pointer font-bold"
          >
            <input
              type="checkbox"
              checked={selectedLogIds.length === filteredLogs.length && filteredLogs.length > 0}
              readOnly
              className="accent-red-600 w-4 h-4 cursor-pointer"
            />
            <span>{selectedLogIds.length === filteredLogs.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
          </button>
          <span className="text-[#6B7280] font-medium">
            {selectedLogIds.length} dari {filteredLogs.length} terpilih
          </span>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white border border-[#E5E7EB] text-[#6B7280] shadow-card">
            <History className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
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
                className={`p-4 rounded-2xl bg-white border ${
                  isDeleteMode ? 'cursor-pointer' : ''
                } ${
                  isSelected ? 'border-red-500 shadow-sm' : 'border-[#E5E7EB]'
                } space-y-3 shadow-card transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-3">
                  {isDeleteMode && (
                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="accent-red-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1A1D1E] truncate">
                      {log.productName}
                    </h3>
                    <div className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-extrabold tabular-nums px-3 py-1 rounded-full inline-flex items-center gap-1 shrink-0 ${
                      isProfitGain
                        ? 'bg-[#EBF5F0] text-[#1B6440] border border-[#D1E7DD]'
                        : 'bg-[#F4F6F5] text-[#6B7280] border border-[#E5E7EB]'
                    }`}
                  >
                    {isProfitGain ? `+${formatRupiah(marginGained)}` : formatRupiah(marginGained)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#F0F2F5] text-xs">
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-[#9CA3AF] line-through">
                      {formatRupiah(log.oldPrice)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <strong className="font-extrabold text-[#1A1D1E]">
                      {formatRupiah(log.newPrice)}
                    </strong>
                  </div>

                  <div className="text-right flex items-center justify-end gap-1.5 text-xs text-[#6B7280]">
                    {log.actionType === 'ACCEPT_RECOMMENDATION' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#1B6440] text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1B6440]" />
                        <span>Rekomendasi</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[11px] font-bold inline-flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3 text-[#B45309]" />
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
        <div className="fixed bottom-24 inset-x-4 max-w-md mx-auto z-40 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-[#1A1D1E] px-0.5">
            <span>Terpilih: {selectedLogIds.length} item</span>
          </div>

          <button
            disabled={selectedLogIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Terpilih ({selectedLogIds.length})</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xs bg-white border border-[#E5E7EB] p-5 rounded-2xl text-[#1A1D1E] font-sans text-center [&>button]:hidden">
          <DialogHeader className="border-b border-[#E5E7EB] pb-2">
            <DialogTitle className="text-sm font-extrabold text-[#1A1D1E] text-center">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs text-[#6B7280] leading-relaxed">
            {selectedLogIds.length === logs.length
              ? 'Apakah Anda yakin ingin menghapus semua riwayat?'
              : `Apakah Anda yakin ingin menghapus ${selectedLogIds.length} riwayat terpilih?`}
          </div>
          <div className="flex gap-2 font-bold text-xs">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-[36px] rounded-xl bg-white hover:bg-[#F4F6F5] text-[#1A1D1E] border border-[#E5E7EB] cursor-pointer"
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
              className="flex-1 h-[36px] rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {selectedLogIds.length === logs.length ? 'Hapus Semua' : 'Hapus'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
