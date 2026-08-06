import React from 'react';

interface SciFi3DPopupFrameProps {
  children: React.ReactNode;
  className?: string;
  maxWidthClass?: string;
}

export const SciFi3DPopupFrame: React.FC<SciFi3DPopupFrameProps> = ({
  children,
  className = '',
  maxWidthClass = 'max-w-md'
}) => {
  return (
    <div className={`relative w-full ${maxWidthClass} transform transition-all animate-fadeIn ${className}`}>
      {/* Outer 3D Lime-Green Bevel Frame */}
      <div className="relative rounded-[32px] p-2 sm:p-2.5 bg-gradient-to-b from-[#8beb00] via-[#6ebd00] to-[#488700] border-4 border-[#a2f718] shadow-[0_25px_60px_rgba(20,55,0,0.55),0_6px_0_#325e00,inset_0_2px_4px_rgba(255,255,255,0.85)]">
        
        {/* Top Raised Notch / Sci-Fi Header Tab */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-none">
          <div className="relative bg-gradient-to-b from-[#8ce800] to-[#5ea100] border-2 border-[#a3f81c] border-b-[#3a6800] px-8 py-1 rounded-b-xl shadow-[0_4px_8px_rgba(0,0,0,0.3),inset_0_1.5px_2px_rgba(255,255,255,0.9)] flex items-center gap-3.5">
            {/* Inner recessed green track */}
            <div className="w-16 h-1.5 bg-[#3a6500]/70 rounded-full border border-[#2b4d00]/50 shadow-inner" />
            {/* Glowing indicator LEDs */}
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#a5f3fc]" />
            </div>
          </div>
        </div>

        {/* Side Gaskets / Left & Right Notch Grips */}
        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-3 h-9 bg-gradient-to-r from-[#82dc00] to-[#4e8800] border border-[#a2f718] rounded-r-lg shadow-md z-30 flex flex-col justify-center items-center gap-1 pointer-events-none">
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_#fff]" />
          <div className="w-1.5 h-1.5 bg-cyan-200 rounded-full" />
        </div>
        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-3 h-9 bg-gradient-to-l from-[#82dc00] to-[#4e8800] border border-[#a2f718] rounded-l-lg shadow-md z-30 flex flex-col justify-center items-center gap-1 pointer-events-none">
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_#fff]" />
          <div className="w-1.5 h-1.5 bg-cyan-200 rounded-full" />
        </div>

        {/* Bottom-Right Sci-Fi Status LED Indicators */}
        <div className="absolute bottom-2 right-7 z-30 flex items-center gap-1 bg-[#366000]/80 px-2.5 py-0.5 rounded-full border border-[#7ed900] shadow-sm pointer-events-none">
          <div className="w-3.5 h-1 bg-cyan-300 rounded-full shadow-[0_0_6px_#67e8f9]" />
          <div className="w-3.5 h-1 bg-cyan-300/80 rounded-full" />
          <div className="w-3.5 h-1 bg-cyan-300/60 rounded-full" />
          <div className="w-3.5 h-1 bg-[#254400] rounded-full" />
        </div>

        {/* Inner Screen Canvas / Pale Lime Background */}
        <div className="relative rounded-[24px] bg-gradient-to-b from-[#f8fde9] via-[#f1fce1] to-[#e6f7cd] border-2 border-[#93e314]/70 p-5 sm:p-6 shadow-[inset_0_4px_16px_rgba(60,110,0,0.22)] overflow-hidden">
          
          {/* Subtle Circuit Vector Patterns on Canvas Corners */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            {/* Top-Left Circuit */}
            <path d="M 14 14 L 45 14 L 60 29 L 105 29" stroke="#65a30d" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="14" r="2.5" fill="#65a30d" />
            <circle cx="105" cy="29" r="2.5" fill="#84cc16" />
            
            <path d="M 22 38 L 36 38 L 48 50 L 48 75" stroke="#84cc16" strokeWidth="1.2" fill="none" />
            <circle cx="22" cy="38" r="2" fill="#84cc16" />

            {/* Top-Right Pixel Grid */}
            <rect x="86%" y="16" width="6" height="6" fill="#84cc16" rx="1.5" />
            <rect x="91%" y="16" width="6" height="6" fill="#a3e635" rx="1.5" />
            <rect x="91%" y="27" width="6" height="6" fill="#84cc16" rx="1.5" />
            <rect x="91%" y="38" width="6" height="6" fill="#a3e635" rx="1.5" />
            <rect x="86%" y="27" width="6" height="6" fill="#a3e635" rx="1.5" />

            {/* Bottom-Left Circuit */}
            <path d="M 22 88% L 50 88% L 65 94% L 110 94%" stroke="#65a30d" strokeWidth="1.2" fill="none" />
            <circle cx="22" cy="88%" r="2" fill="#65a30d" />

            {/* Bottom-Right Circuit */}
            <path d="M 78% 92% L 86% 92% L 94% 84% L 94% 68%" stroke="#65a30d" strokeWidth="1.5" fill="none" />
            <circle cx="94%" cy="68%" r="2.5" fill="#84cc16" />
            <circle cx="78%" cy="92%" r="2.5" fill="#65a30d" />
          </svg>

          {/* Inner Content Slot */}
          <div className="relative z-10">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
};
