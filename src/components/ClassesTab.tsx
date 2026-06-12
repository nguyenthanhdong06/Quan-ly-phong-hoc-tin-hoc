import React, { useState, useMemo } from 'react';
import { Grade, ClassItem, Student } from '../types';
import { Plus, Edit2, Trash2, FolderPlus, HelpCircle, Layers, Users, BookOpen, AlertCircle } from 'lucide-react';

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
  // States for Grades Management
  const [newGradeId, setNewGradeId] = useState<number | ''>('');
  const [newGradeName, setNewGradeName] = useState('');
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  // States for Classes Management
  const [classIdInput, setClassIdInput] = useState('');
  const [classNameInput, setClassNameInput] = useState('');
  const [classGradeIdInput, setClassGradeIdInput] = useState<number | ''>('');
  const [classTeacherInput, setClassTeacherInput] = useState('');
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Cascade delete control modal/state
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [moveTargetClassId, setMoveTargetClassId] = useState('');

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

  const handleDeleteGrade = (gradeId: number, gradeName: string) => {
    // Check if any class is in this grade
    const relativeClasses = classes.filter(c => c.gradeId === gradeId);
    if (relativeClasses.length > 0) {
      showToast(`Không thể xóa ${gradeName} vì còn ${relativeClasses.length} lớp học đang trực thuộc!`, 'error');
      return;
    }

    setGrades(prev => prev.filter(g => g.id !== gradeId));
    showToast(`Đã xóa ${gradeName} thành công.`);
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

    const newC: ClassItem = {
      id: classIdClean,
      name: classNameInput.trim(),
      gradeId: Number(classGradeIdInput),
      teacher: classTeacherInput.trim()
    };

    setClasses(prev => [...prev, newC]);
    setClassIdInput('');
    setClassNameInput('');
    setClassGradeIdInput('');
    setClassTeacherInput('');
    showToast(`Đã thêm lớp ${newC.name} thành công!`);
  };

  const handleStartEditClass = (c: ClassItem) => {
    setEditingClass({ ...c });
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.name.trim() || !editingClass.teacher.trim()) {
      showToast('Họ tên giáo viên và tên lớp không được để trống!', 'error');
      return;
    }

    setClasses(prev => prev.map(c => c.id === editingClass.id ? editingClass : c));
    showToast(`Cập nhật thông tin lớp ${editingClass.name} thành công.`);
    setEditingClass(null);
  };

  // Cascade Delete class flow
  const handlePreDeleteClass = (c: ClassItem) => {
    const classSts = students.filter(s => s.classId === c.id);
    if (classSts.length === 0) {
      // No students, can delete safely
      setClasses(prev => prev.filter(cls => cls.id !== c.id));
      showToast(`Đã xóa lớp trống ${c.name} thành công.`);
    } else {
      // Has students, trigger custom modal to process students
      setClassToDelete(c);
      // Select first available class of the same Grade as move target
      const targetOpt = classes.find(opt => opt.gradeId === c.gradeId && opt.id !== c.id);
      setMoveTargetClassId(targetOpt ? targetOpt.id : '');
    }
  };

  const handleConfirmDeleteClassCascade = (actionMode: 'delete' | 'move') => {
    if (!classToDelete) return;

    if (actionMode === 'delete') {
      // Delete students and the class
      setStudents(prev => prev.filter(s => s.classId !== classToDelete.id));
      setClasses(prev => prev.filter(cls => cls.id !== classToDelete.id));
      showToast(`Đã xóa lớp ${classToDelete.name} và tất cả các học sinh trực thuộc.`);
    } else {
      // Move students to target class, then delete class
      if (!moveTargetClassId) {
        showToast('Vui lòng chọn lớp đích để di dời học sinh!', 'error');
        return;
      }
      setStudents(prev => prev.map(s => s.classId === classToDelete.id ? { ...s, classId: moveTargetClassId } : s));
      setClasses(prev => prev.filter(cls => cls.id !== classToDelete.id));
      const targetClassName = classes.find(c => c.id === moveTargetClassId)?.name || moveTargetClassId;
      showToast(`Đã di chuyển học sinh lớp ${classToDelete.name} sang lớp ${targetClassName} và xóa lớp gốc.`);
    }

    setClassToDelete(null);
    setMoveTargetClassId('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Layers className="text-amber-500 w-6 h-6" />
          QUẢN LÝ KHỐI LỚP & LỚP HỌC
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Hệ thống cấu hình danh mục Khối và Lớp của Trường tiểu học. Cho phép Thêm, Sửa thông tin và Xóa an toàn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ================= COL 1: KHỐI LỚP ================= */}
        <div className="space-y-6">
          
          {/* Add Grade Form */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-500" />
              Thêm Khối học mới
            </h3>
            
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg transition"
              >
                + Thêm khối mới
              </button>
            </form>
          </div>

          {/* Grades List Table */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2">
              Danh sách các Khối ({grades.length})
            </h3>

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

            <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-xl p-2 border">
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
                        className="p-1 text-slate-500 hover:text-amber-600 hover:bg-white rounded transition"
                        title="Sửa tên khối"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGrade(g.id, g.name)}
                        className="p-1 text-slate-500 hover:text-red-500 hover:bg-white rounded transition"
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

        {/* ================= COL 2 & 3: LỚP HỌC ================= */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Form Thêm Lớp */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 md:col-span-1">
              <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Thêm Lớp học mới
              </h3>

              <form onSubmit={handleAddClass} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Mã Lớp (Dùng trong hệ thống)</label>
                  <input
                    type="text"
                    value={classIdInput}
                    onChange={(e) => setClassIdInput(e.target.value)}
                    placeholder="Ví dụ: 3C, 3D, Ba 3..."
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tên Hiển Thị của Lớp</label>
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
                  <label className="block text-xs font-bold text-slate-500 mb-1">Giáo viên phụ trách dạy</label>
                  <input
                    type="text"
                    value={classTeacherInput}
                    onChange={(e) => setClassTeacherInput(e.target.value)}
                    placeholder="Ví dụ: Thầy Thanh Đồng"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-lg transition"
                >
                  + Thêm Lớp học
                </button>
              </form>
            </div>

            {/* Danh sách Lớp */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 md:col-span-2">
              <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
                <span>Danh mục Lớp học ({classes.length})</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Realtime Monitor</span>
              </h3>

              {/* Editing Class Area inline top */}
              {editingClass && (
                <form onSubmit={handleUpdateClass} className="p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-3">
                  <span className="text-xs font-black text-orange-850 block uppercase">ĐANG EDIT LỚP: {editingClass.id}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Giáo viên</label>
                      <input
                        type="text"
                        value={editingClass.teacher}
                        onChange={(e) => setEditingClass({ ...editingClass, teacher: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                        required
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classes.map(c => {
                  const classStsCount = students.filter(s => s.classId === c.id).length;
                  const gradeObj = grades.find(g => g.id === c.gradeId);
                  
                  return (
                    <div
                      key={c.id} 
                      className="p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col justify-between hover:border-amber-200 gap-3"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                            {gradeObj ? gradeObj.name : `Khối ${c.gradeId}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                        </div>
                        <h4 className="font-extrabold text-base text-slate-800 mt-1.5">{c.name}</h4>
                        <div className="mt-2 space-y-1 text-xs text-slate-500 font-medium">
                          <p>Chủ nhiệm: <strong className="text-slate-700">{c.teacher}</strong></p>
                          <p className="text-emerald-700">Sỹ số hiện thời: <strong>{classStsCount} học sinh</strong></p>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-slate-200/50 pt-2 justify-end">
                        <button
                          onClick={() => handleStartEditClass(c)}
                          className="text-xs font-bold text-slate-600 hover:text-amber-600 flex items-center gap-1 hover:bg-white px-2 py-1.5 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </button>
                        <button
                          onClick={() => handlePreDeleteClass(c)}
                          className="text-xs font-bold text-slate-600 hover:text-red-500 flex items-center gap-1 hover:bg-white px-2 py-1.5 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}

                {classes.length === 0 && (
                  <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                    Chưa có bất kỳ lớp học nào tồn tại! Vui lòng tạo lớp học đầu tiên.
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* CASCADE DELETE MODAL / DANGEROUS ACTION CONTAINER */}
      {classToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-red-100 transform transition-all animate-fadeIn">
            
            <div className="bg-red-500 p-4 text-white flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl text-white">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase">Cảnh báo: Xóa Lớp học đang có dữ liệu!</h3>
                <p className="text-xs text-red-100">
                  Lớp "{classToDelete.name}" đang có <strong>{students.filter(s => s.classId === classToDelete.id).length} học sinh</strong> trong danh sách.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Để bảo vệ an toàn toàn vẹn cơ sở dữ liệu và tránh mất mát thông tin học sinh không mong muốn, vui lòng chọn 1 trong 2 phương pháp xử lý sau:
              </p>

              <div className="space-y-3">
                
                {/* Method 1: Move students */}
                <div className="border border-slate-200 rounded-2xl p-4 hover:border-amber-500 hover:bg-amber-50/20 transition-all">
                  <h4 className="text-xs font-black text-slate-800">Phương án A: Di dời học sinh sang Lớp học khác</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hệ thống sẽ cập nhật lại toàn bộ mã lớp cho các em rồi tiến hành xóa lớp an toàn.</p>
                  
                  <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Chọn lớp nhận học sinh:</span>
                    <select
                      value={moveTargetClassId}
                      onChange={(e) => setMoveTargetClassId(e.target.value)}
                      className="bg-white text-xs text-slate-700 font-bold border border-slate-300 rounded-lg p-2 w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- Chọn lớp đích trong hệ thống --</option>
                      {classes
                        .filter(opt => opt.id !== classToDelete.id)
                        .map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name} ({opt.teacher})</option>
                        ))}
                    </select>
                  </div>
                  
                  <button
                    disabled={!moveTargetClassId}
                    onClick={() => handleConfirmDeleteClassCascade('move')}
                    className="mt-3 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                  >
                    Thực hiện di chuyển và xóa lớp
                  </button>
                </div>

                {/* Method 2: Delete completely */}
                <div className="border border-red-100 rounded-2xl p-4 hover:border-red-500 hover:bg-red-50/20 transition-all">
                  <h4 className="text-xs font-black text-red-600">Phương án B: Xóa TOÀN BỘ học sinh ra khỏi trường (Nguy hiểm!)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Xóa vĩnh viễn cả lớp học và toàn bộ thông tin học sinh thuộc lớp học này ra khỏi hệ thống.</p>
                  
                  <button
                    onClick={() => handleConfirmDeleteClassCascade('delete')}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition w-full sm:w-auto"
                  >
                    Xác nhận xóa xóa sạch
                  </button>
                </div>

              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs">
                <button
                  onClick={() => {
                    setClassToDelete(null);
                    setMoveTargetClassId('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl block"
                >
                  Xác nhận hủy
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
