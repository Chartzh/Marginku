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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#18191e] border-t border-[#262830] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={`Buka halaman ${tab.label}`}
              className={`h-[52px] min-h-[52px] flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative select-none cursor-pointer ${
                isActive
                  ? 'text-[#22c55e] font-bold'
                  : 'text-[#9ca3af] hover:text-[#f3f4f6] font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2] text-[#22c55e]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#dc2626] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#18191e] tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
