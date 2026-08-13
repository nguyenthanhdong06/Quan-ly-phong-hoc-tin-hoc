import React from 'react';
import { Student } from '../types';
import { StudentAvatar3D } from './StudentAvatar3D';
import { formatSmartStudentName } from '../utils/nameFormatter';

interface StudentCard3DProps {
  student: Student;
  classStudents?: Student[];
  machineName?: string;
  starCount?: number;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isAbsent?: boolean;
}

export const StudentCard3D: React.FC<StudentCard3DProps> = ({
  student,
  classStudents = [],
  machineName = 'Chưa xếp máy',
  starCount = 0,
  className = '',
  size = 'sm',
  isAbsent = false,
}) => {
  const isFemale = student.gender === 'Nữ';

  // Smart Name formatting respecting current rules & student context
  const displayName = formatSmartStudentName(student, classStudents);

  // Size max-width wrapper configurations: fluid max-width matching native card aspect ratio
  const widthClasses = {
    xs: 'w-full max-w-[170px]',
    sm: 'w-full max-w-[205px] sm:max-w-[220px]',
    md: 'w-full max-w-[245px] sm:max-w-[265px]',
    lg: 'w-full max-w-[290px] sm:max-w-[330px]',
  }[size];

  // Enhanced font sizes: Prominent student name with vibrant styling
  const fontSizes = {
    xs: {
      name: 'text-[11px] sm:text-xs font-black',
      machine: 'text-[9.5px] font-bold',
      star: 'text-[9.5px] font-black',
    },
    sm: {
      name: 'text-xs sm:text-sm font-black',
      machine: 'text-[10.5px] sm:text-[11.5px] font-bold',
      star: 'text-[10px] sm:text-[11px] font-black',
    },
    md: {
      name: 'text-sm sm:text-base font-black',
      machine: 'text-xs sm:text-sm font-extrabold',
      star: 'text-xs sm:text-sm font-black',
    },
    lg: {
      name: 'text-base sm:text-lg font-black',
      machine: 'text-sm sm:text-base font-extrabold',
      star: 'text-sm sm:text-base font-black',
    },
  }[size];

  const cardBgImage = isFemale ? '/thehocsinhnu.webp?v=4' : '/thehocsinhnam.webp?v=4';
  const fallbackBgImage = isFemale ? '/thehocsinhnu.png?v=4' : '/thehocsinhnam.png?v=4';
  
  // Standardized aspect ratio aspect-[354/470] ensures 100% equal card height & width across all genders
  const aspectClass = 'aspect-[354/470]';

  return (
    <div className={`relative mx-auto select-none ${widthClasses} ${className}`}>
      {/* 3D Container with standardized aspect ratio for 100% synchronized card sizes */}
      <div 
        className={`relative w-full ${aspectClass} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-300/80 transition-all duration-300 hover:shadow-xl hover:scale-[1.015] ${
          isAbsent ? 'opacity-85 filter grayscale-[20%]' : ''
        }`}
      >
        {/* Background Card Image: /thehocsinhnu.webp or /thehocsinhnam.webp */}
        <img
          src={cardBgImage}
          alt={`Thẻ Học Sinh ${isFemale ? 'Nữ' : 'Nam'}`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackBgImage;
          }}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 select-none"
        />

        {/* Optional Absent Badge Indicator at Top Left */}
        {isAbsent && (
          <div className="absolute top-2 left-2 z-20 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md border border-rose-300 flex items-center gap-1 uppercase tracking-wider animate-pulse">
            <span>⚠️ Vắng</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VỊ TRÍ SỐ 1: SỐ SAO HIỆN CÓ (Top Right inside white board box)       */}
        {/* ==================================================================== */}
        <div
          className={`absolute z-10 flex items-center justify-end font-black text-amber-600 drop-shadow-xs ${fontSizes.star}`}
          style={{
            top: isFemale ? '59.5%' : '60.5%',
            right: '12.0%',
            height: '5.0%',
          }}
          title={`${starCount} Sao`}
        >
          <span className="flex items-center gap-1 bg-amber-100/90 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300/80 shadow-2xs backdrop-blur-xs">
            <span>{starCount}</span>
            <span className="text-amber-500">⭐</span>
          </span>
        </div>

        {/* ==================================================================== */}
        {/* VỊ TRÍ SỐ 2: AVATAR HỌC SINH (Centered in upper white board box)     */}
        {/* ==================================================================== */}
        <div
          className="absolute z-10 flex items-center justify-center overflow-hidden"
          style={{
            top: isFemale ? '60.5%' : '61.5%',
            left: '37.5%',
            width: '25.0%',
            height: '18.5%',
          }}
        >
          <StudentAvatar3D
            gender={student.gender}
            size="w-full h-full"
            name={student.name}
            avatarUrl={student.avatarUrl}
          />
        </div>

        {/* ==================================================================== */}
        {/* VỊ TRÍ SỐ 3: TÊN HỌC SINH (NỔI BẬT - Centered below avatar)         */}
        {/* ==================================================================== */}
        <div
          className={`absolute z-10 flex items-center justify-center text-center font-black tracking-tight leading-none overflow-hidden whitespace-nowrap text-ellipsis ${fontSizes.name}`}
          style={{
            top: isFemale ? '79.5%' : '80.5%',
            left: '12.0%',
            width: '76.0%',
            height: '6.5%',
          }}
          title={`Họ và tên đầy đủ: ${student.name}`}
        >
          {/* Prominent stylized name badge */}
          <span className={`px-2 py-0.5 rounded-lg truncate max-w-full ${
            isFemale 
              ? 'text-rose-900 bg-rose-50/80 border border-rose-200/60 shadow-2xs' 
              : 'text-sky-950 bg-sky-50/80 border border-sky-200/60 shadow-2xs'
          }`}>
            {displayName}
          </span>
        </div>

        {/* ==================================================================== */}
        {/* VỊ TRÍ SỐ 4: SỐ MÁY HỌC ĐƯỢC BỐ TRÍ (Centered below student name)    */}
        {/* ==================================================================== */}
        <div
          className={`absolute z-10 flex items-center justify-center text-center font-black text-indigo-700 tracking-tight leading-none overflow-hidden whitespace-nowrap text-ellipsis ${fontSizes.machine}`}
          style={{
            top: isFemale ? '87.5%' : '88.5%',
            left: '12.0%',
            width: '76.0%',
            height: '5.5%',
          }}
          title={machineName}
        >
          <span className="flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-full border border-indigo-200/70 shadow-2xs text-indigo-900">
            <span>💻</span>
            <span>{machineName}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
