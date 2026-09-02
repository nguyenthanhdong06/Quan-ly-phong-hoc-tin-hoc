import React, { useState, useEffect, useMemo } from 'react';

import { convertGoogleDriveUrl } from '../utils/googleDriveImageHelper';
import { getStudentAvatar } from '../utils/studentAvatar';

export interface StudentAvatar3DProps {
  gender?: string;
  size?: string;
  name?: string;
  avatarUrl?: string;
  studentId?: string;
  allStudents?: any[];
}

// 3D Animal Avatar component or custom Google Drive URL
export const StudentAvatar3D = React.memo(({ 
  gender, 
  size = 'w-10 h-10', 
  name = '', 
  avatarUrl,
  studentId,
  allStudents
}: StudentAvatar3DProps) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [avatarUrl]);

  const animalAvatar = useMemo(() => {
    return getStudentAvatar(studentId || name || 'default_student', allStudents);
  }, [studentId, name, allStudents]);

  const fastAvatarUrl = useMemo(() => {
    if (!avatarUrl) return '';
    return convertGoogleDriveUrl(avatarUrl, 256);
  }, [avatarUrl]);

  if (!avatarUrl || error) {
    return (
      <div 
        className={`${size} rounded-full flex items-center justify-center font-extrabold border-2 shadow-inner select-none shrink-0 ${animalAvatar.bg} transition-transform duration-200`}
        title={name || "Avatar học sinh"}
      >
        <span className="text-[1.3em] leading-none pointer-events-none select-none">
          {animalAvatar.emoji}
        </span>
      </div>
    );
  }

  return (
    <img
      src={fastAvatarUrl}
      alt={name || "Student Avatar"}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${size} rounded-full object-cover border-2 border-slate-200/90 shadow-md hover:scale-105 transition-transform duration-200 shrink-0`}
      loading="lazy"
      decoding="async"
    />
  );
});

export const formatStudentNameFirstAndMiddle = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 2) {
    return words.slice(-2).join(' ');
  }
  return trimmed;
};
