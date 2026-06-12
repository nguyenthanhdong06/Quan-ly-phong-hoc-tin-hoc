import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { UploadCloud, FileText, Trash2, Download, BookOpen, Layers } from 'lucide-react';

interface ResourcesTabProps {
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  currentUser: any;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function ResourcesTab({
  documents,
  setDocuments,
  currentUser,
  showToast
}: ResourcesTabProps) {
  
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('KHGD');
  const [newDesc, setNewDesc] = useState('');

  // Handle uploading simulation
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tên tài liệu / tiêu đề bài học!', 'error');
      return;
    }

    const item: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      fileUrl: '#',
      author: currentUser ? currentUser.name : 'Giáo viên bộ môn',
      date: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 8 + 1).toFixed(1)} MB`,
      description: newDesc.trim() || 'Bài giảng mẫu hỗ trợ giáo án lớp học.'
    };

    setDocuments(prev => [item, ...prev]);
    setNewTitle('');
    setNewType('KHGD');
    setNewDesc('');
    showToast('Tải lên học liệu giáo dục mới thành công!');
  };

  const handleDeleteDocument = (id: string, title: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast(`Đã xóa thành công học liệu: ${title}`);
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: upload form */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 h-fit">
          <div className="border-b pb-2 text-left">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-500" />
              Đăng tài liệu học tập mới
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Cung cấp phiếu học tập, KHGD, bài giảng PPT phục vụ bộ môn</p>
          </div>

          <form onSubmit={handleAddDocument} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Phân loại học liệu</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-700 bg-white"
              >
                <option value="KHGD">Kế hoạch giáo dục (KHGD)</option>
                <option value="Bài giảng">Slide Bài giảng điện tử (PPTX)</option>
                <option value="Bài tập">Đề thi / Phiếu bài tập lớp học</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Tiêu đề / Tên bài giảng</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Giáo trình Tin học Tuần 18 nâng nâng gõ phím..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Tóm tắt mô tả nội dung</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Mô tả tóm tắt tài liệu..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg h-16 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Click upload file mock */}
            <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50 transition-all">
              <UploadCloud className="w-8 h-8 text-slate-350 mx-auto mb-1" />
              <span className="text-xs font-extrabold text-amber-600 block hover:underline">Chọn file từ máy tính</span>
              <p className="text-[10px] text-slate-400 mt-1">PDF, PPTX, DOCX tối đa 50MB</p>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition"
            >
              Xác nhận Lưu trữ lên Thư Viện
            </button>
          </form>
        </div>

        {/* Right column: Library folders view */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          
          {/* Section 1: KHGD */}
          <div className="space-y-3 text-left">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b pb-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Kế hoạch giáo dục & Phân phối chương trình (KHGD)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {documents.filter(d => d.type === 'KHGD').map(doc => (
                <div key={doc.id} className="p-3.5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-3 text-left">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight">{doc.title}</h4>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-slate-400 hover:text-red-500 transition focus:outline-none"
                        title="Xóa học liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {doc.description && <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-snug">{doc.description}</p>}
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">Người đăng: {doc.author} • Ngày: {doc.date}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/60 text-xs">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{doc.size}</span>
                    <button
                      onClick={() => showToast(`Đang tải tập tin: ${doc.title}`)}
                      className="bg-white hover:bg-slate-150 border border-slate-200 text-slate-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm transition"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> Tải về
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Slides/PPTX */}
          <div className="space-y-3 text-left">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Bài giảng PowerPoint & File bổ trợ (Slides)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {documents.filter(d => d.type === 'Bài giảng' || d.type === 'Bài tập').map(doc => (
                <div key={doc.id} className="p-3.5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-3 text-left">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight">{doc.title}</h4>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-slate-400 hover:text-red-500 transition focus:outline-none"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {doc.description && <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-snug">{doc.description}</p>}
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">Người đăng: {doc.author} • Ngày: {doc.date}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/60 text-xs">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{doc.size}</span>
                    <button
                      onClick={() => showToast(`Đang kết nối tải về: ${doc.title}`)}
                      className="bg-white hover:bg-slate-150 border border-slate-200 text-slate-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm transition"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> Tải về
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
