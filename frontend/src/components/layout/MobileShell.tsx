import React from 'react';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#ECEEF0] text-[#1A1D1E] flex justify-center selection:bg-[#1B6440] selection:text-white">
      {/* 420px Mobile Viewport Shell */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative bg-[#F8F9FA] shadow-[0_0_50px_rgba(0,0,0,0.06)] border-x border-[#E2E5E8]">
        {children}
      </div>
    </div>
  );
};
