import React, { useState, useRef } from 'react';
import { Student, ClassItem } from '../types';
import { Image, User, Check, RotateCcw, Sparkles, UploadCloud, Link as LinkIcon, X, Plus, Trash2, FolderPlus } from 'lucide-react';

interface AvatarGalleryTabProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: ClassItem[];
  selectedClass: string;
  setSelectedClass: (classId: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export interface AvatarItem {
  url: string;
  category: 'con_nguoi' | 'dong_vat' | 'sieu_anh_hung' | 'hoa';
  name: string;
  isCustom?: boolean;
}

export const avatarCategories = [
  { id: 'all', name: 'Tất cả', icon: '✨' },
  { id: 'con_nguoi', name: 'Con người', icon: '🧑‍🤝‍🧑' },
  { id: 'dong_vat', name: 'Động vật', icon: '🐼' },
  { id: 'sieu_anh_hung', name: 'Siêu anh hùng', icon: '🦸' },
  { id: 'hoa', name: 'Hoa', icon: '🌸' }
] as const;

// Helper to convert any Google Drive view/share URL to a direct thumbnail image URL
export function convertDriveUrlToThumbnail(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // Check file/d/ID pattern (e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileDMatch[1]}&sz=w512`;
  }

  // Check id=ID query parameter pattern (e.g. https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w512`;
  }

  // Check googleusercontent /d/ID pattern
  const userContentMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (userContentMatch && userContentMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${userContentMatch[1]}&sz=w512`;
  }

  // If already a full URL or base64 data URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Raw ID pattern (length >= 20)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w512`;
  }

  return trimmed;
}

// LocalStorage persistence helpers for custom uploaded/pasted avatars
export const loadCustomAvatars = (): AvatarItem[] => {
  try {
    const saved = localStorage.getItem('custom_avatars_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Lỗi khi tải danh sách avatar tùy chỉnh:', e);
  }
  return [];
};

export const saveCustomAvatars = (items: AvatarItem[]) => {
  try {
    localStorage.setItem('custom_avatars_list', JSON.stringify(items));
  } catch (e) {
    console.error('Lỗi khi lưu danh sách avatar tùy chỉnh:', e);
  }
};

export const getMergedAvatars = (): AvatarItem[] => {
  return [...loadCustomAvatars(), ...categorizedAvatars];
};

