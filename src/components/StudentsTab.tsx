import React, { useState } from 'react';
import { Student } from '../types';
import { Trash2, UserPlus, FileSpreadsheet, Search, AlertCircle, Plus, Pencil, Check, X } from 'lucide-react';

interface StudentsTabProps {
  selectedClass: string;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

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

  // Multi-Student paste Excel box
  const [excelText, setExcelText] = useState('');

  // Editing a student row in-line
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'Nam' | 'Nữ'>('Nam');

  const handleStartEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditCode(student.code);
    setEditName(student.name);
    setEditGender(student.gender);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editCode.trim()) {
      showToast('Vui lòng không để trống mã học sinh hoặc họ tên!', 'error');
      return;
    }

    const codeClean = editCode.trim().toUpperCase();
    if (students.some(s => s.id !== id && s.code === codeClean)) {
      showToast(`Mã số học sinh ${codeClean} đã tồn tại ở học sinh khác!`, 'error');
      return;
    }

    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          code: codeClean,
          name: editName.trim(),
          gender: editGender
        };
      }
      return s;
    }));

    setEditingStudentId(null);
    showToast('Đã lưu thay đổi thông tin học sinh thành công!');
  };

  // Handle addition
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      showToast('Vui lòng nhập đầy đủ mã học sinh và họ tên!', 'error');
      return;
    }

    const codeClean = newCode.trim().toUpperCase();
    if (students.some(s => s.code === codeClean)) {
      showToast(`Mã số học sinh ${codeClean} đã tồn tại trong trường!`, 'error');
      return;
    }

    const item: Student = {
      id: `st-${Date.now()}`,
      code: codeClean,
      name: newName.trim(),
      gender: newGender,
      classId: selectedClass
    };

    setStudents(prev => [...prev, item]);
    setNewCode('');
    setNewName('');
    setNewGender('Nam');
    showToast(`Đã thêm học sinh ${item.name} vào lớp ${selectedClass}`);
  };

  // Handle upload paste from Excel
  const handleImportExcel = () => {
    if (!excelText.trim()) {
      showToast('Vui lòng dán dữ liệu cột học sinh Copy từ Excel!', 'error');
      return;
    }

    const lines = excelText.split('\n');
    let addedCount = 0;
    const newStudentsList: Student[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty rows

      const parts = trimmedLine.split('\t'); // Split tabs
      const rawName = parts[0] ? parts[0].trim() : '';

      // Skip table headers if pasted accidentally
      if (!rawName || rawName.toLowerCase() === 'họ và tên' || rawName.toLowerCase() === 'hoten') {
        return;
      }

      // Check if user specified gender in the second column tab-separated, else dynamic guessing/defaulting
      let gender: 'Nam' | 'Nữ' = 'Nam';
      if (parts[1]) {
        const rawGender = parts[1].trim().toLowerCase();
        if (rawGender.includes('nữ') || rawGender === 'nu' || rawGender === 'f') {
          gender = 'Nữ';
        }
      } else {
        // Simple Vietnamese gender guesser to look high-tech and natural:
        const lowerName = rawName.toLowerCase();
        if (lowerName.includes('thị') || lowerName.includes('vy') || lowerName.includes('lan') || lowerName.includes('hoa') || lowerName.includes('diệp') || lowerName.includes('trang') || lowerName.includes('nhung')) {
          gender = 'Nữ';
        }
      }

      const generatedCode = `HS${Math.floor(100 + Math.random() * 900)}`;

      newStudentsList.push({
        id: `st-ex-${Date.now()}-${index}`,
        code: generatedCode,
        name: rawName,
        gender,
        classId: selectedClass
      });
      addedCount++;
    });

    if (newStudentsList.length > 0) {
      setStudents(prev => [...prev, ...newStudentsList]);
      setExcelText('');
      showToast(`Tuyệt vời! Đã nạp thành công ${addedCount} học sinh mới trực tiếp vào lớp ${selectedClass}.`);
    } else {
      showToast('Không bóc tách được dòng học sinh hợp lệ. Vui lòng kiểm tra lại cấu trúc!', 'error');
    }
  };

  // Delete student
  const handleDeleteStudent = (id: string, name: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast(`Đã xóa học sinh ${name} khỏi lớp học.`);
  };

  // Filter students
  const classStudents = students.filter(s => s.classId === selectedClass);
  const femaleCount = classStudents.filter(s => s.gender === 'Nữ').length;
  const filteredStudents = classStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column forms */}
        <div className="space-y-6">
          
          {/* Paste Excel component */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Chuẩn hóa Nhập hàng loạt bằng Excel
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed text-left">
              Thầy cô sao chép cột <strong>Họ tên học sinh</strong> trong file Excel danh sách lớp, dán trực tiếp vào khung dưới và bấm Nhập là hoàn thành.
            </p>
            
            <div className="space-y-2.5">
              <textarea
                value={excelText}
                onChange={(e) => setExcelText(e.target.value)}
                placeholder="Dán dữ liệu từ file Excel tại đây...&#10;Ví dụ:&#10;Phan Văn Toàn&#10;Nguyễn Thị Bích Vy&#10;Lâm Chấn Huy"
                className="w-full text-xs border border-slate-200 rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-left"
              ></textarea>
              
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-dashed text-left">
                <button
                  type="button"
                  onClick={() => {
                    setExcelText("Bùi Chí Thắng\tNam\nNguyễn Minh Vy\tNữ\nLê Thùy Dung\tNữ\nPhan Hoàng Minh\tNam");
                    showToast("Đã chèn mẫu thử danh mục từ Excel!");
                  }}
                  className="text-[10px] text-amber-600 hover:underline font-extrabold"
                >
                  Dùng danh sách mẫu thử
                </button>
                
                <button
                  onClick={handleImportExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Nhập vào {selectedClass}
                </button>
              </div>
            </div>
          </div>

          {/* Single Student Form */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-amber-500" />
              Thêm học sinh đơn lẻ
            </h4>

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
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider text-left">Họ và Tên lót & Tên</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nhập họ tên của học sinh..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-300"
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

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition"
              >
                + Lưu Học Sinh
              </button>
            </form>
          </div>

        </div>

        {/* Right Column Student Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div className="text-left">
              <h3 className="font-extrabold text-slate-800 text-base">Danh sách học sinh chính thức</h3>
              <p className="text-[13px] text-slate-400">
                Đang xem Lớp học: <span className="font-bold text-amber-600">{selectedClass}</span> — Tổng số: <strong>{classStudents.length} học sinh / {femaleCount} Nữ</strong>.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên hoặc MSHS..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4 w-12">STT</th>
                  <th className="py-3 px-4 w-32">Mã số MSHS</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4 w-28">Giới tính</th>
                  <th className="py-3 px-4 text-center w-28">Chỉnh sửa</th>
                  <th className="py-3 px-4 text-center w-16">Xóa bỏ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, index) => {
                  const isEditing = editingStudentId === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-400">{index + 1}</td>
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
                        ) : (
                          <span className="font-extrabold text-slate-800">{s.name}</span>
                        )}
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
                      <td className="py-3.5 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(s.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1.5 rounded-lg transition shadow-sm flex items-center justify-center gap-1 text-[10px]"
                              title="Lưu"
                            >
                              <Check className="w-3 h-3" /> Lưu
                            </button>
                            <button
                              onClick={() => setEditingStudentId(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2 py-1.5 rounded-lg transition flex items-center justify-center gap-1 text-[10px]"
                              title="Hủy"
                            >
                              <X className="w-3 h-3" /> Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(s)}
                            className="text-slate-400 hover:text-amber-500 p-1.5 hover:bg-amber-50 rounded transition inline-block animate-pulse"
                            title="Chỉnh sửa học sinh này"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition inline-block"
                          title="Xóa học sinh này"
                          disabled={isEditing}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      {classStudents.length === 0 
                        ? `Chưa có học sinh nào thuộc lớp "${selectedClass}". Hãy dán từ Excel ở mục bên trái!`
                        : 'Không tìm thấy học sinh nào trùng khớp với từ khóa tìm kiếm.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
