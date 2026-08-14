import React from 'react';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f5] flex justify-center selection:bg-[#22c55e] selection:text-black">
      {/* Pure Flat Mobile Shell - Zero AI blur blobs, zero ambient glows */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#111111] border-x border-[#222222]">
        {children}
      </div>
    </div>
  );
};