export const categorizedAvatars: AvatarItem[] = [
  // 12 Google Drive Cute Student Avatars categorized under 'con_nguoi'
  { url: "https://drive.google.com/thumbnail?id=1mjpI3dUOzHY8L5l-y7CkL_s9jw9XriSI&sz=w512", category: 'con_nguoi', name: 'Học sinh nữ 1 (Nháy mắt)' },
  { url: "https://drive.google.com/thumbnail?id=1piSQIYDZsEvxdJgb45Kq1Vykiu32rrE4&sz=w512", category: 'con_nguoi', name: 'Học sinh nữ 2 (Mũ vàng)' },
  { url: "https://drive.google.com/thumbnail?id=1TweRboo4BiKKbuSf_teqSJmf0s0IO-pK&sz=w512", category: 'con_nguoi', name: 'Học sinh nữ 3 (Cột tóc)' },
  { url: "https://drive.google.com/thumbnail?id=11pJQb5vgMElsQDZt1iZ5D1QzZe5UBbnj&sz=w512", category: 'con_nguoi', name: 'Học sinh nữ 4 (Băng đô)' },
  { url: "https://drive.google.com/thumbnail?id=1W5YOyftQNklHQEkjtAT7HyvxKdKaBtj1&sz=w512", category: 'con_nguoi', name: 'Học sinh nữ 5 (Tì cằm)' },
  { url: "https://drive.google.com/thumbnail?id=14h7AjxbPzKfZ5JGRqxvUdAKuHm7uF26R&sz=w512", category: 'con_nguoi', name: 'Học sinh nữ 6 (Kính cận)' },
  { url: "https://drive.google.com/thumbnail?id=1umCvKNjXxW8LeqomzxrN0VwaaENfxrhS&sz=w512", category: 'con_nguoi', name: 'Học sinh nam 1 (Áo vàng)' },
  { url: "https://drive.google.com/thumbnail?id=1XC-HABWrm8-BKzzyHcD9UsTBRaRWMO0N&sz=w512", category: 'con_nguoi', name: 'Học sinh nam 2 (Mũ ngược)' },
  { url: "https://drive.google.com/thumbnail?id=1LPh7RwfLYLL51vQTFoz-hn1hgSg3aKlt&sz=w512", category: 'con_nguoi', name: 'Học sinh nam 3 (Kính cận)' },
  { url: "https://drive.google.com/thumbnail?id=1US3HJNd0lgMKB3FLv3QmDRKvLL8tEudV&sz=w512", category: 'con_nguoi', name: 'Học sinh nam 4 (Áo sọc)' },
  { url: "https://drive.google.com/thumbnail?id=1c5UC-8S1QmPwbTJGpSLwmAcFq1DkxZ-_&sz=w512", category: 'con_nguoi', name: 'Học sinh nam 5 (Mũ xanh)' },
  { url: "https://drive.google.com/thumbnail?id=1hV9fR049ulTD6ooRrNfHwx6Ue92NQvNt&sz=w512", category: 'con_nguoi', name: 'Học sinh nam 6 (Áo cam)' },
  { url: "https://drive.google.com/thumbnail?id=16vxF47YQ1GY1KqPYbiF1R_IQIdx-8ZpK&sz=w512", category: 'con_nguoi', name: 'Học sinh mới 1' },
  { url: "https://drive.google.com/thumbnail?id=1RXCTD99B8btIFDXtGC8bVNl-VfKSJAG1&sz=w512", category: 'con_nguoi', name: 'Học sinh mới 2' },
  { url: "https://drive.google.com/thumbnail?id=1nLwcdG1Hs82XlRS_aKBDUqs-RDYovdgV&sz=w512", category: 'con_nguoi', name: 'Học sinh mới 3' },
  { url: "https://drive.google.com/thumbnail?id=1i8zI934pf4HNmWXfLwQlBGCXlkcPGjio&sz=w512", category: 'con_nguoi', name: 'Học sinh mới 4' },

  // Cute animal avatars from user-provided Google Drive links under 'dong_vat'
  { url: "https://drive.google.com/thumbnail?id=1kXXjYVaGb2ca4U4So7yqwkkiJx0gHBAs&sz=w512", category: 'dong_vat', name: 'Động vật 1' },
  { url: "https://drive.google.com/thumbnail?id=1ReMB3SN9ok3TG-qhNGPMDY3lVP4E3zSw&sz=w512", category: 'dong_vat', name: 'Động vật 2' },
  { url: "https://drive.google.com/thumbnail?id=1wtLfOb0-RevoJ_XltPOZG6FpXpDX4npi&sz=w512", category: 'dong_vat', name: 'Động vật 3' },
  { url: "https://drive.google.com/thumbnail?id=1HTBLPa8CxkSjF2sBzieK1vFU94fwaDAS&sz=w512", category: 'dong_vat', name: 'Động vật 4' },
  { url: "https://drive.google.com/thumbnail?id=1W9PnA2N7VOo971ANJB5jrySOgHkgyMM9&sz=w512", category: 'dong_vat', name: 'Động vật 5' },
  { url: "https://drive.google.com/thumbnail?id=1jb5iIQ096KZ1uD9wybfuzxHzYmAexH-W&sz=w512", category: 'dong_vat', name: 'Động vật 6' },
  { url: "https://drive.google.com/thumbnail?id=1MtjEJMB39dbqDP16LTGp9JfI8k3MhtH1&sz=w512", category: 'dong_vat', name: 'Động vật 7' },
  { url: "https://drive.google.com/thumbnail?id=1_GVxIJoEiN6iRKlW8u6ZAIAO92wysiDd&sz=w512", category: 'dong_vat', name: 'Động vật 8' },
  { url: "https://drive.google.com/thumbnail?id=1elD2L4F0dg4pBu3o8p69wWhTRYXW-gVG&sz=w512", category: 'dong_vat', name: 'Động vật 9' },
  { url: "https://drive.google.com/thumbnail?id=1-kAHdUk92CKQB9Pwe8aQWhgi3tqwq3w0&sz=w512", category: 'dong_vat', name: 'Động vật 10' },
  { url: "https://drive.google.com/thumbnail?id=1fmsOEo-eq-6AcrGxucDnVZazUwO1BB8E&sz=w512", category: 'dong_vat', name: 'Động vật 11' },
  { url: "https://drive.google.com/thumbnail?id=1pYgRZxiC-bmwus5H3XqAMji6LC9grrRU&sz=w512", category: 'dong_vat', name: 'Động vật 12' },
  { url: "https://drive.google.com/thumbnail?id=1h61N_rfP78kTZXsBfAM-XmRD5O_ii1EZ&sz=w512", category: 'dong_vat', name: 'Động vật 13' },
  { url: "https://drive.google.com/thumbnail?id=1--1B44mJra3ScflVxF3dCxTxklPnW6h9&sz=w512", category: 'dong_vat', name: 'Động vật 14' },
  { url: "https://drive.google.com/thumbnail?id=1eJmxGCjkhOq2PyR3dINCKjI1U9RkK1EB&sz=w512", category: 'dong_vat', name: 'Động vật 15' },
  { url: "https://drive.google.com/thumbnail?id=1W16xoQl-Zv-fNqtlAQ1FFG0pXjNw9cH1&sz=w512", category: 'dong_vat', name: 'Động vật 16' },
  { url: "https://drive.google.com/thumbnail?id=1-u_aVthyPKxKbNFBp5lVCq3S3U6Vax9G&sz=w512", category: 'dong_vat', name: 'Động vật 17' },
  { url: "https://drive.google.com/thumbnail?id=1AjL2f5OipgCFAlik8U1yKfI3gsg43Vx-&sz=w512", category: 'dong_vat', name: 'Động vật 18' },
  { url: "https://drive.google.com/thumbnail?id=14DnIviDRMnwM0eiHUnSEMD7xg-rTvzaX&sz=w512", category: 'dong_vat', name: 'Động vật 19' },
  { url: "https://drive.google.com/thumbnail?id=16d7C7-C8jKimSKeOtBKgUtYmf5sMR7jQ&sz=w512", category: 'dong_vat', name: 'Động vật 20' },
  { url: "https://drive.google.com/thumbnail?id=1dgyFLI9M-CwPVpG295qV15byAAf71I-G&sz=w512", category: 'dong_vat', name: 'Động vật 21' },
  { url: "https://drive.google.com/thumbnail?id=1qGSp6Y8ixZ-h7jiupGOw5ZD552PM742S&sz=w512", category: 'dong_vat', name: 'Động vật 22' },
  { url: "https://drive.google.com/thumbnail?id=1TJ-fugkFYR5YX3vYB9g-8XRWdPEt28HS&sz=w512", category: 'dong_vat', name: 'Động vật 23' },
  { url: "https://drive.google.com/thumbnail?id=1FO6GFyoqXWyeJG1mWd21neRrfBnTnSL0&sz=w512", category: 'dong_vat', name: 'Động vật 24' },
  { url: "https://drive.google.com/thumbnail?id=1tOYmcpm0cUnn4BYqoNHq0nknRHd-1Nxu&sz=w512", category: 'dong_vat', name: 'Động vật 25' },
  { url: "https://drive.google.com/thumbnail?id=13TJGGNbbIQ0NSFMr028pVHdio-yoMmqP&sz=w512", category: 'dong_vat', name: 'Động vật 26' },
  { url: "https://drive.google.com/thumbnail?id=1-1nPsOXeWXky0vzwIF9E7s1UHbkJznOh&sz=w512", category: 'dong_vat', name: 'Động vật 27' },
  { url: "https://drive.google.com/thumbnail?id=1ikYlkLhn6IbMMkFR0MjwzkRCUy95Xf4d&sz=w512", category: 'dong_vat', name: 'Động vật 28' },
  { url: "https://drive.google.com/thumbnail?id=1hAgDivi935SY0t0UuTDNsptp2Mpo06tq&sz=w512", category: 'dong_vat', name: 'Động vật 29' },
  { url: "https://drive.google.com/thumbnail?id=1CRTiMW3VbGyC3Ve0Nz-fl8nuQfNKjBmF&sz=w512", category: 'dong_vat', name: 'Động vật 30' },
  { url: "https://drive.google.com/thumbnail?id=1V6DRRCh-PRLt5ZtHCFxbaTk2Sw73JJAj&sz=w512", category: 'dong_vat', name: 'Động vật 31' },
  { url: "https://drive.google.com/thumbnail?id=1bWQJlAlDffQx__Tm-6mXm31i905V0LSH&sz=w512", category: 'dong_vat', name: 'Động vật 32' },
  { url: "https://drive.google.com/thumbnail?id=1-awQS3QEyZ3sWdfKXNitYp3842FMue7Z&sz=w512", category: 'dong_vat', name: 'Động vật 33' },
  { url: "https://drive.google.com/thumbnail?id=1o2tXgx6O2fasL9p7wsRNhBSeveWGexCS&sz=w512", category: 'dong_vat', name: 'Động vật 34' },
  { url: "https://drive.google.com/thumbnail?id=1IeilTAl-8_c_deFJ4MOCvqKmalktiIrf&sz=w512", category: 'dong_vat', name: 'Động vật 35' },
  { url: "https://drive.google.com/thumbnail?id=1CQJFmRwoizccd98elkfC_ptV0mY0FtG4&sz=w512", category: 'dong_vat', name: 'Động vật 36' },
  { url: "https://drive.google.com/thumbnail?id=1D9XgNX4PtNLdJcoAHjZOUXBWVgYH-OkQ&sz=w512", category: 'dong_vat', name: 'Động vật 37' },
  { url: "https://drive.google.com/thumbnail?id=1auPyfT9oqR8322IG2TOjLMnyIDnLfiX4&sz=w512", category: 'dong_vat', name: 'Động vật 38' },
  { url: "https://drive.google.com/thumbnail?id=1XP9GldI60IucdMGtP-_NagMCNnByxWsO&sz=w512", category: 'dong_vat', name: 'Động vật 39' },
  { url: "https://drive.google.com/thumbnail?id=1b19WxV7i8_16itwuwG_fU_A0VMnyilgZ&sz=w512", category: 'dong_vat', name: 'Động vật 40' },
  { url: "https://drive.google.com/thumbnail?id=1RDWDY3a22s8HZNgB8xqJdWWZSLifAcUF&sz=w512", category: 'dong_vat', name: 'Động vật 41' },
  { url: "https://drive.google.com/thumbnail?id=1hdOAvjYmP2c1fpiCGFg5-DOcQKBGOtmC&sz=w512", category: 'dong_vat', name: 'Động vật 42' },
  { url: "https://drive.google.com/thumbnail?id=13Emx_Nba_8eu8OgCuhvMck3OFYynV8SI&sz=w512", category: 'dong_vat', name: 'Động vật 43' },
  { url: "https://drive.google.com/thumbnail?id=1GI6mfLGajsCwi1h1Z5bLbgtYIcVOazTv&sz=w512", category: 'dong_vat', name: 'Động vật 44' },
  { url: "https://drive.google.com/thumbnail?id=1t6sN2Eqo_zJWIBEzVvA1GZO97NiYLNsA&sz=w512", category: 'dong_vat', name: 'Động vật 45' },
  { url: "https://drive.google.com/thumbnail?id=1vNHzrC5ZgMGUYRLKsGx5Y-hQ25Fe8lZ4&sz=w512", category: 'dong_vat', name: 'Động vật 46' },
  { url: "https://drive.google.com/thumbnail?id=1kIzuP-0RI8e2na7X9_gMoRZ5i9j4Y8fS&sz=w512", category: 'dong_vat', name: 'Động vật mới 1' }
];

