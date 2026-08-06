import React from 'react';
import { Computer, Student } from '../types';
import { StudentAvatar3D } from './SeatingTab';
import { formatSmartStudentName } from '../utils/nameFormatter';

interface ComputerCard3DProps {
  computer: Computer;
  studentObj?: Student;
  classStudents?: Student[];
  isDraggingThis?: boolean;
  isDraggedOverThis?: boolean;
  onClick?: () => void;
  onAvatarClick?: (e: React.MouseEvent, student: Student) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  formatStudentName?: (name: string) => string;
  isProjectorView?: boolean;
  scaleSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ComputerCard3D: React.FC<ComputerCard3DProps> = ({
  computer,
  studentObj,
  classStudents = [],
  isDraggingThis = false,
  isDraggedOverThis = false,
  onClick,
  onAvatarClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  formatStudentName,
  isProjectorView = false,
  scaleSize = 'md',
}) => {
  // Determine status
  const isFaulty = computer.status === 'Đang hỏng';
  const isMaintenance = computer.status === 'Bảo trì';

  // Determine size configuration based on scaleSize and projector view
  const actualScale = isProjectorView ? scaleSize : 'md';

  const sizeConfig = {
    sm: {
      cardPadding: 'pt-2.5 px-2.5 pb-[44px]',
      minHeight: 'min-h-[135px]',
      badgeText: 'text-[6.5px]',
      badgePadding: 'px-1 py-0.5',
      nameText: 'text-[9.5px] py-0 font-black',
      avatarSize: 'w-8 h-8',
      studentNameText: 'text-[8px] px-1 py-0.5 rounded-md w-[88%] mx-auto',
      emptyText: 'text-[8.5px] py-0.5 px-1.5 rounded-md',
      contentGap: 'gap-0.5',
      marginTop: 'mt-0.5 pt-0.5',
    },
    md: {
      cardPadding: 'pt-3 px-3.5 pb-[52px]',
      minHeight: 'min-h-[160px]',
      badgeText: 'text-[7.5px] sm:text-[8px]',
      badgePadding: 'px-1.5 py-0.5',
      nameText: 'text-[10.5px] sm:text-[11px] font-black py-0.5',
      avatarSize: 'w-9.5 h-9.5 sm:w-10 sm:h-10',
      studentNameText: 'text-[9px] sm:text-[9.5px] px-1.5 py-0.5 rounded-md w-[86%] mx-auto',
      emptyText: 'text-[9px] py-0.5 px-2 rounded-md',
      contentGap: 'gap-0.5',
      marginTop: 'mt-0.5 pt-0.5',
    },
    lg: {
      cardPadding: 'pt-4 px-4 pb-[62px]',
      minHeight: 'min-h-[190px]',
      badgeText: 'text-[8.5px] sm:text-[9px]',
      badgePadding: 'px-1.5 py-0.5',
      nameText: 'text-xs sm:text-xs font-black py-0.5',
      avatarSize: 'w-11 h-11 sm:w-12 sm:h-12',
      studentNameText: 'text-[10px] sm:text-[10.5px] px-2 py-0.5 rounded-lg w-[84%] mx-auto',
      emptyText: 'text-[9.5px] py-0.5 px-2 rounded-lg',
      contentGap: 'gap-1',
      marginTop: 'mt-1 pt-1',
    },
    xl: {
      cardPadding: 'pt-5 px-5 pb-[72px]',
      minHeight: 'min-h-[225px]',
      badgeText: 'text-[9.5px] sm:text-[10px]',
      badgePadding: 'px-2 py-0.5',
      nameText: 'text-xs sm:text-sm font-black py-0.5',
      avatarSize: 'w-13 h-13 sm:w-14 sm:h-14',
      studentNameText: 'text-[11px] sm:text-[11.5px] px-2.5 py-1 rounded-xl w-[82%] mx-auto',
      emptyText: 'text-[10.5px] py-1 px-2.5 rounded-lg',
      contentGap: 'gap-1.5',
      marginTop: 'mt-1 pt-1',
    },
  }[actualScale];

  // Dragging & Hover style shifts
  let dragStyle = studentObj ? 'cursor-grab active:cursor-grabbing hover:scale-[1.03] active:scale-[0.97]' : 'cursor-pointer hover:scale-[1.03] active:scale-[0.97]';
  if (isDraggingThis) {
    dragStyle = 'opacity-30 border-dashed scale-95 select-none cursor-grabbing';
  }

  let ringStyle = '';
  if (isDraggedOverThis) {
    ringStyle = 'ring-4 ring-indigo-500 ring-offset-2 scale-[1.06] z-20 animate-pulse';
  }

  // Dynamic colors based on status for text & badge
  let screenBg = 'from-blue-50/95 to-cyan-50/95';
  let computerNameColor = 'text-blue-950';
  let statusBadgeBg = 'bg-blue-600 text-white border-blue-400';
  let dividerColor = 'border-blue-200/60';
  let studentBadgeStyle = 'bg-indigo-800 text-white font-extrabold border-none shadow-none';
  let emptyStyle = 'bg-blue-50 border-blue-200/50 text-blue-800/80';
  let dropShadowFilter = 'drop-shadow(0 3px 6px rgba(14,165,233,0.15))';

  if (isFaulty) {
    screenBg = 'from-rose-50/95 to-red-100/95';
    computerNameColor = 'text-rose-950';
    statusBadgeBg = 'bg-rose-600 text-white border-rose-400';
    dividerColor = 'border-rose-200/60';
    studentBadgeStyle = 'bg-rose-800 text-white font-extrabold border-none shadow-none';
    emptyStyle = 'bg-rose-50 border-rose-200/50 text-rose-800/80';
    dropShadowFilter = 'drop-shadow(0 3px 6px rgba(244,63,94,0.2))';
  } else if (isMaintenance) {
    screenBg = 'from-purple-50/95 to-violet-100/95';
    computerNameColor = 'text-purple-950';
    statusBadgeBg = 'bg-purple-600 text-white border-purple-400';
    dividerColor = 'border-purple-200/60';
    studentBadgeStyle = 'bg-purple-800 text-white font-extrabold border-none shadow-none';
    emptyStyle = 'bg-purple-50 border-purple-200/50 text-purple-800/80';
    dropShadowFilter = 'drop-shadow(0 3px 6px rgba(168,85,247,0.2))';
  }

  return (
    <div
      onClick={onClick}
      draggable={!!studentObj}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative w-full transition-all duration-200 transform select-none ${dragStyle} ${ringStyle}`}
      style={{
        filter: dropShadowFilter,
      }}
      title={studentObj ? `Nhấn giữ để kéo thả đổi chỗ [${studentObj.name}]` : 'Nhấp chuột để gán học sinh'}
    >
      {/* Outer Card Container - transparent wrapper maintaining native iMac aspect ratio (~1.17:1) */}
      <div className={`relative bg-transparent flex flex-col justify-between ${sizeConfig.cardPadding} ${sizeConfig.minHeight}`}>
        
        {/* Screen Background Layer (zIndex: 0) - positioned behind the glass screen portion of the monitor */}
        <div 
          className={`absolute bg-gradient-to-b ${screenBg}`}
          style={{
            top: '5.3%',
            bottom: '31.6%',
            left: '3.5%',
            right: '3.5%',
            borderRadius: '5px 5px 0 0',
            zIndex: 0,
          }}
        />

        {/* Monitor Frame Image Element (zIndex: 5) - renders the iMac monitor frame image natively */}
        <img 
          src="/img/chongoi3.png"
          alt="iMac Monitor Frame"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/public/chongoi3.png';
          }}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          style={{
            zIndex: 5,
          }}
        />

        {/* Content Layer (zIndex: 20) */}
        <div 
          className={`relative flex flex-col justify-between h-full flex-grow ${sizeConfig.contentGap}`}
          style={{
            zIndex: 20,
          }}
        >
          
          {/* Card Top Header Info Bar */}
          <div className="flex justify-between items-center gap-1 w-full min-w-0">
            <span className={`font-black uppercase tracking-wider rounded-md border shadow-2xs shrink-0 whitespace-nowrap ${sizeConfig.badgeText} ${sizeConfig.badgePadding} ${statusBadgeBg}`}>
              {computer.isMerged ? '💻 Ghép' : '💻 Trạm'}
            </span>
            
            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-full border border-slate-200/80 backdrop-blur-2xs shadow-2xs shrink-0 whitespace-nowrap">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                computer.status === 'Hoạt động' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' :
                computer.status === 'Đang hỏng' ? 'bg-rose-600 animate-ping' : 'bg-sky-500'
              }`} />
              <span className={`font-extrabold text-slate-800 tracking-tight shrink-0 ${sizeConfig.badgeText}`}>{computer.status}</span>
            </div>
          </div>

          {/* Computer Name Heading */}
          <p className={`font-black drop-shadow-2xs text-center ${sizeConfig.nameText} ${computerNameColor}`}>
            {computer.name}
          </p>

          {/* Student Area Container */}
          <div className={`border-t flex flex-col items-center justify-center flex-grow ${sizeConfig.marginTop} ${dividerColor}`}>
            {studentObj ? (
              <div className="flex flex-col items-center w-full gap-0.5">
                {/* Avatar with click-to-change handler */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAvatarClick) onAvatarClick(e, studentObj);
                  }}
                  className="cursor-pointer hover:scale-110 active:scale-95 transition-transform drop-shadow-md"
                  title={`Nhấp vào đây để đổi avatar cho ${studentObj.name}`}
                >
                  <StudentAvatar3D 
                    gender={studentObj.gender} 
                    size={sizeConfig.avatarSize} 
                    name={studentObj.name} 
                    avatarUrl={studentObj.avatarUrl}
                  />
                </div>
                
                {/* Student Name Badge */}
                <div className={`font-black uppercase tracking-wide text-center whitespace-normal break-words leading-tight shadow-sm border ${sizeConfig.studentNameText} ${studentBadgeStyle}`}>
                  {formatSmartStudentName(studentObj, classStudents)}
                </div>
              </div>
            ) : (
              <div className={`py-0.5 px-2.5 shadow-inner border text-center ${sizeConfig.emptyText} ${emptyStyle}`}>
                <span className="font-extrabold tracking-wider italic block">
                  Trống
                </span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
