import React from 'react';
import { Laptop, ShieldCheck } from 'lucide-react';
import { Member } from '../../types';

interface DeskOSMacWidgetProps {
  currentUser: Member | null;
}

export const DeskOSMacWidget: React.FC<DeskOSMacWidgetProps> = ({ currentUser }) => {
  const teacherName = currentUser ? currentUser.name : 'Quý thầy cô';
  const isRootUser = currentUser?.role?.includes('Quản trị hệ thống') || currentUser?.role === 'Admin' || currentUser?.id === 'u-1';
  const roleName = isRootUser ? 'Quản trị hệ thống (Admin)' : currentUser?.role || 'Giáo viên Tin học';
  const firstLetter = teacherName.charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-lg mx-auto bg-[#ebdcc4] border border-[#d6c4a8] rounded-2xl shadow-[0_8px_25px_rgba(115,85,45,0.12)] overflow-hidden select-none animate-fadeIn shrink-0">
      {/* Mac Window Title Bar */}
      <div className="bg-[#dfccb0] px-3.5 py-1.5 border-b border-[#c8b598] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Laptop className="w-3.5 h-3.5 text-[#6e5334]" />
          <span className="font-extrabold text-[11px] text-[#5c4326] tracking-wide">Tin Học OS v1.0</span>
        </div>

        {/* Mac Window Control Dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/40 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-500/40 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 border border-rose-500/40 inline-block" />
        </div>
      </div>

      {/* Mac Window Content with Compact Teacher Avatar */}
      <div className="py-2.5 px-4 bg-white/70 backdrop-blur-xs text-center flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative Ring Background */}
        <div className="relative mb-1.5 group cursor-pointer">
          {/* Avatar Container */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 border-2 border-white shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={teacherName} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <span className="text-xl font-black text-[#5c4326] drop-shadow-xs">
                {firstLetter}
              </span>
            )}
          </div>

          {/* Verified Shield Badge */}
          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full border border-white shadow-xs" title="Đã xác thực tài khoản">
            <ShieldCheck className="w-3 h-3" />
          </div>
        </div>

        {/* Greeting & Role Information */}
        <h2 className="text-sm sm:text-base font-black text-[#42301c] tracking-tight leading-snug">
          Xin chào, {teacherName} 👏
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isRootUser ? (
            <span className="bg-[#fef9c3] text-[#713f12] border border-[#fde047] text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-2xs tracking-tight select-none">
              Quản trị hệ thống (Admin)
            </span>
          ) : (
            <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black px-2 py-0.2 rounded-full shadow-2xs">
              {roleName}
            </span>
          )}
          <span className="text-[11px] font-bold text-[#806443]">• Trường TH Long Định</span>
        </div>

        <p className="text-[11px] font-bold text-[#967650] mt-1.5 flex items-center gap-1">
          <span>🎓</span>
          <span>Kéo thả hoặc nhấp chọn ứng dụng bên dưới để bắt đầu</span>
        </p>
      </div>
    </div>
  );
};
