import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { Trash2, UserPlus, FileSpreadsheet, Search, AlertCircle, Plus, Pencil, Check, X, Download, IdCard, ArrowLeft } from 'lucide-react';
import { StudentCard3D } from './StudentCard3D';

interface StudentsTabProps {
  selectedClass: string;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface NoteInputProps {
  studentId: string;
  initialValue: string;
  onSave: (id: string, value: string) => void;
}

const NoteInput = ({ studentId, initialValue, onSave }: NoteInputProps) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value !== initialValue) {
      onSave(studentId, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Ghi chú nhanh..."
      className="w-full text-xs text-slate-600 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-200 rounded-lg px-2.5 py-1.5 focus:outline-none transition-all placeholder:text-slate-350"
    />
  );
};

// 🔤 Hàm tự động viết hoa chữ cái đầu tiên của Họ và Tên (VD: nguyên văn a -> Nguyễn Văn A)
const capitalizeName = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function StudentsTab({
  selectedClass,
  students,
  setStudents,
  showToast
}: StudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Single Student Addition states
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newNote, setNewNote] = useState('');

  // Multi-Student paste Excel box
  const [excelText, setExcelText] = useState('');

  // Editing a student row in-line
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [editNote, setEditNote] = useState('');

  // Sợ bấm nhầm nút xóa của học sinh
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Student ID Card Preview Modal state
  const [selectedCardStudent, setSelectedCardStudent] = useState<Student | null>(null);

  // Phân trang danh sách học sinh
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<10 | 20 | 50>(10);

  // ➕ Thêm học sinh Inline View State & Row Highlight State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  // Reset trang khi đổi lớp hoặc tìm kiếm để tránh bị trang trống
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, searchTerm]);

  // Lọc danh sách học sinh theo Lớp đang chọn và Từ khóa tìm kiếm
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClass);
  }, [students, selectedClass]);

  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [classStudents, searchTerm]);

  // Tính toán dữ liệu phân trang
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handleDeleteStudent = (id: string, name: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast(`Đã xóa học sinh ${name} khỏi lớp ${selectedClass}`);
  };

  const handleStartEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditCode(student.code);
    setEditName(student.name);
    setEditGender(student.gender);
    setEditNote(student.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    const codeClean = editCode.trim().toUpperCase();
    const nameClean = capitalizeName(editName.trim());

    if (!nameClean || !codeClean) {
      showToast('Tên và Mã số học sinh không được để trống!', 'error');
      return;
    }

    // Kiểm tra trùng mã học sinh ngoại trừ chính mình
    if (students.some(s => s.id !== id && s.code.toUpperCase() === codeClean)) {
      showToast(`Mã số học sinh "${codeClean}" đã tồn tại trên hệ thống!`, 'error');
      return;
    }

    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          code: codeClean,
          name: nameClean,
          gender: editGender,
          notes: editNote.trim()
        };
      }
      return s;
    }));

    setEditingStudentId(null);
    showToast('Đã lưu thay đổi thông tin học sinh thành công!');
  };

  const handleSaveNote = (id: string, noteValue: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, notes: noteValue.trim() } : s));
    showToast('Đã cập nhật ghi chú học sinh!');
  };

  // Handle addition with Duplicate Check & Confirmation Dialog & Auto-close & Auto-scroll
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const nameClean = capitalizeName(newName.trim());
    const codeClean = newCode.trim().toUpperCase();

    if (!nameClean || !codeClean) {
      showToast('Vui lòng nhập đầy đủ mã học sinh và họ tên!', 'error');
      return;
    }

    // 1. ⚠️ Cảnh báo trùng Mã số học sinh (MSHS)
    const existingCodeStudent = students.find(s => s.code.toUpperCase() === codeClean);
    if (existingCodeStudent) {
      showToast(`⚠️ CẢNH BÁO TRÙNG MÃ: MSHS "${codeClean}" đã thuộc về học sinh ${existingCodeStudent.name} (Lớp ${existingCodeStudent.classId})!`, 'error');
      return;
    }

    // 2. ⚠️ Hộp thoại hỏi ý kiến & Gợi ý tự động thêm phân biệt tên phụ (1), (2)... khi trùng tên
    let finalStudentName = nameClean;
    const sameNameCount = classStudents.filter(s => {
      const base = s.name.replace(/\s*\(\d+\)$/, '').trim().toLowerCase();
      return base === nameClean.toLowerCase();
    }).length;

    if (sameNameCount > 0) {
      const suggestedSuffixName = `${nameClean} (${sameNameCount})`;
      const confirmAddDuplicate = window.confirm(
        `⚠️ PHÁT HIỆN HỌC SINH TRÙNG TÊN TRONG LỚP ${selectedClass}!\n\nLớp ${selectedClass} đã có ${sameNameCount} học sinh tên: "${nameClean}".\n\n💡 GỢI Ý PHÂN BIỆT TÊN PHỤ: Bạn có muốn tự động thêm số phân biệt tên phụ thành:\n👉 "${suggestedSuffixName}" không?\n\n• Nhấn OK: Tự động đổi tên thành "${suggestedSuffixName}".\n• Nhấn Cancel: Giữ nguyên tên gốc "${nameClean}".`
      );
      if (confirmAddDuplicate) {
        finalStudentName = suggestedSuffixName;
      }
    }

    const item: Student = {
      id: `st-${Date.now()}`,
      code: codeClean,
      name: finalStudentName,
      gender: newGender,
      classId: selectedClass,
      notes: newNote.trim()
    };

    setStudents(prev => [...prev, item]);
    setNewCode('');
    setNewName('');
    setNewGender('Nam');
    setNewNote('');

    // 🚀 1. Tự động chuyển về danh sách học sinh
    setIsAddStudentModalOpen(false);

    // 🎯 2. Tự động tính toán chuyển đến trang chứa học sinh vừa thêm
    const targetPage = Math.ceil((classStudents.length + 1) / itemsPerPage);
    setCurrentPage(targetPage);

    // ✨ 3. Hiệu ứng viền phát sáng làm nổi bật học sinh vừa thêm
    setHighlightedStudentId(item.id);
    setTimeout(() => {
      setHighlightedStudentId(null);
    }, 4000);

    // 📜 4. Cuộn mượt màn hình tới vị trí dòng học sinh vừa thêm
    setTimeout(() => {
      const rowEl = document.getElementById(`student-row-${item.id}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);

    showToast(`✅ Đã thêm học sinh ${item.name} vào lớp ${selectedClass}!`);
  };

  // Handle upload paste from Excel with Confirmation & Auto-suffix (1), (2) & Auto-capitalization & Auto-scroll
  const handleImportExcel = () => {
    if (!excelText.trim()) {
      showToast('Vui lòng dán dữ liệu cột học sinh Copy từ Excel!', 'error');
      return;
    }

    const lines = excelText.split('\n');
    const duplicateNamesInExcel: string[] = [];

    // Quét phát hiện danh sách học sinh trùng tên
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let parts = trimmedLine.split('\t');
      if (parts.length === 1 && trimmedLine.includes(',')) {
        parts = trimmedLine.split(',');
      }

      const rawName = parts[0] ? capitalizeName(parts[0].trim()) : '';

      if (
        !rawName || 
        rawName.toLowerCase().startsWith('sep=') ||
        rawName.toLowerCase() === 'họ và tên' || 
        rawName.toLowerCase() === 'họ tên' || 
        rawName.toLowerCase() === 'hoten' || 
        rawName.toLowerCase() === 'name'
      ) {
        return;
      }

      const isDuplicateInClass = classStudents.some(s => {
        const base = s.name.replace(/\s*\(\d+\)$/, '').trim().toLowerCase();
        return base === rawName.toLowerCase();
      });
      if (isDuplicateInClass) {
        duplicateNamesInExcel.push(rawName);
      }
    });

    // Track name occurrences to auto-add suffix (1), (2)...
    const nameTracker: Record<string, number> = {};
    classStudents.forEach(s => {
      const base = s.name.replace(/\s*\(\d+\)$/, '').trim().toLowerCase();
      nameTracker[base] = (nameTracker[base] || 0) + 1;
    });

    let useAutoSuffix = true;
    if (duplicateNamesInExcel.length > 0) {
      const confirmSuffix = window.confirm(
        `⚠️ PHÁT HIỆN ${duplicateNamesInExcel.length} HỌC SINH TRÙNG TÊN KHI DÁN EXCEL!\n\nCác học sinh sau đã có tên trong lớp ${selectedClass}:\n${duplicateNamesInExcel.slice(0, 3).map(n => `• ${n}`).join('\n')}${duplicateNamesInExcel.length > 3 ? '\n...' : ''}\n\n💡 GỢI Ý PHÂN BIỆT TÊN PHỤ: Bạn có muốn tự động thêm số phân biệt (1), (2)... không?\n\n• Nhấn [OK]: TỰ ĐỘNG THÊM SỐ (1), (2) phân biệt tên phụ.\n• Nhấn [Cancel]: GIỮ NGUYÊN TÊN GỐC không thêm số.`
      );
      useAutoSuffix = confirmSuffix;
    }

    let addedCount = 0;
    const newStudentsList: Student[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let parts = trimmedLine.split('\t');
      if (parts.length === 1 && trimmedLine.includes(',')) {
        parts = trimmedLine.split(',');
      }

      const rawName = parts[0] ? capitalizeName(parts[0].trim()) : '';

      if (
        !rawName || 
        rawName.toLowerCase().startsWith('sep=') ||
        rawName.toLowerCase() === 'họ và tên' || 
        rawName.toLowerCase() === 'họ tên' || 
        rawName.toLowerCase() === 'hoten' || 
        rawName.toLowerCase() === 'name'
      ) {
        return;
      }

      let finalName = rawName;
      const baseKey = rawName.toLowerCase();
      if (nameTracker[baseKey]) {
        if (useAutoSuffix) {
          finalName = `${rawName} (${nameTracker[baseKey]})`;
        }
        nameTracker[baseKey] += 1;
      } else {
        nameTracker[baseKey] = 1;
      }

      let gender: 'Nam' | 'Nữ' = 'Nam';
      if (parts[1] !== undefined) {
        const rawGender = parts[1].trim().toLowerCase();
        if (rawGender === 'x' || rawGender === 'nữ' || rawGender === 'nu' || rawGender === '1' || rawGender === 'f' || rawGender === 'female' || rawGender === '✓') {
          gender = 'Nữ';
        } else if (rawGender === 'nam' || rawGender === 'm' || rawGender === 'male') {
          gender = 'Nam';
        } else if (rawGender.length > 0) {
          gender = 'Nữ';
        }
      } else {
        const lowerName = rawName.toLowerCase();
        if (lowerName.includes('thị') || lowerName.includes('vy') || lowerName.includes('lan') || lowerName.includes('hoa') || lowerName.includes('diệp') || lowerName.includes('trang') || lowerName.includes('nhung')) {
          gender = 'Nữ';
        }
      }

      const generatedCode = `HS${Math.floor(100 + Math.random() * 900)}`;

      newStudentsList.push({
        id: `st-ex-${Date.now()}-${index}`,
        code: generatedCode,
        name: finalName,
        gender,
        classId: selectedClass
      });
      addedCount++;
    });

    if (addedCount > 0) {
      setStudents(prev => [...prev, ...newStudentsList]);
      setExcelText('');

      // 🚀 1. Tự động chuyển về danh sách học sinh
      setIsAddStudentModalOpen(false);

      // 🎯 2. Tự động chuyển tới trang cuối chứa học sinh vừa nhập
      const newTotalStudentsCount = classStudents.length + addedCount;
      const targetPage = Math.max(1, Math.ceil(newTotalStudentsCount / itemsPerPage));
      setCurrentPage(targetPage);

      // ✨ 3. Hiệu ứng viền phát sáng nổi bật cho học sinh cuối cùng vừa dán
      const lastAdded = newStudentsList[newStudentsList.length - 1];
      if (lastAdded) {
        setHighlightedStudentId(lastAdded.id);
        setTimeout(() => {
          setHighlightedStudentId(null);
        }, 4000);

        // 📜 4. Cuộn mượt tới vị trí dòng học sinh vừa thêm
        setTimeout(() => {
          const rowEl = document.getElementById(`student-row-${lastAdded.id}`);
          if (rowEl) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 250);
      }

      showToast(`🎉 Tuyệt vời! Đã nạp thành công ${addedCount} học sinh vào lớp ${selectedClass}!`);
    } else {
      showToast('Không tìm thấy dữ liệu học sinh hợp lệ để nhập!', 'error');
    }
  };

  // Tải file mẫu CSV đúng chuẩn Excel
  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFF" + 
      "Họ Và Tên,Nữ\n" +
      "Bùi Ngọc Quỳnh Anh,x\n" +
      "Phan Thị Ngọc Anh,x\n" +
      "Lương Ngọc Kim Ánh,x\n" +
      "Nguyễn Hoàng Ân,\n" +
      "Nguyễn Hữu Danh,\n" +
      "Lê Đức Duy,\n" +
      "Lê Quốc Đại,\n" +
      "Lê Võ Tấn Đạt,\n" +
      "Lê Ngọc Hân,x\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Mau_Danh_Sach_Hoc_Sinh_Lop_${selectedClass}.csv`;
    link.click();
    showToast('Đã tải xuống tệp Excel CSV mẫu chuẩn!');
  };

  return (
    <div className="space-y-6">

      {/* ====================================================================
          1. CHẾ ĐỘ 1: CỬA SỔ THÊM HỌC SINH VÀO LỚP (INLINE VIEW 100%)
          ==================================================================== */}
      {isAddStudentModalOpen ? (
        <div className="space-y-6 animate-fadeIn w-full">
          {/* Top Navigation Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffbf0] border border-[#cbb89d] p-4 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setIsAddStudentModalOpen(false)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl border border-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-200" />
              <span>Quay Về Danh Sách Học Sinh</span>
            </button>

            <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>CHỨC NĂNG THÊM HỌC SINH VÀO LỚP {selectedClass}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* BẢNG 1: THÊM HỌC SINH ĐƠN LẺ */}
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex justify-between items-center text-left">
                <h4 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  THÊM HỌC SINH ĐƠN LẺ
                </h4>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-4">
                <form onSubmit={handleAddStudent} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left">Mã Số học sinh (MSHS)</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Ví dụ: HS388"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-300 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left flex justify-between items-center">
                      <span>Họ và Tên lót & Tên</span>
                      <span className="text-[9px] text-amber-600 font-bold lowercase">✨ Tự động viết hoa chữ cái đầu</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(capitalizeName(e.target.value))}
                      placeholder="Ví dụ: nguyễn văn a -> Nguyễn Văn A"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-300 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left">Giới tính học sinh</label>
                    <div className="flex gap-4 text-xs font-semibold pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={newGender === 'Nam'}
                          onChange={() => setNewGender('Nam')}
                          className="text-amber-500 focus:ring-amber-500 w-4 h-4"
                        />
                        👦🏻 Nam
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={newGender === 'Nữ'}
                          onChange={() => setNewGender('Nữ')}
                          className="text-amber-500 focus:ring-amber-500 w-4 h-4"
                        />
                        👧🏻 Nữ
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left">Ghi chú nhanh</label>
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ghi chú học tập, thiết bị, chỗ ngồi..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-350"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition cursor-pointer mt-2"
                  >
                    + Lưu Học Sinh
                  </button>
                </form>
              </div>
            </div>

            {/* BẢNG 2: CHUẨN HÓA NHẬP HÀNG LOẠT BẰNG EXCEL */}
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex justify-between items-center text-left">
                <h4 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  CHUẨN HÓA NHẬP HÀNG LOẠT BẰNG EXCEL
                </h4>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-3">
                <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                  Thầy cô sao chép đồng thời cột <strong>Họ tên học sinh</strong> và cột <strong>Nữ</strong> (như trong ảnh mẫu) trong file Excel, dán trực tiếp vào khung dưới đây.
                </p>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 font-semibold space-y-1 text-left">
                  <p className="text-slate-700 font-extrabold flex items-center gap-1 text-[10px]">
                    <span>📋</span> Minh họa sao chép từ Excel:
                  </p>
                  <div className="overflow-hidden rounded-md border border-slate-200 bg-white font-mono text-[9px] divide-y">
                    <div className="grid grid-cols-2 bg-slate-100 font-bold px-2 py-0.5 text-slate-700">
                      <div>Họ Và Tên</div>
                      <div className="border-l pl-2">Nữ</div>
                    </div>
                    <div className="grid grid-cols-2 px-2 py-0.5">
                      <div>Bùi Ngọc Quỳnh Anh</div>
                      <div className="border-l pl-2 text-rose-600 font-bold">x</div>
                    </div>
                    <div className="grid grid-cols-2 px-2 py-0.5">
                      <div>Nguyễn Hoàng Ân</div>
                      <div className="border-l pl-2 text-slate-400 font-normal"><i>(Để trống)</i></div>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 select-none">
                    * Cột 2 điền chữ <strong className="text-rose-600 font-bold">"x"</strong> cho học sinh Nữ, để trống nếu là Nam.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <textarea
                    value={excelText}
                    onChange={(e) => setExcelText(e.target.value)}
                    placeholder="Dán dữ liệu từ file Excel tại đây...&#10;Ví dụ:&#10;Bùi Ngọc Quỳnh Anh&#9;x&#10;Phan Thị Ngọc Anh&#9;x&#10;Nguyễn Hoàng Ân&#10;Lê Đức Duy"
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-left"
                  ></textarea>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 hover:text-emerald-800 font-black bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 py-2 rounded-xl w-full transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải file Excel mẫu (.csv)
                  </button>
                  
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-dashed text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setExcelText("Bùi Ngọc Quỳnh Anh\tx\nPhan Thị Ngọc Anh\tx\nLương Ngọc Kim Ánh\tx\nNguyễn Hoàng Ân\t\nNguyễn Hữu Danh\t\nLê Đức Duy\t\nLê Quốc Đại\t\nLê Võ Tấn Đạt\t\nLê Ngọc Hân\tx");
                        showToast("Đã chèn dữ liệu mẫu đúng chuẩn Excel!");
                      }}
                      className="text-[10px] text-amber-600 hover:underline font-extrabold"
                    >
                      Dùng danh sách mẫu thử
                    </button>
                    
                    <button
                      onClick={handleImportExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Nhập vào {selectedClass}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ====================================================================
            2. CHẾ ĐỘ 2: DANH SÁCH HỌC SINH MẶC ĐỊNH (INLINE VIEW 100% SPACIOUS)
            ==================================================================== */
        <div className="space-y-6 w-full">
          
          {/* Top Banner & Control Strip */}
          <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-left">
                <h2 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                  <span>🎓</span> SỔ TAY HỌC SINH LỚP {selectedClass}
                </h2>
                <p className="text-[11px] font-bold text-[#5c4327]">
                  Tổng số {classStudents.length} học sinh chính thức. Cho phép chỉnh sửa thông tin, ghi chú nhanh và xem thẻ ID Card.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-emerald-500 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm học sinh</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-[#fffbf0] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo Tên hoặc Mã..."
                  className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium shadow-3xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Hiển thị:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value) as 10 | 20 | 50);
                    setCurrentPage(1);
                  }}
                  className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white font-extrabold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value={10}>10 dòng / trang</option>
                  <option value={20}>20 dòng / trang</option>
                  <option value={50}>50 dòng / trang</option>
                </select>
              </div>
            </div>
          </div>

          {/* MAIN STUDENTS LIST TABLE (100% FULL WIDTH) */}
          <div className="w-full border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-left">
                <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <span>📋</span>
                  DANH SÁCH HỌC SINH CHÍNH THỨC • LỚP {selectedClass} ({filteredStudents.length} EM)
                </h3>
              </div>
              <span className="text-xs font-black bg-white/90 text-emerald-900 px-3 py-1 rounded-xl border border-[#cbb89d] shadow-2xs">
                Trang {currentPage} / {totalPages}
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-[#fffbf0] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#e8d7c0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4 w-12 whitespace-nowrap">STT</th>
                    <th className="py-3 px-4 w-28 whitespace-nowrap">Mã HS</th>
                    <th className="py-3 px-4 w-60 whitespace-nowrap">Họ và Tên</th>
                    <th className="py-3 px-4 w-24 whitespace-nowrap">Giới tính</th>
                    <th className="py-3 px-4 whitespace-nowrap">Ghi chú</th>
                    <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Chỉnh sửa</th>
                    <th className="py-3 px-4 text-center w-16 whitespace-nowrap">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((s, idx) => {
                    const isEditing = editingStudentId === s.id;
                    const isHighlighted = highlightedStudentId === s.id;
                    const stt = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr
                        id={`student-row-${s.id}`}
                        key={s.id}
                        className={`transition-all duration-500 ${
                          isHighlighted
                            ? 'bg-amber-100 ring-2 ring-amber-500 font-extrabold shadow-md'
                            : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-400">{stt}</td>
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-700 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-600">{s.code}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs font-extrabold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          ) : (() => {
                            const nameMatch = s.name.match(/^(.*?)\s*(\(\d+\))$/);
                            return (
                              <span className="font-extrabold text-slate-800 whitespace-nowrap flex items-center gap-1">
                                {nameMatch ? (
                                  <>
                                    <span>{nameMatch[1]}</span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300/80 font-black text-[10px]" title="Biệt danh phân biệt trùng tên">
                                      {nameMatch[2]}
                                    </span>
                                  </>
                                ) : (
                                  <span>{s.name}</span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <select
                              value={editGender}
                              onChange={(e) => setEditGender(e.target.value as 'Nam' | 'Nữ')}
                              className="border border-amber-300 rounded-lg px-2 py-1.5 text-xs bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            >
                              <option value="Nam">Nam 👦🏻</option>
                              <option value="Nữ">Nữ 👧🏻</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${s.gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                              {s.gender === 'Nữ' ? 'Nữ 👧🏻' : 'Nam 👦🏻'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Nhập ghi chú học sinh..."
                              className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                            />
                          ) : (
                            <NoteInput
                              studentId={s.id}
                              initialValue={s.notes || ''}
                              onSave={handleSaveNote}
                            />
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(s.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1.5 rounded-lg transition shadow-sm flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                                title="Lưu"
                              >
                                <Check className="w-3 h-3" /> Lưu
                              </button>
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2 py-1.5 rounded-lg transition flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3 h-3" /> Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedCardStudent(s)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Xem Thẻ ID Card Học Sinh"
                              >
                                <IdCard className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(s)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setStudentToDelete({ id: s.id, name: s.name })}
                            className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                        Không tìm thấy học sinh nào trong lớp {selectedClass}!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#fffbf0] border-t border-[#cbb89d] flex items-center justify-center gap-1 text-xs select-none">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed font-bold transition cursor-pointer flex items-center"
                >
                  ‹ Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl font-extrabold transition cursor-pointer flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed font-bold transition cursor-pointer flex items-center"
                >
                  Sau ›
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* STUDENT ID CARD PREVIEW MODAL */}
      {selectedCardStudent && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCardStudent(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center relative animate-in fade-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCardStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition z-20 cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">📇 Thẻ Học Sinh Độc Quyền</span>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Hồ Sơ ID Card Học Sinh</h3>
            </div>

            <div className="py-2">
              <StudentCard3D
                student={selectedCardStudent}
                classStudents={classStudents}
                machineName="Chưa xếp máy"
                starCount={0}
                size="md"
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedCardStudent(null)}
              className="btn-3d btn-3d-slate w-full py-2.5 text-xs font-black uppercase tracking-wider"
            >
              Đóng Cửa Sổ Thẻ
            </button>
          </div>
        </div>
      )}

      {/* STUDENT DELETE CONFIRMATION DIALOG MODAL */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-650 border-b border-slate-100 pb-3 text-left">
              <div className="p-2 bg-red-50 rounded-full text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Xác nhận xóa học sinh</h4>
                <p className="text-[10px] text-slate-400 font-medium">Hành động này có thể xóa mất dữ liệu học sinh</p>
              </div>
            </div>
            
            <div className="py-4 text-left">
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa học sinh <strong className="text-red-600 font-extrabold">"{studentToDelete.name}"</strong> khỏi cơ sở dữ liệu lớp học? Hồ sơ thi đua, số sao tích luỹ và quà đã đổi của học sinh này sẽ bị gỡ hoàn toàn.
              </p>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleDeleteStudent(studentToDelete.id, studentToDelete.name);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
