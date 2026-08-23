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
  onDeleteLogs: (logIds: string[]) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ logs, onDeleteLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Filter logs based on search query and date
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.productName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (dateFilter) {
        const logDate = log.timestamp.split('T')[0];
        matchesDate = logDate === dateFilter;
      }

      return matchesSearch && matchesDate;
    });
  }, [logs, searchQuery, dateFilter]);

  const handleToggleSelectAll = () => {
    if (selectedLogIds.length === filteredLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map((log) => log.id));
    }
  };

  return (
    <div className="space-y-4 pb-28 text-[#f3f4f6] font-sans">
      {/* Swiss Title Header */}
      <div className="flex items-end justify-between border-b border-[#262830] pb-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#f3f4f6] tracking-tight">
            Riwayat Penyesuaian Harga
          </h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            Log transparansi seluruh perubahan harga di rak warung
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              setSelectedLogIds([]);
            }}
            className={`h-[36px] px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDeleteMode
                ? 'bg-crimson-red hover:bg-crimson-red/80 text-white'
                : 'bg-teal-slate border border-[#3f4945] hover:border-[#88938e] text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleteMode ? 'Batal' : 'Hapus'}</span>
          </button>
        )}
      </div>

      {/* Filter Row (Search & Date Picker) */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-2 bg-[#18191e] border border-[#262830] p-3 rounded-lg">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[36px] pl-9 pr-3 rounded-lg bg-teal-slate border border-[#3f4945] text-xs text-[#f3f4f6] placeholder:text-[#9ca3af] focus:outline-none focus:border-accent-yellow"
              />
            </div>

            {/* Date Input */}
            <div className="relative w-1/3 min-w-[110px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-[36px] px-2 rounded-lg bg-teal-slate border border-[#3f4945] text-xs text-[#f3f4f6] focus:outline-none focus:border-accent-yellow dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
              className="w-full py-1 text-center bg-teal-slate hover:bg-[#262830] border border-[#3f4945] text-[10px] font-bold text-white rounded transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Selection Utility Row */}
      {isDeleteMode && filteredLogs.length > 0 && (
        <div className="flex justify-between items-center px-1 py-1 text-xs text-[#9ca3af]">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer font-bold"
          >
            <input
              type="checkbox"
              checked={selectedLogIds.length === filteredLogs.length && filteredLogs.length > 0}
              readOnly
              className="accent-crimson-red w-4 h-4 cursor-pointer"
            />
            <span>{selectedLogIds.length === filteredLogs.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
          </button>
          <span className="text-[#9ca3af] font-medium">
            {selectedLogIds.length} dari {filteredLogs.length} terpilih
          </span>
        </div>
      )}

      {/* Logs List (Swiss Financial Ledger) */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-[#18191e] border border-[#262830] text-[#9ca3af]">
            <History className="w-6 h-6 mx-auto mb-2 opacity-50 text-[#6b7280]" />
            <p className="text-xs font-bold">
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
                className={`p-3.5 rounded-lg bg-[#18191e] border transition-all space-y-2 flex gap-3 items-center ${
                  isDeleteMode ? 'cursor-pointer hover:bg-[#202127]' : ''
                } ${isSelected ? 'border-crimson-red shadow-[0_0_10px_rgba(220,38,38,0.15)]' : 'border-[#262830]'}`}
              >
                {isDeleteMode && (
                  <div className="shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-crimson-red w-4 h-4 cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-[#f3f4f6] truncate">
                        {log.productName}
                      </h3>
                      <div className="text-[11px] text-[#9ca3af] mt-0.5 tabular-nums">
                        {new Date(log.timestamp).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-extrabold tabular-nums px-2.5 py-1 rounded inline-flex items-center gap-1 ${
                        isProfitGain
                          ? 'bg-[#142e1f] text-[#22c55e] border border-[#166534]'
                          : 'bg-[#131417] text-[#9ca3af] border border-[#262830]'
                      }`}
                    >
                      {isProfitGain ? `+${formatRupiah(marginGained)}` : formatRupiah(marginGained)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262830] text-xs">
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-[#9ca3af] line-through">
                        {formatRupiah(log.oldPrice)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#6b7280]" />
                      <strong className="font-extrabold text-[#f3f4f6]">
                        {formatRupiah(log.newPrice)}
                      </strong>
                    </div>

                    <div className="text-right flex items-center justify-end gap-1 text-[11px] text-[#9ca3af]">
                      {log.actionType === 'ACCEPT_RECOMMENDATION' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                          <span>Rekomendasi</span>
                        </>
                      ) : (
                        <>
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#fbbf24]" />
                          <span>Manual</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar for Deletion */}
      {isDeleteMode && (
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-40 bg-teal-slate border border-[#3f4945] rounded-xl p-3.5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center text-xs font-bold text-white px-0.5">
            <span>Terpilih: {selectedLogIds.length} item</span>
          </div>

          <button
            disabled={selectedLogIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full h-[44px] rounded-lg bg-crimson-red hover:bg-crimson-red/80 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Terpilih ({selectedLogIds.length})</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xs bg-teal-slate border-[#3f4945] p-5 rounded-xl text-[#f3f4f6] font-sans text-center [&>button]:hidden">
          <DialogHeader className="border-b border-[#262830] pb-2">
            <DialogTitle className="text-sm font-extrabold text-white text-center">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs text-[#bec9c4] leading-relaxed">
            {selectedLogIds.length === logs.length
              ? 'Apakah Anda yakin ingin menghapus semua riwayat?'
              : `Apakah Anda yakin ingin menghapus ${selectedLogIds.length} riwayat terpilih?`}
          </div>
          <div className="flex gap-2 font-bold text-xs">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-[36px] rounded-lg bg-charcoal hover:bg-[#202127] text-white border border-[#3f4945] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onDeleteLogs(selectedLogIds);
                setIsDeleteMode(false);
                setSelectedLogIds([]);
                setIsConfirmOpen(false);
              }}
              className="flex-1 h-[36px] rounded-lg bg-crimson-red hover:bg-crimson-red/80 text-white cursor-pointer"
            >
              {selectedLogIds.length === logs.length ? 'Hapus Semua' : 'Hapus'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

