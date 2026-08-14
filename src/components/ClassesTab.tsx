import React, { useState, useMemo } from 'react';
import { Grade, ClassItem, Student } from '../types';
import { Plus, Edit2, Trash2, FolderPlus, HelpCircle, Layers, Users, BookOpen, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

interface ClassesTabProps {
  grades: Grade[];
  setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
  classes: ClassItem[];
  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function ClassesTab({
  grades,
  setGrades,
  classes,
  setClasses,
  students,
  setStudents,
  showToast
}: ClassesTabProps) {
  // ➕ State cho chế độ 100% Inline View "Thêm khối, lớp"
  const [isAddGradeClassInlineView, setIsAddGradeClassInlineView] = useState(false);

  // States for Grades Management
  const [newGradeId, setNewGradeId] = useState<number | ''>('');
  const [newGradeName, setNewGradeName] = useState('');
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  // States for Classes Management
  const [classIdInput, setClassIdInput] = useState('');
  const [classNameInput, setClassNameInput] = useState('');
  const [classGradeIdInput, setClassGradeIdInput] = useState<number | ''>('');
  const [classTeacherInput, setClassTeacherInput] = useState('');
  const [classTeacherPhoneInput, setClassTeacherPhoneInput] = useState('');
  const [classSubjectTeacherInput, setClassSubjectTeacherInput] = useState('');
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Cascade delete control modal/state
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [moveTargetClassId, setMoveTargetClassId] = useState('');

  // Grade delete state control
  const [gradeToDelete, setGradeToDelete] = useState<{ id: number; name: string } | null>(null);

  // Collapse state for each grade
  const [collapsedGrades, setCollapsedGrades] = useState<{ [key: number]: boolean }>({});

  const toggleGradeCollapse = (gradeId: number) => {
    setCollapsedGrades(prev => {
      const isCurrentlyCollapsed = prev[gradeId] !== false;
      return {
        ...prev,
        [gradeId]: !isCurrentlyCollapsed
      };
    });
  };

  // --- LOGIC: KHỐI LỚP (GRADE) ---
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeId || !newGradeName.trim()) {
      showToast('Vui lòng nhập đầy đủ mã khối và tên khối!', 'error');
      return;
    }

    const idNum = Number(newGradeId);
    if (isNaN(idNum) || idNum <= 0) {
      showToast('Mã khối phải là số nguyên dương!', 'error');
      return;
    }

    if (grades.some(g => g.id === idNum)) {
      showToast(`Mã khối ${idNum} đã tồn tại!`, 'error');
      return;
    }

    const newG: Grade = { id: idNum, name: newGradeName.trim() };
    setGrades(prev => [...prev, newG].sort((a, b) => a.id - b.id));
    setNewGradeId('');
    setNewGradeName('');
    showToast(`Đã thêm ${newG.name} thành công!`);
  };

  const handleStartEditGrade = (g: Grade) => {
    setEditingGrade(g);
  };

  const handleUpdateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !editingGrade.name.trim()) return;

    setGrades(prev => prev.map(g => g.id === editingGrade.id ? editingGrade : g));
    showToast(`Cập nhật thành công tên khối: ${editingGrade.name}`);
    setEditingGrade(null);
  };

  const handlePreDeleteGrade = (gradeId: number, gradeName: string) => {
    const relativeClasses = classes.filter(c => c.gradeId === gradeId);
    if (relativeClasses.length > 0) {
      showToast(`Không thể xóa ${gradeName} vì còn ${relativeClasses.length} lớp học đang trực thuộc!`, 'error');
      return;
    }
    setGradeToDelete({ id: gradeId, name: gradeName });
  };

  const handleDeleteGrade = (gradeId: number) => {
    setGrades(prev => prev.filter(g => g.id !== gradeId));
    showToast(`Đã xóa Khối học thành công.`);
  };

  // --- LOGIC: LỚP HỌC (CLASS) ---
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classIdInput.trim() || !classNameInput.trim() || !classGradeIdInput || !classTeacherInput.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin của lớp học!', 'error');
      return;
    }

    const classIdClean = classIdInput.trim();
    if (classes.some(c => c.id.toLowerCase() === classIdClean.toLowerCase())) {
      showToast(`Mã lớp "${classIdClean}" đã tồn tại! Vui lòng chọn mã khác.`, 'error');
      return;
    }

    const phoneClean = classTeacherPhoneInput.trim().replace(/\D/g, '');
    if (classTeacherPhoneInput.trim() && phoneClean.length !== 10) {
      showToast(`⚠️ SĐT Zalo GVCN không hợp lệ! Số điện thoại Zalo hợp lệ phải gồm đúng 10 chữ số (Thầy/Cô đang gõ ${phoneClean.length} số).`, 'error');
      return;
    }

    const newC: ClassItem = {
      id: classIdClean,
      name: classNameInput.trim(),
      gradeId: Number(classGradeIdInput),
      teacher: classTeacherInput.trim(),
      teacherPhone: classTeacherPhoneInput.trim(),
      subjectTeacher: classSubjectTeacherInput.trim()
    };

    setClasses(prev => [...prev, newC]);
    setClassIdInput('');
    setClassNameInput('');
    setClassGradeIdInput('');
    setClassTeacherInput('');
    setClassTeacherPhoneInput('');
    setClassSubjectTeacherInput('');
    showToast(`Đã thêm lớp ${newC.name} thành công!`);
  };

  const handleStartEditClass = (c: ClassItem) => {
    setEditingClass(c);
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    if (!editingClass.name.trim() || !editingClass.teacher.trim()) {
      showToast('Tên lớp và tên Giáo viên chủ nhiệm không được để trống!', 'error');
      return;
    }

    const phoneClean = (editingClass.teacherPhone || '').trim().replace(/\D/g, '');
    if (editingClass.teacherPhone && editingClass.teacherPhone.trim() && phoneClean.length !== 10) {
      showToast(`⚠️ SĐT Zalo GVCN không hợp lệ! Số điện thoại Zalo hợp lệ phải gồm đúng 10 chữ số (Thầy/Cô đang gõ ${phoneClean.length} số).`, 'error');
      return;
    }

    setClasses(prev => prev.map(c => c.id === editingClass.id ? {
      ...editingClass,
      name: editingClass.name.trim(),
      teacher: editingClass.teacher.trim(),
      teacherPhone: editingClass.teacherPhone ? editingClass.teacherPhone.trim() : '',
      subjectTeacher: editingClass.subjectTeacher ? editingClass.subjectTeacher.trim() : ''
    } : c));
    showToast(`Đã cập nhật thông tin lớp ${editingClass.name} thành công!`);
    setEditingClass(null);
  };

  const handlePreDeleteClass = (c: ClassItem) => {
    const classSts = students.filter(s => s.classId === c.id);
    if (classSts.length === 0) {
      if (window.confirm(`Xác nhận xóa lớp ${c.name}? Lớp này hiện không có học sinh nào.`)) {
        setClasses(prev => prev.filter(item => item.id !== c.id));
        showToast(`Đã xóa lớp ${c.name}`);
      }
    } else {
      const otherClasses = classes.filter(item => item.id !== c.id);
      if (otherClasses.length === 0) {
        showToast(`Không thể xóa lớp ${c.name} vì đang chứa ${classSts.length} học sinh và hệ thống không còn lớp nào khác để chuyển!`, 'error');
        return;
      }
      setClassToDelete(c);
      setMoveTargetClassId(otherClasses[0].id);
    }
  };

  const handleConfirmDeleteClassAndMoveStudents = () => {
    if (!classToDelete || !moveTargetClassId) return;

    const classSts = students.filter(s => s.classId === classToDelete.id);
    setStudents(prev => prev.map(s => s.classId === classToDelete.id ? { ...s, classId: moveTargetClassId } : s));
    setClasses(prev => prev.filter(c => c.id !== classToDelete.id));

    const targetClassName = classes.find(c => c.id === moveTargetClassId)?.name || moveTargetClassId;
    showToast(`Đã di chuyển học sinh lớp ${classToDelete.name} sang lớp ${targetClassName} và xóa lớp gốc.`);

    setClassToDelete(null);
    setMoveTargetClassId('');
  };

  return (
    <div className="space-y-6">

      {/* ====================================================================
          1. CHẾ ĐỘ 1: CỬA SỔ THÊM KHỐI, LỚP HỌC MỚI (INLINE VIEW 100%)
          ==================================================================== */}
      {isAddGradeClassInlineView ? (
        <div className="space-y-6 animate-fadeIn w-full">
          {/* Top Navigation Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffbf0] border border-[#cbb89d] p-4 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setIsAddGradeClassInlineView(false)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl border border-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-200" />
              <span>Quay Về Danh Mục Lớp Học</span>
            </button>

            <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
              <span>⚙️</span> CHỨC NĂNG THÊM KHỐI, LỚP HỌC MỚI
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* BẢNG 1: THÊM LỚP HỌC MỚI */}
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex justify-between items-center text-left">
                <h4 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  THÊM LỚP HỌC MỚI
                </h4>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-4">
                <form onSubmit={handleAddClass} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã Lớp (Dùng trong hệ thống)</label>
                    <input
                      type="text"
                      value={classIdInput}
                      onChange={(e) => setClassIdInput(e.target.value)}
                      placeholder="Ví dụ: Ba 3..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tên lớp hiển thị chính thức</label>
                    <input
                      type="text"
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      placeholder="Ví dụ: Lớp Ba 3..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mục Khối học trực thuộc</label>
                    <select
                      value={classGradeIdInput}
                      onChange={(e) => setClassGradeIdInput(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700"
                      required
                    >
                      <option value="">-- Chọn Khối --</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Giáo viên chủ nhiệm</label>
                    <input
                      type="text"
                      value={classTeacherInput}
                      onChange={(e) => setClassTeacherInput(e.target.value)}
                      placeholder="Ví dụ: Thầy Nguyễn Thanh Đồng..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>SĐT Zalo GVCN</span>
                      {classTeacherPhoneInput.trim() && (
                        <span className={`text-[10px] font-extrabold ${classTeacherPhoneInput.trim().replace(/\D/g, '').length === 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {classTeacherPhoneInput.trim().replace(/\D/g, '').length === 10 ? '✓ Hợp lệ (10 số)' : `⚠️ ${classTeacherPhoneInput.trim().replace(/\D/g, '').length}/10 số`}
                        </span>
                      )}
                    </label>
                    <input
                      type="tel"
                      value={classTeacherPhoneInput}
                      onChange={(e) => setClassTeacherPhoneInput(e.target.value)}
                      placeholder="Ví dụ: 0912345678..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      💡 Nhập đúng 10 chữ số để tự động mở Zalo chat với GVCN khi báo cáo.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Giáo viên bộ môn phụ trách</label>
                    <input
                      type="text"
                      value={classSubjectTeacherInput}
                      onChange={(e) => setClassSubjectTeacherInput(e.target.value)}
                      placeholder="Ví dụ: Thầy Thanh Đồng (Tin học), Cô Thu Trang (Anh văn)..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    + Thêm Lớp học
                  </button>
                </form>
              </div>
            </div>

            {/* BẢNG 2: THÊM KHỐI HỌC MỚI */}
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex justify-between items-center text-left">
                <h4 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-amber-700" />
                  THÊM KHỐI HỌC MỚI
                </h4>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-4">
                <form onSubmit={handleAddGrade} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã số Khối (Số nguyên)</label>
                    <input
                      type="number"
                      value={newGradeId}
                      onChange={(e) => setNewGradeId(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ví dụ: 3 hoặc 4..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tên hiển thị Khối</label>
                    <input
                      type="text"
                      value={newGradeName}
                      onChange={(e) => setNewGradeName(e.target.value)}
                      placeholder="Ví dụ: Khối lớp 3..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    + Thêm khối mới
                  </button>
                </form>
              </div>
            </div>

            {/* BẢNG 3: DANH SÁCH CÁC KHỐI */}
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex justify-between items-center text-left">
                <h4 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-700" />
                  DANH SÁCH CÁC KHỐI ({grades.length})
                </h4>
              </div>

              <div className="p-4 sm:p-5 bg-white space-y-3">
                {editingGrade && (
                  <form onSubmit={handleUpdateGrade} className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                    <p className="text-[10px] font-black text-amber-800 uppercase">Đang sửa mã khối: {editingGrade.id}</p>
                    <input
                      type="text"
                      value={editingGrade.name}
                      onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                      placeholder="Tên khối..."
                      className="w-full text-xs border border-amber-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingGrade(null)}
                        className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="text-[10px] bg-amber-600 text-white px-2 py-1 rounded font-bold"
                      >
                        Lưu
                      </button>
                    </div>
                  </form>
                )}

                <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-xl p-2 border border-slate-200">
                  {grades.map(g => {
                    const classCount = classes.filter(c => c.gradeId === g.id).length;
                    return (
                      <div key={g.id} className="py-2.5 px-2 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5">
                            Mã {g.id}
                          </span>
                          <strong className="text-slate-800">{g.name}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">({classCount} lớp thuộc trực thuộc)</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleStartEditGrade(g)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-white rounded transition cursor-pointer"
                            title="Sửa tên khối"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePreDeleteGrade(g.id, g.name)}
                            className="p-1 text-slate-500 hover:text-red-500 hover:bg-white rounded transition cursor-pointer"
                            title="Xóa khối lớp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ====================================================================
            2. CHẾ ĐỘ 2: DANH MỤC LỚP HỌC MẶC ĐỊNH (INLINE VIEW 100% SPACIOUS)
            ==================================================================== */
        <div className="space-y-6 w-full">
          
          {/* 🌟 BANNER CẤU TRÚC ĐỒNG BỘ NỀN KEM NGÀ GIỐNG VƯỜN TRI THỨC */}
          <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-left">
                <h2 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                  <span>🏫</span> QUẢN LÝ KHỐI LỚP & LỚP HỌC
                </h2>
                <p className="text-[11px] font-bold text-[#5c4327] mt-1">
                  Hệ thống cấu hình danh mục Khối và Lớp của Trường tiểu học. Cho phép Thêm, Sửa thông tin và Xóa an toàn.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGradeClassInlineView(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-emerald-500 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Mở giao diện xem 100% thêm khối, lớp học mới"
                >
                  <span>➕</span> Thêm khối, lớp
                </button>
                <span className="text-xs font-black bg-white/90 text-emerald-900 px-3.5 py-1.5 rounded-xl border border-[#cbb89d] shadow-2xs">
                  Tổng số: {classes.length} Lớp / {grades.length} Khối
                </span>
              </div>
            </div>
          </div>

          {/* 🌟 100% FULL WIDTH DANH MỤC LỚP HỌC TABLE */}
          <div className="w-full border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
            
            {/* Header Structure matching DANH SÁCH HỌC SINH */}
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-left">
                <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                  <span>🏫</span>
                  DANH MỤC LỚP HỌC CHÍNH THỨC • TỔNG SỐ {classes.length} LỚP HỌC
                </h3>
                <p className="text-[11px] font-bold text-[#5c4327]">
                  Danh sách phân bổ các lớp theo từng khối học. Bấm Hiện lớp / Ẩn bớt để quan sát thông tin chi tiết.
                </p>
              </div>
              
              <span className="text-xs font-black bg-white/90 text-emerald-900 px-3 py-1 rounded-xl border border-[#cbb89d] shadow-2xs">
                Realtime Monitor
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-[#fffbf0] space-y-4">
              {/* Editing Class Area inline top */}
              {editingClass && (
                <form onSubmit={handleUpdateClass} className="p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-3">
                  <span className="text-xs font-black text-orange-850 block uppercase">ĐANG EDIT LỚP: {editingClass.id}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Tên lớp hiển thị</label>
                      <input
                        type="text"
                        value={editingClass.name}
                        onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Giáo viên chủ nhiệm</label>
                      <input
                        type="text"
                        value={editingClass.teacher}
                        onChange={(e) => setEditingClass({ ...editingClass, teacher: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 flex justify-between items-center">
                        <span>SĐT Zalo GVCN</span>
                        {editingClass.teacherPhone && editingClass.teacherPhone.trim() && (
                          <span className={`text-[9px] font-extrabold ${editingClass.teacherPhone.trim().replace(/\D/g, '').length === 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {editingClass.teacherPhone.trim().replace(/\D/g, '').length === 10 ? '✓ Đủ 10 số' : `⚠️ ${editingClass.teacherPhone.trim().replace(/\D/g, '').length}/10 số`}
                          </span>
                        )}
                      </label>
                      <input
                        type="tel"
                        value={editingClass.teacherPhone || ''}
                        onChange={(e) => setEditingClass({ ...editingClass, teacherPhone: e.target.value })}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">GV Bộ môn phụ trách</label>
                      <input
                        type="text"
                        value={editingClass.subjectTeacher || ''}
                        onChange={(e) => setEditingClass({ ...editingClass, subjectTeacher: e.target.value })}
                        placeholder="Ví dụ: Tin học..."
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Khối trực thuộc</label>
                      <select
                        value={editingClass.gradeId}
                        onChange={(e) => setEditingClass({ ...editingClass, gradeId: Number(e.target.value) })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingClass(null)}
                      className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-6">
                {(() => {
                  const gradeMap: { [key: number]: string } = {
                    1: 'border-blue-500 text-blue-700 bg-blue-50/50 hover:border-blue-400',
                    2: 'border-pink-500 text-pink-700 bg-pink-50/50 hover:border-pink-400',
                    3: 'border-amber-500 text-amber-700 bg-amber-50/50 hover:border-amber-400',
                    4: 'border-indigo-500 text-indigo-700 bg-indigo-50/50 hover:border-indigo-400',
                    5: 'border-emerald-500 text-emerald-700 bg-emerald-50/50 hover:border-emerald-400',
                  };

                  return (
                    <>
                      {/* Lặp qua các khối lớp đã có và sắp xếp khối học theo Grade ID */}
                      {grades.map(grade => {
                        const gradeClasses = classes
                          .filter(c => c.gradeId === grade.id)
                          .sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' }));

                        if (gradeClasses.length === 0) return null;

                        const isCollapsed = collapsedGrades[grade.id] !== false;
                        const customStyle = gradeMap[grade.id] || 'border-slate-500 text-slate-700 bg-slate-50/50 hover:border-slate-400';

                        return (
                          <div 
                            key={grade.id} 
                            className={`bg-white p-4 rounded-2xl border border-[#cbb89d] shadow-xs transition-all duration-200 ${
                              isCollapsed ? 'space-y-0' : 'space-y-4'
                            }`}
                          >
                            {/* Tiêu đề Khối */}
                            <div 
                              onClick={() => toggleGradeCollapse(grade.id)}
                              className={`flex items-center justify-between cursor-pointer select-none transition-colors duration-150 p-1 -m-1 rounded-xl hover:bg-slate-100/50 ${
                                isCollapsed ? '' : 'border-b border-slate-200 pb-2'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                                  🏫 {grade.name}
                                </span>
                                <span className="text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200 uppercase px-2.5 py-0.5 rounded-full">
                                  {gradeClasses.length} lớp học
                                </span>
                              </div>
                              <button
                                type="button"
                                className="text-[10px] font-extrabold text-slate-500 hover:text-amber-600 flex items-center gap-1 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 hover:border-amber-200 transition-all shadow-3xs cursor-pointer"
                              >
                                {isCollapsed ? (
                                  <>
                                    <span>Hiện lớp</span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  </>
                                ) : (
                                  <>
                                    <span>Ẩn bớt</span>
                                    <ChevronUp className="w-3 h-3 text-slate-400" />
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Grid các lớp học thuộc khối học */}
                            {!isCollapsed && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
                                {gradeClasses.map(c => {
                                  const classSts = students.filter(s => s.classId === c.id);
                                  const classStsCount = classSts.length;
                                  const femaleCount = classSts.filter(s => s.gender === 'Nữ').length;
                                  
                                  return (
                                    <div
                                      key={c.id} 
                                      className={`p-4 border-l-4 rounded-2xl bg-white shadow-xs transition-all flex flex-col justify-between gap-3 ${customStyle} border-y border-r border-slate-150`}
                                    >
                                      <div>
                                        <div className="flex justify-between items-start">
                                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-extrabold uppercase">
                                            {grade.name}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono font-bold">MÃ LỚP: {c.id}</span>
                                        </div>
                                        
                                        <h4 className="font-black text-slate-800 text-base mt-2.5 flex items-center gap-1">
                                          🏫 {c.name}
                                        </h4>
                                        
                                        <div className="mt-2.5 space-y-1.5 text-xs text-slate-500 font-semibold text-left">
                                          <p className="flex items-center gap-1 text-slate-600">
                                            👤 Chủ nhiệm: <strong className="text-slate-800 font-extrabold">{c.teacher}</strong>
                                          </p>
                                          <p className="flex items-center gap-1 text-sky-700">
                                            📱 SĐT Zalo: <strong className="text-sky-900 font-extrabold">{c.teacherPhone || 'Chưa có'}</strong>
                                          </p>
                                          <p className="flex items-center gap-1 text-indigo-700">
                                            🎓 GV Bộ môn: <strong className="text-indigo-900 font-extrabold">{c.subjectTeacher || 'Chưa phân công'}</strong>
                                          </p>
                                          <p className="flex items-center gap-1 text-emerald-700">
                                            📊 Sĩ số: <strong className="text-emerald-800 font-black">{classStsCount} học sinh/ {femaleCount} Nữ</strong>
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex gap-2 border-t border-slate-100 pt-2.5 justify-end">
                                        <button
                                          onClick={() => handleStartEditClass(c)}
                                          className="text-[11px] font-black text-slate-600 hover:text-amber-600 flex items-center gap-1 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                                        >
                                          <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Sửa
                                        </button>
                                        <button
                                          onClick={() => handlePreDeleteClass(c)}
                                          className="text-[11px] font-black text-slate-600 hover:text-rose-600 flex items-center gap-1 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xóa
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CASCADE DELETE CONFIRM MODAL FOR CLASS */}
      {classToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Cảnh báo xóa Lớp học</h4>
                <p className="text-[10px] text-slate-400 font-medium">Lớp đang chứa học sinh, cần di chuyển học sinh trước khi xóa</p>
              </div>
            </div>
            
            <div className="space-y-3 py-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Lớp <strong className="text-slate-800 font-black">"{classToDelete.name}"</strong> hiện đang có{' '}
                <strong className="text-rose-600 font-extrabold">{students.filter(s => s.classId === classToDelete.id).length} học sinh</strong>.
              </p>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Vui lòng chọn Lớp mới để di chuyển các học sinh này sang:
                </label>
                <select
                  value={moveTargetClassId}
                  onChange={(e) => setMoveTargetClassId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {classes
                    .filter(c => c.id !== classToDelete.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Khối {c.gradeId})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClassAndMoveStudents}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Chuyển học sinh & Xóa Lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL FOR GRADE */}
      {gradeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <AlertCircle className="w-6 h-6 shrink-0 text-red-500" />
              <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Xác nhận xóa Khối</h4>
                <p className="text-[10px] text-slate-400 font-medium">Hành động này có thể xóa mất dữ liệu Khối học</p>
              </div>
            </div>
            
            <div className="py-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa khối học <strong className="text-red-600 font-extrabold">"{gradeToDelete.name}"</strong>? Việc này chỉ có thể thực hiện khi không còn bất kỳ một lớp học nào trực thuộc khối học này nữa.
              </p>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setGradeToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleDeleteGrade(gradeToDelete.id);
                  setGradeToDelete(null);
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
