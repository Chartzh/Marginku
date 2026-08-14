import React from 'react';
import { MarginStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface MarginStatusBadgeProps {
  status: MarginStatus;
  percent: number;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const MarginStatusBadge: React.FC<MarginStatusBadgeProps> = ({
  status,
  percent,
  showIcon = true,
  size = 'md',
}) => {
  const formattedPercent = `${percent.toFixed(1)}%`;

  if (status === 'DANGER') {
    return (
      <Badge
        variant="danger"
        className={size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
      >
        {showIcon && <AlertOctagon className="w-3.5 h-3.5 mr-1 text-[#f87171]" />}
        <span>Jual rugi ({formattedPercent})</span>
      </Badge>
    );
  }

  if (status === 'WARNING') {
    return (
      <Badge
        variant="warning"
        className={size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#fbbf24]" />}
        <span>Tipis ({formattedPercent})</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="safe"
      className={size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
    >
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#22c55e]" />}
      <span>Aman ({formattedPercent})</span>
    </Badge>
  );
};
