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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-[#E5E7EB] pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={`Buka halaman ${tab.label}`}
              className={`h-[64px] min-h-[64px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative select-none cursor-pointer ${
                isActive
                  ? 'text-[#15803D] font-extrabold'
                  : 'text-[#1A1A1A] hover:text-[#15803D] font-bold'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.6] text-[#15803D]' : 'stroke-[2.0] text-[#1A1A1A]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#dc2626] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[13px] mt-1 tracking-tight leading-none font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