export const googleDriveAvatars = categorizedAvatars.map(item => item.url);

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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customAvatars, setCustomAvatars] = useState<AvatarItem[]>(loadCustomAvatars);

  // Modal & File upload state
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [driveInputText, setDriveInputText] = useState<string>('');
  const [driveCategory, setDriveCategory] = useState<'con_nguoi' | 'dong_vat' | 'sieu_anh_hung' | 'hoa'>('con_nguoi');
  const [driveNamePrefix, setDriveNamePrefix] = useState<string>('Avatar Google Drive');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classStudents = students.filter(s => s.classId === selectedClass);
  const selectedStudentObj = students.find(s => s.id === selectedStudentId);

  // Combine custom avatars with default categorized avatars
  const allAvatars = [...customAvatars, ...categorizedAvatars];

  const filteredAvatars = activeCategory === 'all'
    ? allAvatars
    : allAvatars.filter(item => item.category === activeCategory);

  // File upload handler from computer
  const handleFileUploadFromComputer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const newItems: AvatarItem[] = [];

    // Determine category based on currently active tab
    const targetCategory: 'con_nguoi' | 'dong_vat' | 'sieu_anh_hung' | 'hoa' =
      activeCategory !== 'all' ? (activeCategory as any) : 'con_nguoi';

    let readCount = 0;
    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newItems.push({
            url: event.target.result as string,
            category: targetCategory,
            name: file.name.replace(/\.[^/.]+$/, "") || 'Avatar từ máy tính',
            isCustom: true,
          });
        }
        readCount++;
        if (readCount === fileList.length) {
          setCustomAvatars(prev => {
            const updated = [...newItems, ...prev];
            saveCustomAvatars(updated);
            return updated;
          });
          const catName = avatarCategories.find(c => c.id === targetCategory)?.name || targetCategory;
          showToast(`Đã tải lên ${newItems.length} avatar vào mục "${catName}"!`, 'success');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOpenDriveModal = () => {
    if (activeCategory !== 'all') {
      setDriveCategory(activeCategory as any);
    } else {
      setDriveCategory('con_nguoi');
    }
    setIsDriveModalOpen(true);
  };

  // Google Drive URL submit handler
  const handleAddFromGoogleDrive = () => {
    if (!driveInputText.trim()) {
      showToast('Vui lòng nhập ít nhất một đường liên kết Google Drive!', 'error');
      return;
    }

    // Split input by newlines, commas, or spaces to support multiple links at once
    const rawLinks = driveInputText
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (rawLinks.length === 0) {
      showToast('Không tìm thấy đường liên kết hợp lệ!', 'error');
      return;
    }

    const newItems: AvatarItem[] = rawLinks.map((link, idx) => {
      const convertedUrl = convertDriveUrlToThumbnail(link);
      const baseName = driveNamePrefix.trim() || 'Avatar Google Drive';
      const name = rawLinks.length > 1 ? `${baseName} ${idx + 1}` : baseName;
      return {
        url: convertedUrl,
        category: driveCategory,
        name,
        isCustom: true,
      };
    });

    setCustomAvatars(prev => {
      const updated = [...newItems, ...prev];
      saveCustomAvatars(updated);
      return updated;
    });

    showToast(`Đã thêm thành công ${newItems.length} avatar từ Google Drive!`, 'success');
    setDriveInputText('');
    setIsDriveModalOpen(false);
  };

  // Delete custom avatar handler
  const handleDeleteCustomAvatar = (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomAvatars(prev => {
      const updated = prev.filter(item => item.url !== urlToDelete);
      saveCustomAvatars(updated);
      return updated;
    });
    showToast('Đã xóa avatar khỏi bộ sưu tập!', 'success');
  };

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

  // Count detected links in drive modal
  const detectedLinksCount = driveInputText
    .split(/[\n,\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0).length;

  return (
    <div className="space-y-6 text-left">
      {/* Hidden file input for computer uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUploadFromComputer}
        accept="image/*"
        multiple
        className="hidden"
      />

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
            Quản trị viên hoặc Giáo viên có thể lựa chọn avatar độc đáo từ Google Drive hoặc tải từ máy tính cho từng học sinh.
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
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col max-h-[620px]">
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

        {/* Right column: Avatar Editor, Add New Avatar & Gallery */}
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

          {/* Section: Thêm mới Avatar (Compact design) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 tracking-wider uppercase">
                <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                Thêm mới Avatar
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Tải từ máy tính hoặc link Google Drive</span>
            </div>

            {/* Dashed Upload Card - Single Line Layout */}
            <div className="border border-dashed border-sky-200 hover:border-amber-400 rounded-xl bg-sky-50/20 hover:bg-amber-50/10 px-4 py-2.5 flex items-center justify-center gap-3 text-center transition-all duration-200 group">
              {/* Cloud Icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-100 text-slate-800 group-hover:scale-105 transition-transform cursor-pointer shrink-0"
                title="Bấm để chọn file từ máy tính"
              >
                <svg className="w-5 h-5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m16 16-4-4-4 4" />
                </svg>
              </button>

              {/* Single row actions */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {/* Action 1: Chọn file từ máy tính (Orange text button) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-amber-600 hover:text-amber-700 font-black text-xs transition-colors cursor-pointer active:scale-95"
                >
                  Chọn file từ máy tính
                </button>

                {/* HOẶC */}
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">HOẶC</span>

                {/* Action 2: Thêm liên kết Google Drive (Green text button) */}
                <button
                  type="button"
                  onClick={handleOpenDriveModal}
                  className="text-emerald-600 hover:text-emerald-700 font-black text-xs transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  Thêm liên kết Google Drive
                </button>
              </div>
            </div>
          </div>

          {/* Avatar Gallery Selector Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Bộ sưu tập Avatar Cute ({allAvatars.length})
              </h3>
              
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5">
                {avatarCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 ${
                      activeCategory === cat.id
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {filteredAvatars.map((item, idx) => {
                const isAssigned = selectedStudentObj?.avatarUrl === item.url;
                return (
                  <div key={idx} className="relative group">
                    <button
                      disabled={!selectedStudentId}
                      onClick={() => handleSelectAvatar(item.url)}
                      className={`w-full relative aspect-square rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all bg-slate-50 ${
                        !selectedStudentId
                          ? 'opacity-60 cursor-not-allowed'
                          : isAssigned
                          ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-sm scale-95'
                          : 'border-slate-150 hover:border-amber-400 hover:scale-105 hover:shadow-sm cursor-pointer'
                      }`}
                      title={`${item.name} (${avatarCategories.find(c => c.id === item.category)?.name})`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />

                      {/* Badge for avatar label */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 px-1 text-[8.5px] font-bold text-white text-center opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {item.name}
                      </div>

                      {isAssigned && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <span className="bg-amber-500 text-white p-1 rounded-full shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Delete button for user-added custom avatars */}
                    {item.isCustom && (
                      <button
                        onClick={(e) => handleDeleteCustomAvatar(item.url, e)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        title="Xóa avatar này khỏi bộ sưu tập"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredAvatars.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                Không tìm thấy avatar nào trong danh mục này.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POP-UP MODAL: Thêm avatar từ Google Drive */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100 animate-in zoom-in-95 duration-150 text-left">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600 shrink-0">
                  <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Thêm avatar từ Google Drive</h3>
                  <p className="text-xs text-slate-400 font-medium">Hỗ trợ dán 1 hoặc nhiều link chia sẻ cùng lúc</p>
                </div>
              </div>
              <button
                onClick={() => setIsDriveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Textarea for links */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700">
                    Đường liên kết Google Drive (hoặc nhiều link):
                  </label>
                  {detectedLinksCount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Đã nhận diện: {detectedLinksCount} link
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={driveInputText}
                  onChange={(e) => setDriveInputText(e.target.value)}
                  placeholder={`Dán các đường liên kết Google Drive tại đây...\nVí dụ:\nhttps://drive.google.com/file/d/1mjpI3dUOzHY8L5l-y7CkL_s9jw9XriSI/view?usp=sharing\nhttps://drive.google.com/file/d/1piSQIYDZsEvxdJgb45Kq1Vykiu32rrE4/view?usp=sharing`}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono leading-relaxed resize-none"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  💡 <strong>Mẹo:</strong> Mỗi đường link nằm trên một dòng hoặc phân cách bởi dấu phẩy. Hệ thống tự động chuyển hóa liên kết sang định dạng hiển thị ảnh mượt mà.
                </p>
              </div>

              {/* Options: Category & Name prefix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Danh mục Avatar:</label>
                  <select
                    value={driveCategory}
                    onChange={(e) => setDriveCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="con_nguoi">🧑‍🤝‍🧑 Con người</option>
                    <option value="dong_vat">🐼 Động vật</option>
                    <option value="sieu_anh_hung">🦸 Siêu anh hùng</option>
                    <option value="hoa">🌸 Hoa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Tên hiển thị (Tùy chọn):</label>
                  <input
                    type="text"
                    value={driveNamePrefix}
                    onChange={(e) => setDriveNamePrefix(e.target.value)}
                    placeholder="VD: Avatar Google Drive"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAddFromGoogleDrive}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                Thêm {detectedLinksCount > 1 ? `${detectedLinksCount} ` : ''}Avatar Vào Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

