import React, { useMemo } from 'react';
import { PriceAuditLog } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { History, ArrowRight, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface AuditHistoryViewProps {
  logs: PriceAuditLog[];
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ logs }) => {
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

  return (
    <div className="space-y-4 pb-24 text-[#1A1D1E] font-sans">
      {/* Title Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
          Riwayat Penyesuaian
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Log transparansi seluruh perubahan harga di rak warung
        </p>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {uniqueLogs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white border border-[#E5E7EB] text-[#6B7280] shadow-card">
            <History className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-xs font-bold text-[#1A1D1E]">Belum ada riwayat penyesuaian harga</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Semua perubahan harga yang Anda terapkan akan tercatat di sini.</p>
          </div>
        ) : (
          uniqueLogs.map((log) => {
            const marginGained = log.newPrice - log.oldPrice;
            const isProfitGain = marginGained > 0;

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-card transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
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
    </div>
  );
};
