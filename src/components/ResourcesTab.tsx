import React, { useState, useRef } from 'react';
import { DocumentItem } from '../types';
import { UploadCloud, FileText, Trash2, Download, BookOpen, Layers, CheckCircle2, Search, X, AlertCircle, ShieldCheck, Pencil, ExternalLink } from 'lucide-react';

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
  
  const isAdmin = currentUser?.role?.toLowerCase().includes('admin');
  
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('KHGD');
  const [newDesc, setNewDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [tempDriveLink, setTempDriveLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; title: string } | null>(null);
  const [documentToReject, setDocumentToReject] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Edited states for Admin
  const [documentToEdit, setDocumentToEdit] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingDocs = documents.filter(d => d.status === 'pending');
  const rejectedDocs = documents.filter(d => d.status === 'rejected');

  // Process a selected file
  const processSelectedFile = (file: File) => {
    // 50 MB limits
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Kích thước tập tin vượt quá giới hạn cực đại 50MB!', 'error');
      return;
    }

    setSelectedFile(file);
    
    // Automatically fill in title if currently empty
    if (!newTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setNewTitle(cleanName);
    }
    
    // Auto detect document type classification based on extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pptx' || extension === 'ppt') {
      setNewType('Bài giảng');
    } else if (extension === 'docx' || extension === 'doc') {
      setNewType('Bài tập');
    } else if (extension === 'pdf') {
      setNewType('KHGD');
    }

    showToast(`Đã nhận tập tin: ${file.name}`, 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle uploading simulation
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tên tài liệu / tiêu đề bài học!', 'error');
      return;
    }

    // Determine details of uploaded file
    let fileSize = `${(Math.random() * 8 + 1).toFixed(1)} MB`;
    let fileUrl = '#';

    if (selectedFile) {
      const sizeInMB = selectedFile.size / (1024 * 1024);
      fileSize = sizeInMB < 0.1 ? `${(selectedFile.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`;
      try {
        fileUrl = URL.createObjectURL(selectedFile);
      } catch (err) {
        console.warn('URL.createObjectURL failed:', err);
      }
    } else if (driveLink) {
      fileSize = 'Liên kết GG Drive';
      fileUrl = driveLink.trim();
    }

    const isAdmin = currentUser?.role?.toLowerCase().includes('admin');
    const item: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      fileUrl: fileUrl,
      author: currentUser ? currentUser.name : 'Giáo viên bộ môn',
      date: new Date().toISOString().split('T')[0],
      size: fileSize,
      description: newDesc.trim() || 'Bài giảng mẫu hỗ trợ giáo án lớp học.',
      status: isAdmin ? 'approved' : 'pending'
    };

    setDocuments(prev => [item, ...prev]);
    setNewTitle('');
    setNewType('KHGD');
    setNewDesc('');
    setSelectedFile(null);
    setDriveLink('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (isAdmin) {
      showToast('Đã đăng và phê duyệt học liệu mới thành công!', 'success');
    } else {
      showToast('Tài liệu đã được đăng và đang chờ Quản trị viên xét duyệt!', 'success');
    }
  };

  const handleDeleteDocument = (id: string, title: string) => {
    // Revoke object URL to prevent memory leaks if it was locally created
    const doc = documents.find(d => d.id === id);
    if (doc?.fileUrl && doc.fileUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(doc.fileUrl);
      } catch (e) {
        console.warn(e);
      }
    }
    const isUserAdmin = currentUser?.role?.toLowerCase().includes('admin');
    const isApproved = doc?.status === 'approved' || doc?.status === undefined;
    if (!isUserAdmin && isApproved) {
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, removedFromMyDocs: true } : d));
      showToast(`Đã xóa thành công học liệu khỏi danh sách đóng góp của bạn!`, 'success');
    } else {
      setDocuments(prev => prev.filter(d => d.id !== id));
      showToast(`Đã xóa thành công học liệu: ${title}`, 'success');
    }
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    if (doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com'))) {
      window.open(doc.fileUrl, '_blank');
      showToast(`Đã mở liên kết học liệu trực tuyến: ${doc.title}`, 'success');
      return;
    }
    if (doc.fileUrl && doc.fileUrl !== '#') {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Đã tải xuống thành công học liệu: ${doc.title}`, 'success');
    } else {
      showToast(`Mẫu tài liệu trực tuyến: Đã mở đường dẫn tải của ${doc.title}`, 'success');
    }
  };

  const handleApproveDocument = (id: string, title: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'approved', rejectionReason: undefined } : d));
    showToast(`Đã phê duyệt tài liệu thành công: ${title}`, 'success');
  };

  const handleRejectDocument = (id: string, title: string, reason: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected', rejectionReason: reason || 'Nội dung không phù hợp với mục đích giảng dạy.' } : d));
    showToast(`Đã từ chối tài liệu: ${title}`, 'error');
  };

  const startEditing = (doc: DocumentItem) => {
    setDocumentToEdit(doc);
    setEditTitle(doc.title);
    setEditType(doc.type);
    setEditDesc(doc.description || '');
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      showToast('Tên học liệu không được để trống!', 'error');
      return;
    }
    setDocuments(prev => prev.map(d => d.id === documentToEdit?.id ? {
      ...d,
      title: editTitle.trim(),
      type: editType,
      description: editDesc.trim()
    } : d));
    showToast('Đã cập nhật thay đổi học liệu thành công!', 'success');
    setDocumentToEdit(null);
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

            {/* Fully Functional drag-and-drop & click uploader */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                isDragging 
                  ? 'border-amber-500 bg-amber-50/50 scale-[1.02]' 
                  : (selectedFile || driveLink)
                    ? 'border-emerald-400 bg-emerald-50/10' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.pptx,.docx,.doc"
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-black block">Đã chọn tập tin!</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-700 truncate max-w-[200px] mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Kích thước: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelectedFile();
                    }}
                    className="mt-1.5 text-[10px] bg-slate-200 hover:bg-slate-350 text-slate-600 px-2.5 py-1.5 rounded-lg font-black transition cursor-pointer"
                  >
                    Hủy chọn file
                  </button>
                </div>
              ) : driveLink ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-black block">Đã liên kết Google Drive!</span>
                  </div>
                  <p className="text-[10.5px] font-bold text-slate-700 truncate max-w-[210px] mx-auto" title={driveLink}>
                    {driveLink}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDriveLink('');
                    }}
                    className="mt-1.5 text-[10px] bg-slate-200 hover:bg-slate-350 text-slate-600 px-2.5 py-1.5 rounded-lg font-black transition cursor-pointer"
                  >
                    Hủy liên kết Drive
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <UploadCloud className={`w-8 h-8 mx-auto -mb-1 transition-colors ${isDragging ? 'text-amber-500' : 'text-slate-350'}`} />
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-black text-amber-600 hover:underline cursor-pointer bg-transparent border-none outline-none p-0"
                    >
                      Chọn file từ máy tính
                    </button>
                    <div className="w-full flex items-center justify-center gap-2">
                      <div className="h-px bg-slate-200 w-12" />
                      <span className="text-[9px] text-slate-350 uppercase tracking-wider font-extrabold">hoặc</span>
                      <div className="h-px bg-slate-200 w-12" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempDriveLink(driveLink);
                        setIsDriveModalOpen(true);
                      }}
                      className="text-xs font-black text-emerald-600 hover:underline cursor-pointer inline-flex items-center gap-0.5 bg-transparent border-none outline-none p-0"
                    >
                      Thêm liên kết Google Drive
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, PPTX, DOCX hoặc link Google Drive</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-lg transition"
            >
              Xác nhận
            </button>
          </form>
        </div>

        {/* Right column: Library folders view */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          
          {/* BAN QUẢN TRỊ: KHU VỰC KIỂM SOÁT & XÉT DUYỆT HỌC LIỆU SỐ */}
          {currentUser?.role?.toLowerCase().includes('admin') && (
            <div className="bg-[#0c2f33]/5 border border-[#175358]/20 p-5 rounded-2xl space-y-4 text-left font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#175358]/10 pb-3">
                <div>
                  <h4 className="font-extrabold text-[#113f43] flex items-center gap-2 text-sm uppercase tracking-wider">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    Ban Quản Trị: Kiểm Soát & Xét Duyệt Học Liệu
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Kiểm tra thông tin tài liệu tải lên để ngăn chặn tệp tin rác hoặc lạm dụng hệ thống.</p>
                </div>
                {/* Stats badge indicators */}
                <div className="flex gap-2 text-[10px] font-black">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg border border-amber-205">
                    Chờ duyệt: {pendingDocs.length}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg border border-[#175358]/25">
                    Đã duyệt: {documents.filter(d => d.status === 'approved' || d.status === undefined).length}
                  </span>
                </div>
              </div>

              {pendingDocs.length === 0 ? (
                <div className="text-center py-6 bg-white/70 border border-[#175358]/10 rounded-xl">
                  <p className="text-xs font-black text-[#113f43] flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                    Tất cả học liệu đã được duyệt sạch sẽ! Hệ thống an toàn.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                  {pendingDocs.map(doc => (
                    <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-[#175358]/35 transition-all">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            doc.type === 'KHGD' 
                              ? 'bg-emerald-100 text-emerald-850 border border-emerald-200' 
                              : doc.type === 'Bài giảng'
                                ? 'bg-blue-100 text-blue-850 border border-blue-200'
                                : 'bg-purple-100 text-purple-850 border border-purple-200'
                          }`}>
                            {doc.type}
                          </span>
                          <span className="font-mono text-[9px] font-extrabold text-slate-400">{doc.size}</span>
                        </div>
                        <h5 className="text-xs font-black text-slate-800 truncate" title={doc.title}>{doc.title}</h5>
                        {doc.description && <p className="text-[10px] text-slate-400 line-clamp-1">{doc.description}</p>}
                        <p className="text-[9px] text-[#113f43] font-bold">
                          Người đăng: <strong className="text-amber-600 font-extrabold">{doc.author}</strong> • Ngày: {doc.date}
                        </p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          title={doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com')) ? "Mở liên kết Google Drive" : "Tải về kiểm tra tệp"}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
                        >
                          {doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com')) ? (
                            <ExternalLink className="w-3.5 h-3.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => startEditing(doc)}
                          title="Chỉnh sửa thông tin học liệu"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition cursor-pointer active:scale-95"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleApproveDocument(doc.id, doc.title)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt qua
                        </button>
                        <button
                          onClick={() => setDocumentToReject({ id: doc.id, title: doc.title })}
                          className="bg-red-50 text-red-650 hover:bg-red-100 font-black text-[10px] px-3 py-1.5 rounded-lg border border-red-200 transition cursor-pointer active:scale-95"
                        >
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* HISTORIC / REJECTED LIST - FOR ADMIN TO MANAGE OVERRIDES */}
              {rejectedDocs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[10px] font-black text-red-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    Danh sách tài liệu đã bị từ chối duyệt ({rejectedDocs.length})
                  </p>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar">
                    {rejectedDocs.map(doc => (
                      <div key={doc.id} className="p-2.5 bg-red-50/40 border border-red-200/55 rounded-xl flex items-center justify-between gap-2 text-[10px] hover:bg-red-50/60 transition">
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-700 truncate">{doc.title}</p>
                          <p className="text-[9.5px] text-slate-400 mt-0.5">
                            Người đăng: <strong className="text-slate-600">{doc.author}</strong> • Lý do từ chối: <span className="text-red-600 italic font-bold">"{doc.rejectionReason || 'Không phù hợp mục đích.'}"</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleApproveDocument(doc.id, doc.title)}
                            className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-250 font-black px-2.5 py-1 rounded-lg text-[9px] transition cursor-pointer shadow-xs active:scale-95"
                          >
                            Duyệt lại
                          </button>
                          <button
                            onClick={() => setDocumentToDelete({ id: doc.id, title: doc.title })}
                            className="bg-white hover:bg-red-50 text-red-700 border border-red-200 font-black px-2.5 py-1 rounded-lg text-[9px] transition cursor-pointer shadow-xs active:scale-95"
                          >
                            Xóa hẳn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI HỌC LIỆU ĐÃ ĐĂNG CỦA BẠN (DÀNH CHO GIÁO VIÊN BỘ MÔN) */}
          {currentUser && !currentUser?.role?.toLowerCase().includes('admin') && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 text-left font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-[#113f43] flex items-center gap-1.5 text-xs uppercase tracking-wider font-sans">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    Học liệu của tôi đóng góp ({documents.filter(d => d.author === currentUser.name && !d.removedFromMyDocs).length} tệp)
                  </h4>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-sans">Theo dõi trạng thái kiểm duyệt các học liệu bạn upload lên thư viện hệ thống.</p>
                </div>
                <div className="text-[9px] bg-slate-200/65 font-bold text-slate-550 px-2 py-0.5 rounded-lg border border-slate-300/40">
                  Tài khoản: {currentUser.name}
                </div>
              </div>

              {(() => {
                const myDocs = documents.filter(d => d.author === currentUser.name && !d.removedFromMyDocs);
                if (myDocs.length === 0) {
                  return (
                    <p className="text-xs text-slate-450 italic py-2">Bạn chưa đăng tải đóng góp tệp tài liệu nào.</p>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {myDocs.map(doc => (
                      <div key={doc.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-left shadow-2xs hover:border-slate-350 transition-all">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-slate-800 truncate" title={doc.title}>{doc.title}</h5>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[8px] font-black text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded">{doc.size}</span>
                            <span>•</span>
                            {doc.status === 'approved' || doc.status === undefined ? (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Đã duyệt công khai
                              </span>
                            ) : doc.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-red-650 bg-red-50/75 px-1.5 py-0.5 rounded border border-red-205">
                                <X className="w-2.5 h-2.5" /> Bị từ chối
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold text-amber-650 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-250 animate-pulse">
                                <AlertCircle className="w-2.5 h-2.5 text-amber-500 shrink-0" /> Đang chờ duyệt
                              </span>
                            )}
                          </div>
                          {doc.status === 'rejected' && doc.rejectionReason && (
                            <p className="text-[9.5px] text-red-600 font-bold mt-2 bg-red-50/50 p-2 rounded-lg border border-red-100">
                              Lý do: {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {!(doc.status === 'approved' || doc.status === undefined) && (
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-1.5 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg transition cursor-pointer"
                              title={doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com')) ? "Mở liên kết Google Drive" : "Tải về máy"}
                            >
                              {doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com')) ? (
                                <ExternalLink className="w-3.5 h-3.5" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setDocumentToDelete({ id: doc.id, title: doc.title })}
                            className="p-1.5 hover:bg-red-50 text-red-500 border border-red-100 rounded-lg transition cursor-pointer"
                            title={doc.status === 'approved' || doc.status === undefined ? "Xóa khỏi danh sách đóng góp" : "Xóa học liệu"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Search bar inside the right block */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none w-10">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔎 Tìm kiếm học liệu, kế hoạch giáo án, bài tập hoặc slide bài giảng..."
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 hover:border-slate-300 transition-all outline-none text-slate-700 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {(() => {
            const query = searchQuery.toLowerCase().trim();
            const filteredDocs = documents.filter(doc => {
              if (!query) return true;
              return (
                doc.title.toLowerCase().includes(query) ||
                (doc.description && doc.description.toLowerCase().includes(query)) ||
                doc.type.toLowerCase().includes(query)
              );
            });

            // Lọc ra các tài liệu đã được duyệt để hiển thị công khai ở thư mục chung
            const isApprovedDoc = (doc: DocumentItem) => {
              return doc.status === 'approved' || doc.status === undefined;
            };

            const approvedFilteredDocs = filteredDocs.filter(isApprovedDoc);
            const khgdDocs = approvedFilteredDocs.filter(d => d.type === 'KHGD');
            const slideDocs = approvedFilteredDocs.filter(d => d.type === 'Bài giảng' || d.type === 'Bài tập');

            if (searchQuery && filteredDocs.length === 0) {
              return (
                <div className="text-center py-12 border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="text-slate-350 flex justify-center">
                    <Search className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-700">Không tìm thấy tài liệu phù hợp</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Thử tra cứu với từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              );
            }

            return (
              <>
                {/* Section 1: KHGD */}
                {khgdDocs.length > 0 && (
                  <div className="space-y-3 text-left">
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b pb-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      Kế hoạch giáo dục & Phân phối chương trình (KHGD)
                      {searchQuery && <span className="text-[11px] text-emerald-600/80 font-bold lowercase">({khgdDocs.length} học liệu)</span>}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {khgdDocs.map(doc => (
                        <div key={doc.id} className="p-3.5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-3 text-left">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight">{doc.title}</h4>
                              {isAdmin && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => startEditing(doc)}
                                    className="text-slate-400 hover:text-amber-500 transition focus:outline-none cursor-pointer"
                                    title="Sửa học liệu"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDocumentToDelete({ id: doc.id, title: doc.title })}
                                    className="text-slate-400 hover:text-red-500 transition focus:outline-none cursor-pointer"
                                    title="Xóa học liệu"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {doc.description && <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-snug">{doc.description}</p>}
                            <p className="text-[9px] text-slate-400 mt-1 font-bold">Người đăng: {doc.author} • Ngày: {doc.date}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/60 text-xs text-left">
                            <span className="font-mono text-[10px] font-bold text-slate-400">{doc.size}</span>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="bg-white hover:bg-slate-150 border border-slate-200 text-slate-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm transition cursor-pointer"
                            >
                              {doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com')) ? (
                                <>
                                  <ExternalLink className="w-3 h-3 text-slate-605" /> Mở link
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3 text-slate-600" /> Tải về
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Slides/PPTX */}
                {slideDocs.length > 0 && (
                  <div className="space-y-3 text-left">
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b pb-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Bài giảng PowerPoint & File bổ trợ (Slides)
                      {searchQuery && <span className="text-[11px] text-blue-600/80 font-bold lowercase">({slideDocs.length} học liệu)</span>}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {slideDocs.map(doc => (
                        <div key={doc.id} className="p-3.5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-3 text-left">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight">{doc.title}</h4>
                              {isAdmin && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => startEditing(doc)}
                                    className="text-slate-400 hover:text-amber-500 transition focus:outline-none cursor-pointer"
                                    title="Sửa học liệu"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDocumentToDelete({ id: doc.id, title: doc.title })}
                                    className="text-slate-400 hover:text-red-500 transition focus:outline-none cursor-pointer"
                                    title="Xóa tài liệu"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {doc.description && <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-snug">{doc.description}</p>}
                            <p className="text-[9px] text-slate-400 mt-1 font-bold">Người đăng: {doc.author} • Ngày: {doc.date}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/60 text-xs text-left">
                            <span className="font-mono text-[10px] font-bold text-slate-400">{doc.size}</span>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="bg-white hover:bg-slate-150 border border-slate-200 text-slate-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm transition cursor-pointer"
                            >
                              {doc.fileUrl && (doc.fileUrl.startsWith('http') || doc.fileUrl.includes('drive.google.com')) ? (
                                <>
                                  <ExternalLink className="w-3 h-3 text-slate-605" /> Mở link
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3 text-slate-600" /> Tải về
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        </div>

      </div>

      {/* DOCUMENT DELETE CONFIRMATION DIALOG MODAL */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 text-red-650 border-b border-slate-100 pb-3">
              <div className="p-2 bg-red-50 rounded-full text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider font-sans">Xác nhận</h4>
                <p className="text-[10px] text-slate-400 font-medium">Hành động này có thể làm mất học liệu</p>
              </div>
            </div>
            
            <div className="py-4">
              <p className="text-xs text-slate-650 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài liệu học liệu <strong className="text-red-600 font-extrabold">"{documentToDelete.title}"</strong>? Toàn bộ liên kết tải xuống nội bộ sẽ bị thu hồi và không thể khôi phục.
              </p>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleDeleteDocument(documentToDelete.id, documentToDelete.title);
                  setDocumentToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT REJECT REASON MODAL DIALOG */}
      {documentToReject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 text-red-650 border-b border-slate-100 pb-3">
              <div className="p-2 bg-red-50 rounded-full text-red-650 shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider font-sans">Yêu cầu từ chối duyệt</h4>
                <p className="text-[10px] text-slate-400 font-medium">Gửi ý kiến phản hồi lý do cho người đăng</p>
              </div>
            </div>
            
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-650 leading-relaxed">
                Nhập lý do từ chối cho học liệu: <strong className="text-slate-800 font-extrabold">"{documentToReject.title}"</strong>
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Tài liệu chưa đúng chương trình học, trùng lặp tài liệu cũ, hoặc tệp lỗi..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-red-400 focus:border-red-405 outline-none font-medium"
                required
              />
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  setDocumentToReject(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleRejectDocument(documentToReject.id, documentToReject.title, rejectReason);
                  setDocumentToReject(null);
                  setRejectReason('');
                }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl shadow-sm hover:shadow transition cursor-pointer disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT EDIT DIALOG MODAL (ADMIN ONLY) */}
      {isAdmin && documentToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 rounded-full shrink-0">
                <Pencil className="w-5 h-5 text-amber-605" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider font-sans">Chỉnh sửa học liệu số</h4>
                <p className="text-[10px] text-slate-400 font-medium">Thay đổi thông tin và phân loại học liệu dành cho Quản trị viên</p>
              </div>
            </div>
            
            <div className="py-4 space-y-4">
              {/* Tiêu đề tệp */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tiêu đề học liệu</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tiêu đề hoặc tên tài liệu học tập..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  required
                />
              </div>

              {/* Loại học liệu */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Phân loại thư mục</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium text-slate-800 bg-slate-50/50 cursor-pointer"
                >
                  <option value="KHGD">Kế hoạch giáo dục & Phân phối chương trình (KHGD)</option>
                  <option value="Bài giảng">Bài giảng PowerPoint & Thiết kế slide</option>
                  <option value="Bài tập">Đề thi, Phiếu học tập & Bài kiểm tra</option>
                </select>
              </div>

              {/* Mô tả chi tiết */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Mô tả hoặc Hướng dẫn sử dụng</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Nhập nội dung tóm tắt chi tiết, ghi chú bài giảng..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setDocumentToEdit(null);
                  setEditTitle('');
                  setEditType('');
                  setEditDesc('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-sm hover:shadow transition cursor-pointer disabled:cursor-not-allowed"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE LINK DIALOG MODAL */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center gap-3 text-emerald-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 rounded-full shrink-0">
                <svg className="w-5 h-5 text-emerald-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 6 9 6 12 12 6 12" /><polygon points="12 12 18 12 15 18 9 18" /><polygon points="18 12 15 6 9 6 12 12" /></svg>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider font-sans">Liên kết Google Drive</h4>
                <p className="text-[10px] text-slate-400 font-medium">Nhập đường dẫn tài liệu Google Drive chia sẻ công khai</p>
              </div>
            </div>
            
            <div className="py-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Đường dẫn Google Drive / Link chia sẻ</label>
                <input
                  type="url"
                  value={tempDriveLink}
                  onChange={(e) => setTempDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... hoặc link thư mục"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium text-slate-800 bg-slate-50/50"
                  required
                />
                <p className="text-[9.5px] text-slate-450 leading-relaxed mt-1">
                  * Hãy đảm bảo quyền chia sẻ của tệp hoặc thư mục được đặt thành <strong className="text-emerald-600 font-black">"Bất kỳ ai có đường liên kết này đều có thể xem"</strong> để người dùng khác có thể truy cập được bình thường.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDriveModalOpen(false);
                  setTempDriveLink('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (tempDriveLink.trim()) {
                    setDriveLink(tempDriveLink.trim());
                    setIsDriveModalOpen(false);
                    setTempDriveLink('');
                    showToast('Đã thêm liên kết Google Drive thành công!', 'success');
                  }
                }}
                disabled={!tempDriveLink.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-sm hover:shadow transition cursor-pointer disabled:cursor-not-allowed"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
