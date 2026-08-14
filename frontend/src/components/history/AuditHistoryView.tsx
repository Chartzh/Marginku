import React from 'react';
import { PriceAuditLog } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { History, ArrowRight, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface AuditHistoryViewProps {
  logs: PriceAuditLog[];
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({ logs }) => {
  return (
    <div className="space-y-4 pb-24 text-[#f3f4f6] font-sans">
      {/* Swiss Title Header */}
      <div className="border-b border-[#262830] pb-2">
        <h1 className="text-xl font-extrabold text-[#f3f4f6] tracking-tight">
          Riwayat Penyesuaian Harga
        </h1>
        <p className="text-xs text-[#9ca3af] mt-0.5">
          Log transparansi seluruh perubahan harga di rak warung
        </p>
      </div>

      {/* Logs List (Swiss Financial Ledger) */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-[#18191e] border border-[#262830] text-[#9ca3af]">
            <History className="w-6 h-6 mx-auto mb-2 opacity-50 text-[#6b7280]" />
            <p className="text-xs font-bold">Belum ada riwayat penyesuaian harga</p>
          </div>
        ) : (
          logs.map((log) => {
            const marginGained = log.newPrice - log.oldPrice;
            const isProfitGain = marginGained > 0;

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-lg bg-[#18191e] border border-[#262830] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-[#f3f4f6] truncate">
                      {log.productName}
                    </h3>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5 tabular-nums">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
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
            );
          })
        )}
      </div>
    </div>
  );
};
