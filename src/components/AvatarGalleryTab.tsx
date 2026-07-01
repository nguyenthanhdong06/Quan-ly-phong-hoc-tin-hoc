import React, { useState } from 'react';
import { Student, ClassItem } from '../types';
import { Image, User, Check, RotateCcw, Sparkles } from 'lucide-react';

interface AvatarGalleryTabProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: ClassItem[];
  selectedClass: string;
  setSelectedClass: (classId: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const googleDriveAvatars = [
  "https://drive.google.com/thumbnail?id=1mjpI3dUOzHY8L5l-y7CkL_s9jw9XriSI&sz=w512",
  "https://drive.google.com/thumbnail?id=1piSQIYDZsEvxdJgb45Kq1Vykiu32rrE4&sz=w512",
  "https://drive.google.com/thumbnail?id=1TweRboo4BiKKbuSf_teqSJmf0s0IO-pK&sz=w512",
  "https://drive.google.com/thumbnail?id=11pJQb5vgMElsQDZt1iZ5D1QzZe5UBbnj&sz=w512",
  "https://drive.google.com/thumbnail?id=1W5YOyftQNklHQEkjtAT7HyvxKdKaBtj1&sz=w512",
  "https://drive.google.com/thumbnail?id=14h7AjxbPzKfZ5JGRqxvUdAKuHm7uF26R&sz=w512",
  "https://drive.google.com/thumbnail?id=1umCvKNjXxW8LeqomzxrN0VwaaENfxrhS&sz=w512",
  "https://drive.google.com/thumbnail?id=1XC-HABWrm8-BKzzyHcD9UsTBRaRWMO0N&sz=w512",
  "https://drive.google.com/thumbnail?id=1LPh7RwfLYLL51vQTFoz-hn1hgSg3aKlt&sz=w512",
  "https://drive.google.com/thumbnail?id=1US3HJNd0lgMKB3FLv3QmDRKvLL8tEudV&sz=w512",
  "https://drive.google.com/thumbnail?id=1c5UC-8S1QmPwbTJGpSLwmAcFq1DkxZ-_&sz=w512",
  "https://drive.google.com/thumbnail?id=1hV9fR049ulTD6ooRrNfHwx6Ue92NQvNt&sz=w512"
];

// Fallback emoji avatar helper
const getFallbackAvatar = (studentId: string, allStudents?: Student[]) => {
  const avatars = ["🐼", "🐰", "🦁", "🦊", "🐯", "🐨", "🐸", "🐷", "🐻", "🦉", "🐱", "🐶"];
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return avatars[hash % avatars.length];
};

export const AvatarGalleryTab: React.FC<AvatarGalleryTabProps> = ({
  students,
  setStudents,
  classes,
  selectedClass,
  setSelectedClass,
  showToast,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const classStudents = students.filter(s => s.classId === selectedClass);
  const selectedStudentObj = students.find(s => s.id === selectedStudentId);

  const handleSelectAvatar = (url: string) => {
    if (!selectedStudentId) {
      showToast('Vui lòng chọn một học sinh trước khi đặt avatar!', 'error');
      return;
    }

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        return { ...s, avatarUrl: url };
      }
      return s;
    }));

    const studentName = selectedStudentObj?.name || 'Học sinh';
    showToast(`Đã đổi avatar thành công cho học sinh ${studentName}!`, 'success');
  };

  const handleResetAvatar = () => {
    if (!selectedStudentId) {
      showToast('Vui lòng chọn học sinh để khôi phục!', 'error');
      return;
    }

    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        const { avatarUrl, ...rest } = s;
        return rest;
      }
      return s;
    }));

    const studentName = selectedStudentObj?.name || 'Học sinh';
    showToast(`Đã khôi phục avatar mặc định cho ${studentName}!`, 'success');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Image className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">KHO AVATAR HỌC SINH</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Quản trị viên hoặc Giáo viên có thể lựa chọn avatar độc đáo từ Google Drive cho từng học sinh.
          </p>
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">Chọn Lớp:</label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedStudentId('');
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List of Students */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col max-h-[600px]">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <User className="w-4 h-4 text-slate-500" />
            Danh sách học sinh ({classStudents.length})
          </h3>

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {classStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                Không tìm thấy học sinh nào trong lớp này.
              </div>
            ) : (
              classStudents.map((student) => {
                const isSelected = student.id === selectedStudentId;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Small avatar circle */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-lg leading-none">
                          {getFallbackAvatar(student.id, students)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate leading-tight">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Mã HS: {student.code}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Avatar Editor & Gallery */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active selection showcase */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
            {selectedStudentObj ? (
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Big Avatar */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full bg-slate-50 border-4 border-amber-100 shadow-md flex items-center justify-center overflow-hidden">
                      {selectedStudentObj.avatarUrl ? (
                        <img
                          src={selectedStudentObj.avatarUrl}
                          alt={selectedStudentObj.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl leading-none">
                          {getFallbackAvatar(selectedStudentObj.id, students)}
                        </span>
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full text-[10px] border border-white">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="text-center sm:text-left">
                    <h4 className="text-base font-black text-slate-800 tracking-tight">
                      {selectedStudentObj.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                      Lớp: {classes.find(c => c.id === selectedStudentObj.classId)?.name || 'Lớp học'} | Mã HS: {selectedStudentObj.code}
                    </p>
                  </div>
                </div>

                {/* Reset button if custom avatar set */}
                {selectedStudentObj.avatarUrl && (
                  <button
                    onClick={handleResetAvatar}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100/50 rounded-xl transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Khôi phục mặc định
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
                <User className="w-8 h-8 text-slate-300" />
                Vui lòng chọn học sinh từ danh sách bên trái để cài đặt avatar.
              </div>
            )}
          </div>

          {/* Avatar Gallery Selector Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider border-b pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Bộ sưu tập Avatar Cute từ Google Drive
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {googleDriveAvatars.map((url, idx) => {
                const isAssigned = selectedStudentObj?.avatarUrl === url;
                return (
                  <button
                    key={idx}
                    disabled={!selectedStudentId}
                    onClick={() => handleSelectAvatar(url)}
                    className={`relative aspect-square rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all bg-slate-50 group ${
                      !selectedStudentId
                        ? 'opacity-60 cursor-not-allowed'
                        : isAssigned
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-sm scale-95'
                        : 'border-slate-100 hover:border-amber-300 hover:scale-105 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Avatar Option ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {isAssigned && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <span className="bg-amber-500 text-white p-1 rounded-full shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
