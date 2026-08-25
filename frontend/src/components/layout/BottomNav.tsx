import React from 'react';
import {
  Camera,
  FileText,
  Package,
  History,
  Settings,
} from 'lucide-react';

export type TabType = 'SCAN_SHELF' | 'SCAN_RECEIPT' | 'CATALOG' | 'HISTORY' | 'SETTINGS';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  dangerCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  dangerCount,
}) => {
  const tabs = [
    {
      id: 'SCAN_SHELF' as TabType,
      label: 'Scan Rak',
      icon: Camera,
    },
    {
      id: 'SCAN_RECEIPT' as TabType,
      label: 'Scan Nota',
      icon: FileText,
    },
    {
      id: 'CATALOG' as TabType,
      label: 'Katalog',
      icon: Package,
      badge: dangerCount > 0 ? dangerCount : undefined,
    },
    {
      id: 'HISTORY' as TabType,
      label: 'Riwayat',
      icon: History,
    },
    {
      id: 'SETTINGS' as TabType,
      label: 'Setelan',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] pb-safe h-[80px] flex items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="w-full max-w-md mx-auto grid grid-cols-5 items-center px-2 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={`Buka halaman ${tab.label}`}
              className={`h-[64px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all select-none cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-[#EBF5F0] text-[#15803D] font-bold shadow-sm'
                  : 'text-[#8C939D] hover:text-[#1A1D1E] hover:bg-[#F4F6F5]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`transition-transform ${
                    isActive ? 'stroke-[2.5] text-[#15803D] scale-105' : 'stroke-[1.8] text-[#8C939D]'
                  }`}
                  style={{ width: 24, height: 24 }}
                />
                {tab.badge && (
                  <span className="absolute -top-2 -right-3 bg-[#EF4444] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white tabular-nums shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                style={{ fontSize: 13, marginTop: 4, lineHeight: 1 }}
                className={`tracking-tight font-semibold ${
                  isActive ? 'text-[#15803D] font-extrabold' : 'text-[#8C939D]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
