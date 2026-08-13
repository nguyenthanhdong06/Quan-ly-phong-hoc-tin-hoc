import React, { useState, useEffect } from 'react';

// 3D Pixel/Cartoon Avatar component for boy/girl or custom Google Drive URL
export const StudentAvatar3D = ({ gender, size = 'w-10 h-10', name = '', avatarUrl }: { gender: string; size?: string; name?: string; avatarUrl?: string }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [avatarUrl]);

  const isGirl = gender === 'Nữ';

  if (!avatarUrl || error) {
    return (
      <div 
        className={`${size} rounded-full flex items-center justify-center font-extrabold border-2 shadow-inner select-none shrink-0 ${
          isGirl 
            ? 'bg-gradient-to-tr from-pink-400 to-rose-300 border-pink-200 text-white' 
            : 'bg-gradient-to-tr from-blue-400 to-sky-300 border-blue-200 text-white'
        }`}
        title={name || "Avatar mặc định"}
      >
        <span className="text-[1.25em] leading-none pointer-events-none">
          {isGirl ? '👧🏻' : '👦🏻'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name || "Student Avatar"}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${size} rounded-full object-cover border-2 border-slate-200/90 shadow-md hover:scale-105 transition-transform duration-200 shrink-0`}
    />
  );
};

export const formatStudentNameFirstAndMiddle = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 2) {
    return words.slice(-2).join(' ');
  }
  return trimmed;
};
