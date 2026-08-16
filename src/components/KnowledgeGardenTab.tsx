import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Droplets, 
  Award, 
  Gift, 
  Users, 
  User, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  ChevronRight, 
  Check, 
  X, 
  Info,
  RefreshCw,
  SlidersHorizontal,
  Filter,
  ArrowLeft,
  Edit3,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { Student, ClassItem, GardenStudentData, GardenReward, WaterLog, CustomSeedSet } from '../types';
import { triggerStarsConfetti } from '../utils/confetti';
import { 
  playStarRewardSound, 
  playVictoryFanfareSound, 
  playWarningDeductSound
} from '../utils/audioEffects';
import { saveSupabaseState } from '../supabaseClient';

interface KnowledgeGardenTabProps {
  students: Student[];
  selectedClass: string;
  classes: ClassItem[];
  onSelectClass?: (classId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

import { extractGoogleDriveFileId, convertGoogleDriveUrl, getGoogleDriveFallbackUrls } from '../utils/googleDriveImageHelper';
import { compressImageToWebP } from '../utils/imageCompressor';
export { extractGoogleDriveFileId, convertGoogleDriveUrl, getGoogleDriveFallbackUrls, compressImageToWebP };

// 7 Cấp Độ Tăng Trưởng - Cây Hoa Đào (Hỗ trợ WebP nén siêu nhẹ)
export const GARDEN_STAGES = [
  { level: 1, min: 0,   icon: '🌰', imgUrl: 'hoadao1.webp?v=4', fallbackUrl: 'hoadao1.png', name: 'Hạt Giống', desc: 'Bắt đầu nỗ lực rèn luyện' },
  { level: 2, min: 20,  icon: '🌱', imgUrl: 'hoadao2.webp?v=4', fallbackUrl: 'hoadao2.png', name: 'Nảy Mầm', desc: 'Sự cố gắng đầu tiên' },
  { level: 3, min: 50,  icon: '🌿', imgUrl: 'hoadao3.webp?v=4', fallbackUrl: 'hoadao3.png', name: 'Hai Lá', desc: 'Rèn luyện đều đặn' },
  { level: 4, min: 100, icon: '🪴', imgUrl: 'hoadao4.webp?v=4', fallbackUrl: 'hoadao4.png', name: 'Cây Non', desc: 'Vững vàng học tập' },
  { level: 5, min: 180, icon: '🌳', imgUrl: 'hoadao5.webp?v=4', fallbackUrl: 'hoadao5.png', name: 'Cây Lớn', desc: 'Chăm chỉ vượt bậc' },
  { level: 6, min: 260, icon: '🌸', imgUrl: 'hoadao6.webp?v=4', fallbackUrl: 'hoadao6.png', name: 'Ra Hoa', desc: 'Tỏa ngát hương thơm' },
  { level: 7, min: 350, icon: '🍎', imgUrl: 'hoadao7.webp?v=4', fallbackUrl: 'hoadao7.png', name: 'Kết Trái', desc: 'Sẵn sàng thu hoạch mùa gặt!' }
];

// Seed Option Mặc Định
const DEFAULT_SEED_NAME = '🌸 Cây Hoa Đào';

// Mẫu Bộ Hạt Giống Mặc Định
const DEFAULT_CUSTOM_SEED_SETS: CustomSeedSet[] = [];

// Danh Sách Quà Mặc Định
const DEFAULT_REWARDS: GardenReward[] = [
  { id: 'rew-1', icon: '✏️', title: 'Bút chì màu dễ thương', cost: 100, type: 'WATER' },
  { id: 'rew-2', icon: '📓', title: 'Vở bài tập lò xo xinh xắn', cost: 200, type: 'WATER' },
  { id: 'rew-3', icon: '🎨', title: 'Bộ màu vẽ 24 màu sặc sỡ', cost: 350, type: 'HARVEST' },
  { id: 'rew-4', icon: '🧩', title: 'Đồ chơi lắp ráp trí tuệ', cost: 350, type: 'HARVEST' }
];

/**
 * Image compression utility to compress local file uploads down to ~40KB JPEG DataURL
 */
export const compressImageFile = (file: File, maxWidth: number = 600, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const KnowledgeGardenTab: React.FC<KnowledgeGardenTabProps> = ({
  students,
  selectedClass,
  classes,
  onSelectClass,
  showToast
}) => {
  // 1. STATE MANAGEMENT - Mặc định load 'class' (Vườn Cả Lớp)
  const [activeTab, setActiveTab] = useState<'student' | 'class' | 'reward' | 'teacher'>('class');
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  
  // Grade Filter: 'ALL' | '3' | '4' | '5'
  const [gradeFilter, setGradeFilter] = useState<'ALL' | '3' | '4' | '5'>('ALL');

  // Custom Garden Data for Students (stored in localStorage)
  const [gardenData, setGardenData] = useState<{ [studentId: string]: GardenStudentData }>(() => {
    try {
      const saved = localStorage.getItem('deskos_garden_data_v2');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Rewards Store Items
  const [rewards, setRewards] = useState<GardenReward[]>(() => {
    try {
      const saved = localStorage.getItem('deskos_garden_rewards_v2');
      return saved ? JSON.parse(saved) : DEFAULT_REWARDS;
    } catch (e) {
      return DEFAULT_REWARDS;
    }
  });

  // Filters & Inputs
  const [classSearch, setClassSearch] = useState('');
  const [classStageFilter, setClassStageFilter] = useState<string>('ALL');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Custom Seed Sets Collection (7 Levels)
  const [customSeedSets, setCustomSeedSets] = useState<CustomSeedSet[]>(() => {
    try {
      const saved = localStorage.getItem('deskos_custom_seed_sets_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_SEED_SETS;
    } catch (e) {
      return DEFAULT_CUSTOM_SEED_SETS;
    }
  });

  // Seed Bank Modals State
  const [isSeedBankModalOpen, setIsSeedBankModalOpen] = useState<boolean>(false);
  const [isSeedFormModalOpen, setIsSeedFormModalOpen] = useState<boolean>(false);
  const [editingSeedSet, setEditingSeedSet] = useState<CustomSeedSet | null>(null);
  const [seedSetName, setSeedSetName] = useState<string>('');
  const [seedSetLevels, setSeedSetLevels] = useState<{ [lvl: number]: string }>({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: ''
  });

  const lastLocalSaveTimeRef = React.useRef<number>(0);

  // Persist Custom Seed Sets
  useEffect(() => {
    try {
      localStorage.setItem('deskos_custom_seed_sets_v1', JSON.stringify(customSeedSets));
      saveSupabaseState('school_custom_seed_sets', customSeedSets);
    } catch (e) {}
  }, [customSeedSets]);

  // Sync Cloud Updates for Seed Sets
  useEffect(() => {
    const handleRemoteSeedSetsUpdate = (e: any) => {
      // Ignore remote echo if we saved locally in the last 4 seconds
      if (Date.now() - lastLocalSaveTimeRef.current < 4000) {
        return;
      }
      if (e.detail && Array.isArray(e.detail)) {
        setCustomSeedSets(e.detail);
      }
    };
    window.addEventListener('custom_seed_sets_updated', handleRemoteSeedSetsUpdate);
    return () => {
      window.removeEventListener('custom_seed_sets_updated', handleRemoteSeedSetsUpdate);
    };
  }, []);

  // Helper to fetch exact stage image URL based on student's assigned seed set
  const getStageImageUrl = (seedName: string, level: number): { url: string; fallback: string } => {
    const customSet = customSeedSets.find(s => s.name === seedName || s.id === seedName);
    if (customSet && customSet.levels && customSet.levels[level as keyof typeof customSet.levels]) {
      const customImg = customSet.levels[level as keyof typeof customSet.levels];
      if (customImg && customImg.trim()) {
        return { url: convertGoogleDriveUrl(customImg, 800), fallback: GARDEN_STAGES[level - 1].fallbackUrl };
      }
    }
    const defaultStage = GARDEN_STAGES[level - 1] || GARDEN_STAGES[0];
    return { url: defaultStage.imgUrl, fallback: defaultStage.fallbackUrl };
  };

  // ⚡ Universal Google Drive Image Error Fallback Handler (Đồng bộ 100% từ Kho Avatar)
  const handleGardenDriveImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    rawUrl?: string,
    fallbackLocalUrl?: string
  ) => {
    const target = e.currentTarget as HTMLImageElement;
    const sourceUrl = rawUrl || target.src;
    const fileId = extractGoogleDriveFileId(sourceUrl);

    if (fileId) {
      const fallbackChain = getGoogleDriveFallbackUrls(fileId, 800);
      const currentStepIndex = Number(target.dataset.fallbackStep || '0');

      if (currentStepIndex < fallbackChain.length) {
        target.dataset.fallbackStep = String(currentStepIndex + 1);
        target.src = fallbackChain[currentStepIndex];
        return;
      }
    }

    if (fallbackLocalUrl && !target.dataset.triedFinalLocalFallback) {
      target.dataset.triedFinalLocalFallback = 'true';
      target.src = fallbackLocalUrl;
    }
  };
  const [waterModalStudent, setWaterModalStudent] = useState<Student | null>(null);
  const [selectedWaterAmount, setSelectedWaterAmount] = useState<number>(3);
  const [waterReason, setWaterReason] = useState<string>('Hoàn thành bài tập tốt');

  const [badgeModalStudent, setBadgeModalStudent] = useState<Student | null>(null);
  const [customBadgeInput, setCustomBadgeInput] = useState<string>('');

  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState<boolean>(false);
  const [newRewardIcon, setNewRewardIcon] = useState<string>('🧸');
  const [newRewardTitle, setNewRewardTitle] = useState<string>('');
  const [newRewardCost, setNewRewardCost] = useState<number>(150);
  const [newRewardType, setNewRewardType] = useState<'WATER' | 'HARVEST'>('WATER');

  const [floatingWaterDrops, setFloatingWaterDrops] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [fallingWaterDrops, setFallingWaterDrops] = useState<{ id: number; left: number }[]>([]);

  const triggerFallingWaterDrops = () => {
    const drops = [
      { id: Date.now() + Math.random(), left: 25 },
      { id: Date.now() + Math.random() + 1, left: 45 },
      { id: Date.now() + Math.random() + 2, left: 65 },
      { id: Date.now() + Math.random() + 3, left: 80 }
    ];
    setFallingWaterDrops(prev => [...prev, ...drops]);
    setTimeout(() => {
      setFallingWaterDrops(prev => prev.filter(d => !drops.some(nd => nd.id === d.id)));
    }, 950);
  };

  // 2. EFFECT: PERSIST DATA & INITIALIZE CLASS STUDENTS
  useEffect(() => {
    try {
      localStorage.setItem('deskos_garden_data_v2', JSON.stringify(gardenData));
    } catch (e) {}
  }, [gardenData]);

  useEffect(() => {
    try {
      localStorage.setItem('deskos_garden_rewards_v2', JSON.stringify(rewards));
    } catch (e) {}
  }, [rewards]);

  // Sync active student with current class
  const classStudents = students.filter(s => s.classId === selectedClass);

  useEffect(() => {
    if (classStudents.length > 0) {
      const exists = classStudents.some(s => s.id === activeStudentId);
      if (!exists) {
        setActiveStudentId(classStudents[0].id);
      }
    }
  }, [selectedClass, classStudents, activeStudentId]);

  // Helper to get or initialize student's garden data
  const getStudentGarden = (studentId: string): GardenStudentData => {
    if (gardenData[studentId]) {
      return gardenData[studentId];
    }
    return {
      studentId,
      seed: DEFAULT_SEED_NAME,
      water: 0,
      badges: [],
      logs: []
    };
  };

  // Helper to calculate growth level info
  const getStageInfo = (water: number) => {
    let currentStage = GARDEN_STAGES[0];
    let nextStage = GARDEN_STAGES[GARDEN_STAGES.length - 1];

    for (let i = 0; i < GARDEN_STAGES.length; i++) {
      if (water >= GARDEN_STAGES[i].min) {
        currentStage = GARDEN_STAGES[i];
        nextStage = GARDEN_STAGES[i + 1] || GARDEN_STAGES[i];
      }
    }
    return { currentStage, nextStage };
  };

  // 3. ACTION HANDLERS
  const activeStudent = students.find(s => s.id === activeStudentId) || classStudents[0];
  const activeGarden = activeStudent ? getStudentGarden(activeStudent.id) : null;
  const activeStageInfo = activeGarden ? getStageInfo(activeGarden.water) : null;

  // Click on Tree to Water
  const handleTreeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeStudent || !activeGarden) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;

    // Floating water drop effect
    const dropId = Date.now() + Math.random();
    setFloatingWaterDrops(prev => [...prev, { id: dropId, x, y, text: '+1 💧' }]);
    setTimeout(() => {
      setFloatingWaterDrops(prev => prev.filter(d => d.id !== dropId));
    }, 1200);

    addWaterToStudent(activeStudent.id, 1, 'Chăm chỉ học tập (Tự tưới)');
  };

  const addWaterToStudent = (studentId: string, amount: number, reason: string) => {
    const prevData = getStudentGarden(studentId);
    const oldLevel = getStageInfo(prevData.water).currentStage.level;

    const newWater = prevData.water + amount;
    const newLogs: WaterLog[] = [
      {
        id: `log-${Date.now()}`,
        date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        amount,
        reason
      },
      ...prevData.logs
    ];

    setGardenData(prev => ({
      ...prev,
      [studentId]: {
        ...prevData,
        water: newWater,
        logs: newLogs
      }
    }));

    triggerFallingWaterDrops();
    playStarRewardSound();

    const newLevel = getStageInfo(newWater).currentStage.level;
    if (newLevel > oldLevel) {
      playVictoryFanfareSound();
      triggerStarsConfetti();
      const st = students.find(s => s.id === studentId);
      showToast(`🎉 CHÚC MỪNG! Cây tri thức của ${st ? st.name : 'em'} đã nảy mầm vinh quang lên Cấp ${newLevel}!`, 'success');
    }
  };

  // Mass Watering for Entire Class
  const handleAddWaterToAll = () => {
    if (classStudents.length === 0) {
      showToast('Lớp hiện tại chưa có học sinh!', 'warning');
      return;
    }

    classStudents.forEach(s => {
      addWaterToStudent(s.id, 5, 'Khen thưởng phong trào cả lớp');
    });

    triggerStarsConfetti();
    showToast(`🎉 Tuyệt vời! Đã tặng +5 💧 cho tất cả ${classStudents.length} học sinh lớp ${selectedClass}!`, 'success');
  };

  // Award Virtue Badge
  const handleAwardBadge = () => {
    if (!badgeModalStudent) return;
    const badgeText = customBadgeInput.trim() || '⭐ Chăm Chỉ';
    const sId = badgeModalStudent.id;
    const currentG = getStudentGarden(sId);

    if (!currentG.badges.includes(badgeText)) {
      setGardenData(prev => ({
        ...prev,
        [sId]: {
          ...currentG,
          badges: [...currentG.badges, badgeText]
        }
      }));
      playVictoryFanfareSound();
      showToast(`🏅 Đã trao tặng huy hiệu "${badgeText}" cho ${badgeModalStudent.name}!`, 'success');
    } else {
      showToast(`Học sinh đã sở hữu huy hiệu này!`, 'info');
    }

    setBadgeModalStudent(null);
    setCustomBadgeInput('');
  };

  // Redeem Reward in Shop
  const handleRedeemReward = (reward: GardenReward) => {
    if (!activeStudent || !activeGarden) return;

    if (reward.type === 'HARVEST') {
      const { currentStage } = getStageInfo(activeGarden.water);
      if (currentStage.level < 7) {
        playWarningDeductSound();
        showToast(`Cây của em chưa Kết Trái (Cấp 7 - 350💧). Hãy tiếp tục tưới nước chăm sóc cây nhé!`, 'warning');
        return;
      }

      setGardenData(prev => ({
        ...prev,
        [activeStudent.id]: {
          ...activeGarden,
          water: 0,
          logs: [
            {
              id: `log-${Date.now()}`,
              date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
              amount: 0,
              reason: `🍎 Thu hoạch mùa gặt: ${reward.title}`
            },
            ...activeGarden.logs
          ]
        }
      }));
      playVictoryFanfareSound();
      triggerStarsConfetti();
      showToast(`🎉 CHÚC MỪNG! Em đã thu hoạch mùa quả chín và nhận được quà "${reward.title}"! Cây đã được ươm lại hạt giống mới.`, 'success');
    } else {
      if (activeGarden.water < reward.cost) {
        playWarningDeductSound();
        showToast(`Em còn thiếu ${reward.cost - activeGarden.water} 💧 nữa mới đổi được món quà này!`, 'warning');
        return;
      }

      setGardenData(prev => ({
        ...prev,
        [activeStudent.id]: {
          ...activeGarden,
          water: activeGarden.water - reward.cost,
          logs: [
            {
              id: `log-${Date.now()}`,
              date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
              amount: -reward.cost,
              reason: `🎁 Đổi phần thưởng: ${reward.title}`
            },
            ...activeGarden.logs
          ]
        }
      }));
      playVictoryFanfareSound();
      triggerStarsConfetti();
      showToast(`🎁 Tuyệt vời! Em đã dùng ${reward.cost} 💧 đổi thành công món quà "${reward.title}"!`, 'success');
    }
  };

  // Add New Custom Reward
  const handleCreateReward = () => {
    if (!newRewardTitle.trim()) {
      showToast('Vui lòng nhập tên món quà!', 'warning');
      return;
    }

    const item: GardenReward = {
      id: `rew-${Date.now()}`,
      icon: newRewardIcon || '🎁',
      title: newRewardTitle.trim(),
      cost: newRewardCost || 100,
      type: newRewardType
    };

    setRewards(prev => [...prev, item]);
    setIsAddRewardModalOpen(false);
    setNewRewardTitle('');
    showToast(`Đã thêm món quà mới "${item.title}" vào Cửa Hàng!`, 'success');
  };

  // Seed Set Management Handlers
  const handleOpenEditSeedSet = (set: CustomSeedSet) => {
    setEditingSeedSet(set);
    setSeedSetName(set.name);
    setSeedSetLevels({
      1: set.levels[1] || '',
      2: set.levels[2] || '',
      3: set.levels[3] || '',
      4: set.levels[4] || '',
      5: set.levels[5] || '',
      6: set.levels[6] || '',
      7: set.levels[7] || ''
    });
    setIsSeedFormModalOpen(true);
  };

  const handleSaveSeedSet = () => {
    if (!seedSetName.trim()) {
      showToast('Vui lòng nhập tên bộ hạt giống!', 'warning');
      return;
    }

    const processedLevels = {
      1: convertGoogleDriveUrl(seedSetLevels[1] || ''),
      2: convertGoogleDriveUrl(seedSetLevels[2] || ''),
      3: convertGoogleDriveUrl(seedSetLevels[3] || ''),
      4: convertGoogleDriveUrl(seedSetLevels[4] || ''),
      5: convertGoogleDriveUrl(seedSetLevels[5] || ''),
      6: convertGoogleDriveUrl(seedSetLevels[6] || ''),
      7: convertGoogleDriveUrl(seedSetLevels[7] || '')
    };

    const newSet: CustomSeedSet = {
      id: editingSeedSet ? editingSeedSet.id : `seed-set-${Date.now()}`,
      name: seedSetName.trim(),
      icon: '🌾',
      levels: processedLevels,
      createdAt: editingSeedSet?.createdAt || new Date().toISOString()
    };

    // Calculate next sets array explicitly
    const nextSets = editingSeedSet
      ? customSeedSets.map(s => s.id === editingSeedSet.id ? newSet : s)
      : [...customSeedSets, newSet];

    // Mark local save timestamp to protect against cloud echo overwrite
    lastLocalSaveTimeRef.current = Date.now();

    // 1. Update React state immediately
    setCustomSeedSets(nextSets);

    // 2. Persist to localStorage & Supabase synchronously
    try {
      localStorage.setItem('deskos_custom_seed_sets_v1', JSON.stringify(nextSets));
      saveSupabaseState('school_custom_seed_sets', nextSets);
    } catch (e) {
      console.warn('Persistence save error:', e);
    }

    // 3. Handle student seed rename if editing
    if (editingSeedSet && editingSeedSet.name !== newSet.name) {
      const oldName = editingSeedSet.name;
      const newName = newSet.name;
      setGardenData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(stId => {
          if (updated[stId].seed === oldName) {
            updated[stId] = { ...updated[stId], seed: newName };
          }
        });
        return updated;
      });
    }

    showToast(editingSeedSet ? `Đã cập nhật bộ hạt giống "${newSet.name}"!` : `Đã lưu bộ hạt giống mới "${newSet.name}" vào Kho!`, 'success');

    // Reset Form inputs and navigate back to Seed Bank Sub-View
    setIsSeedFormModalOpen(false);
    setIsSeedBankModalOpen(true);
    setEditingSeedSet(null);
    setSeedSetName('');
    setSeedSetLevels({ 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '' });
  };

  const handleDeleteSeedSet = (id: string) => {
    const target = customSeedSets.find(s => s.id === id);
    if (!target) return;

    lastLocalSaveTimeRef.current = Date.now();

    const nextSets = customSeedSets.filter(s => s.id !== id);
    setCustomSeedSets(nextSets);
    try {
      localStorage.setItem('deskos_custom_seed_sets_v1', JSON.stringify(nextSets));
      saveSupabaseState('school_custom_seed_sets', nextSets);
    } catch (e) {}

    setGardenData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(stId => {
        if (updated[stId].seed === target.name) {
          updated[stId] = { ...updated[stId], seed: DEFAULT_SEED_NAME };
        }
      });
      return updated;
    });

    showToast(`Đã xóa bộ hạt giống "${target.name}" khỏi Kho!`, 'info');
  };

  const handleRandomizeSeedsForClass = () => {
    if (classStudents.length === 0) {
      showToast('Lớp hiện tại chưa có học sinh!', 'warning');
      return;
    }

    const availableSets = [
      DEFAULT_SEED_NAME,
      ...customSeedSets.map(s => s.name)
    ];

    const updated = { ...gardenData };
    classStudents.forEach(s => {
      const randomSeed = availableSets[Math.floor(Math.random() * availableSets.length)];
      const currentG = getStudentGarden(s.id);
      updated[s.id] = {
        ...currentG,
        seed: randomSeed
      };
    });

    setGardenData(updated);
    playVictoryFanfareSound();
    triggerStarsConfetti();
    showToast(`🎲 Đã gán ngẫu nhiên bộ hạt giống 7 cấp cho toàn bộ ${classStudents.length} học sinh lớp ${selectedClass}!`, 'success');
  };

  const handleStudentSeedChange = (studentId: string, newSeedName: string) => {
    const currentG = getStudentGarden(studentId);
    setGardenData(prev => ({
      ...prev,
      [studentId]: {
        ...currentG,
        seed: newSeedName
      }
    }));
    const st = students.find(s => s.id === studentId);
    showToast(`Đã thay đổi bộ hạt giống cho ${st ? st.name : 'học sinh'} sang "${newSeedName}"!`, 'success');
  };

  const handleFileUploadForLevel = async (level: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      showToast(`Đang nén & tối ưu ảnh Level ${level} sang chuẩn WebP...`, 'info');
      const compressedDataUrl = await compressImageToWebP(file, 600, 0.8);
      setSeedSetLevels(prev => ({
        ...prev,
        [level]: compressedDataUrl
      }));
      showToast(`✨ Đã nạp & nén WebP siêu nhẹ thành công cho Level ${level}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đọc tệp ảnh từ máy tính, vui lòng thử lại!', 'error');
    }
  };

  // Nạp hàng loạt 7 tệp ảnh cùng lúc từ Máy tính (Auto nén WebP)
  const handleBatchFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length === 0) return;

    const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    showToast(`Đang tự động nén WebP hàng loạt ${sortedFiles.length} tệp ảnh...`, 'info');

    const updatedLevels = { ...seedSetLevels };
    let count = 0;

    for (let i = 0; i < Math.min(7, sortedFiles.length); i++) {
      try {
        const file = sortedFiles[i];
        const webpUrl = await compressImageToWebP(file, 600, 0.8);
        updatedLevels[(i + 1) as keyof typeof updatedLevels] = webpUrl;
        count++;
      } catch (err) {}
    }

    setSeedSetLevels(updatedLevels);
    showToast(`🎉 Tuyệt vời! Đã tự động nén WebP & gán ${count} ảnh cấp độ từ máy tính!`, 'success');
  };

  // Export Class Garden TXT Report
  const handleExportReport = () => {
    let reportText = `📊 BÁO CÁO THI ĐUA KHU VƯỜN TRI THỨC • LỚP ${selectedClass}\n`;
    reportText += `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}\n`;
    reportText += `=====================================================\n\n`;

    classStudents.forEach((s, idx) => {
      const g = getStudentGarden(s.id);
      const { currentStage } = getStageInfo(g.water);
      reportText += `${idx + 1}. ${s.name} (MSHS: ${s.code})\n`;
      reportText += `   - Loại cây: ${g.seed}\n`;
      reportText += `   - Tổng giọt nước: ${g.water} 💧\n`;
      reportText += `   - Cấp độ tăng trưởng: Cấp ${currentStage.level} (${currentStage.name})\n`;
      reportText += `   - Huy hiệu: ${g.badges.join(', ') || 'Chưa có'}\n\n`;
    });

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Bao_Cao_Vuon_Tri_Thuc_Lop_${selectedClass}.txt`;
    a.click();
    showToast('Đã tải xuống file báo cáo tổng hợp thi đua Khu vườn tri thức!', 'success');
  };

  // Reset all student garden data for current class back to Level 1 (0 💧)
  const handleResetGardenData = () => {
    if (window.confirm(`Xác nhận đặt lại toàn bộ dữ liệu thi đua Khu Vườn Tri Thức Lớp ${selectedClass} về Cấp 1 (0 💧)?`)) {
      const updated = { ...gardenData };
      classStudents.forEach(s => {
        updated[s.id] = {
          studentId: s.id,
          seed: DEFAULT_SEED_NAME,
          water: 0,
          badges: [],
          logs: []
        };
      });
      setGardenData(updated);
      showToast(`Đã đặt lại dữ liệu Khu Vườn Lớp ${selectedClass} về Cấp 1 (0 💧)!`, 'info');
    }
  };

  // Grade Filtered Students
  const getGradeFilteredStudents = () => {
    if (gradeFilter === 'ALL') return students;
    return students.filter(s => {
      const cls = classes.find(c => c.id === s.classId);
      if (cls) return cls.gradeId === parseInt(gradeFilter);
      return s.classId.startsWith(gradeFilter) || s.classId.includes(`Ba ${gradeFilter}`) || s.classId.includes(`Bốn ${gradeFilter}`) || s.classId.includes(`Năm ${gradeFilter}`);
    });
  };

  const gradeFilteredStudents = getGradeFilteredStudents();

  // Filtered lists
  const filteredClassGarden = (gradeFilter === 'ALL' ? classStudents : gradeFilteredStudents).filter(s => {
    const matchName = s.name.toLowerCase().includes(classSearch.toLowerCase()) || s.code.toLowerCase().includes(classSearch.toLowerCase());
    const g = getStudentGarden(s.id);
    const { currentStage } = getStageInfo(g.water);
    const matchStage = classStageFilter === 'ALL' || currentStage.level === parseInt(classStageFilter);
    return matchName && matchStage;
  });

  const filteredTeacherStudents = classStudents.filter(s => 
    s.name.toLowerCase().includes(teacherSearch.toLowerCase()) || s.code.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // --- INLINE SUB-VIEW 1: THIẾT LẬP / SỬA BỘ HẠT GIỐNG MỚI (100% TAKEOVER) ---
  if (isSeedFormModalOpen) {
    return (
      <div className="space-y-6 text-slate-800 pb-10">
        {/* Header Bar with Back Button */}
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSeedFormModalOpen(false);
                  setEditingSeedSet(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Kho Hạt Giống
              </button>
              <div>
                <h3 className="font-black text-sm sm:text-base text-[#3d2b17] flex items-center gap-2">
                  <span>🌱</span> {editingSeedSet ? 'CHỈNH SỬA BỘ HẠT GIỐNG' : 'THIẾT LẬP BỘ HẠT GIỐNG MỚI'}
                </h3>
                <p className="text-[11px] font-bold text-[#5c4327]">
                  Nhập tên bộ cây và tải ảnh lên từ máy tính hoặc dán Link/Google Drive cho 7 cấp độ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsSeedFormModalOpen(false);
                  setEditingSeedSet(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-black text-slate-700 text-xs transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSeedSet}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Lưu Bộ Hạt Giống
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Name Input & Batch Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">TÊN BỘ HẠT GIỐNG:</label>
              <input
                type="text"
                value={seedSetName}
                onChange={(e) => setSeedSetName(e.target.value)}
                placeholder="VD: Cây Táo Thần 7 Màu"
                className="w-full px-4 py-3 text-xs font-bold rounded-2xl border border-slate-300 bg-slate-50/50 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="relative flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-black text-xs transition-all shadow-2xs cursor-pointer active:scale-95">
                <UploadCloud className="w-4 h-4 text-sky-600" />
                <span>📂 Chọn 7 Tệp Máy Tính (Auto WebP)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBatchFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 7 Level Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { level: 1, name: 'Hạt giống', icon: '🌰' },
              { level: 2, name: 'Nảy mầm', icon: '🌱' },
              { level: 3, name: 'Hai lá', icon: '🌿' },
              { level: 4, name: 'Cây non', icon: '🪴' },
              { level: 5, name: 'Cây lớn', icon: '🌲' },
              { level: 6, name: 'Ra hoa', icon: '🌸' },
              { level: 7, name: 'Kết trái', icon: '🍎' },
            ].map(st => {
              const currentUrl = seedSetLevels[st.level as keyof typeof seedSetLevels] || '';
              const processedUrl = convertGoogleDriveUrl(currentUrl);
              const driveFileId = extractGoogleDriveFileId(currentUrl);

              return (
                <div key={st.level} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3 flex flex-col justify-between hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-center font-black text-xs text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span>{st.icon}</span> Level {st.level}: {st.name}
                    </span>
                    {processedUrl ? (
                      <img 
                        src={processedUrl} 
                        alt={`Preview ${st.level}`} 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
                        onError={(e) => handleGardenDriveImageError(e, currentUrl, GARDEN_STAGES[st.level - 1].fallbackUrl)}
                      />
                    ) : (
                      <span className="text-2xl">{st.icon}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Link Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">Dán Link / Google Drive:</label>
                        {driveFileId ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            🟢 Drive OK
                          </span>
                        ) : currentUrl.startsWith('data:image/') ? (
                          <span className="text-[9px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                            📁 Ảnh Máy Tính
                          </span>
                        ) : currentUrl ? (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                            🌐 Link Web
                          </span>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={currentUrl}
                        onChange={(e) => setSeedSetLevels(prev => ({ ...prev, [st.level]: e.target.value }))}
                        placeholder="Dán Link Google Drive hoặc Link Ảnh"
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                    </div>

                    {/* File Input */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <UploadCloud className="w-3 h-3 text-emerald-600" />
                        <span>Tải ảnh từ Máy Tính (Auto nén WebP):</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUploadForLevel(st.level, e)}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setIsSeedFormModalOpen(false);
                setEditingSeedSet(null);
              }}
              className="px-6 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 font-black text-slate-700 text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveSeedSet}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Lưu Bộ Hạt Giống
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- INLINE SUB-VIEW 2: KHO HẠT GIỐNG TRI THỨC (100% TAKEOVER) ---
  if (isSeedBankModalOpen) {
    return (
      <div className="space-y-6 text-slate-800 pb-10">
        {/* Header Bar with Back Button */}
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSeedBankModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Bảng Quản Lý
              </button>
              <div>
                <h3 className="font-black text-sm sm:text-base text-[#3d2b17] flex items-center gap-2">
                  <span>🌾</span> KHO HẠT GIỐNG TRI THỨC (7 CẤP ĐỘ)
                </h3>
                <p className="text-[11px] font-bold text-[#5c4327]">Tạo bộ hình ảnh tăng trưởng cây từ Level 1 đến Level 7 cho học sinh.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRandomizeSeedsForClass}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>🎲</span> Gán Ngẫu Nhiên Cho Cả Lớp
              </button>

              <button
                onClick={() => {
                  setEditingSeedSet(null);
                  setSeedSetName('');
                  setSeedSetLevels({ 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '' });
                  setIsSeedFormModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>➕</span> Tạo Bộ Hạt Giống Mới
              </button>
            </div>
          </div>
        </div>

        {/* Seed Sets Cards List */}
        <div className="space-y-4">
          {/* Render Default Set */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                <span>🌸</span> Cây Hoa Đào (Mặc định Hệ thống)
              </h4>
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                Gói mặc định
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {GARDEN_STAGES.map(st => (
                <div key={st.level} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-200 space-y-1.5">
                  <span className="text-xs font-black text-slate-400 block">Lvl {st.level}</span>
                  <img 
                    src={st.imgUrl} 
                    alt={st.name} 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-auto object-contain mx-auto my-1 filter drop-shadow-2xs" 
                    onError={(e) => handleGardenDriveImageError(e, st.imgUrl, st.fallbackUrl)}
                  />
                  <span className="text-[10px] font-bold text-slate-500 block truncate">{st.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Render Custom Seed Sets */}
          {customSeedSets.map(set => (
            <div key={set.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-emerald-400 transition-colors">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <span>{set.icon || '🌾'}</span> {set.name}
                </h4>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditSeedSet(set)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteSeedSet(set.id)}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>

              {/* 7 Levels Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map(lvl => {
                  const img = set.levels[lvl as keyof typeof set.levels];
                  const stageDefault = GARDEN_STAGES[lvl - 1];
                  const processedUrl = convertGoogleDriveUrl(img);
                  const driveFileId = extractGoogleDriveFileId(img);

                  return (
                    <div key={lvl} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-200 space-y-1.5">
                      <span className="text-xs font-black text-slate-400 block">Lvl {lvl}</span>
                      {processedUrl ? (
                        <img 
                          src={processedUrl} 
                          alt={`Lvl ${lvl}`} 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          className="h-14 w-auto object-contain mx-auto my-1 filter drop-shadow-2xs" 
                          onError={(e) => handleGardenDriveImageError(e, img, stageDefault.fallbackUrl)}
                        />
                      ) : (
                        <span className="text-3xl block my-2">{stageDefault.icon}</span>
                      )}
                      <span className="text-[10px] font-bold text-slate-500 block truncate">{stageDefault.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 text-slate-800 pb-10">
      
      {/* 🌟 1. DESKOS IMAC WARM BEIGE CARD HEADER STRIP */}
      <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2 text-left">
            <span className="font-bold text-xs text-[#5c4327]">Đang chọn:</span>
            <span className="font-black text-xs text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-[#cbb89d]">
              {gradeFilter === 'ALL' ? `Lớp ${selectedClass}` : `Toàn Khối ${gradeFilter}`}
            </span>
          </div>

          {/* Navigation Tab Buttons */}
          <nav className="flex items-center gap-1 bg-[#e4d3ba] p-1 rounded-xl border border-[#cbb89d] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('class')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'class'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <span>🌎</span> Vườn Cả Lớp
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'student'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <span>🏡</span> Vườn Của Em
            </button>
            <button
              onClick={() => setActiveTab('reward')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'reward'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <span>🎁</span> Đổi Thưởng
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'teacher'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <span>👩‍🏫</span> Giáo Viên
            </button>
          </nav>
        </div>
      </div>

      {/* ================= 🌎 TAB 2: VƯỜN CẢ LỚP (CLASS GARDEN GRID) ================= */}
      {activeTab === 'class' && (
        <div className="space-y-6">
          
          {/* Garden Header & Filter Bar */}
          <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                  <span>🌳</span> KHU VƯỜN {gradeFilter === 'ALL' ? `LỚP ${selectedClass}` : `TOÀN KHỐI ${gradeFilter}`}
                </h3>
                <p className="text-[11px] font-bold text-[#5c4327]">Mỗi chậu cây biểu trưng cho quá trình cố gắng thi đua của một người bạn!</p>
              </div>

              {/* Controls & Grade Filter */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 🏫 NÚT XEM THEO TỪNG KHỐI (KHỐI 3, 4, 5) */}
                <div className="flex items-center gap-1 bg-[#e4d3ba] p-1 rounded-xl border border-[#cbb89d]">
                  <span className="text-[10px] font-black text-[#5c4327] px-1.5 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Lọc Khối:
                  </span>
                  <button
                    onClick={() => setGradeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      gradeFilter === 'ALL' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    Lớp {selectedClass}
                  </button>
                  <button
                    onClick={() => setGradeFilter('3')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      gradeFilter === '3' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    Khối 3
                  </button>
                  <button
                    onClick={() => setGradeFilter('4')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      gradeFilter === '4' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    Khối 4
                  </button>
                  <button
                    onClick={() => setGradeFilter('5')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      gradeFilter === '5' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    Khối 5
                  </button>
                </div>

                <div className="relative w-full sm:w-44">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    placeholder="Tìm bạn..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-[#cbb89d] bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={classStageFilter}
                  onChange={(e) => setClassStageFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-black rounded-xl border border-[#cbb89d] bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Tất cả 7 cấp độ</option>
                  {GARDEN_STAGES.map(st => (
                    <option key={st.level} value={st.level}>Cấp {st.level} - {st.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Grid */}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredClassGarden.length > 0 ? (
                filteredClassGarden.map(student => {
                  const g = getStudentGarden(student.id);
                  const { currentStage } = getStageInfo(g.water);
                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        setActiveStudentId(student.id);
                        setActiveTab('student');
                        showToast(`Đã chuyển sang xem Cây của em ${student.name}!`, 'info');
                      }}
                      className="bg-white rounded-2xl p-4 text-center border border-[#cbb89d] hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1 group"
                    >
                      <img 
                        src={getStageImageUrl(g.seed, currentStage.level).url} 
                        alt={currentStage.name} 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleGardenDriveImageError(e, g.seed, getStageImageUrl(g.seed, currentStage.level).fallback)}
                        className="h-32 w-auto object-contain mx-auto my-2 group-hover:scale-105 transition-transform filter drop-shadow-xs" 
                      />
                      <div className="font-black text-xs text-slate-900 truncate">{student.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">Cấp {currentStage.level}: {currentStage.name}</div>
                      <div className="mt-3 inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-black text-[11px] border border-sky-200">
                        💧 {g.water} giọt
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-slate-400 font-bold text-xs">
                  Không tìm thấy chậu cây nào phù hợp trong {gradeFilter === 'ALL' ? `Lớp ${selectedClass}` : `Khối ${gradeFilter}`}.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ================= 🏡 TAB 1: VƯỜN CỦA EM (STUDENT PERSONAL VIEW) ================= */}
      {activeTab === 'student' && activeStudent && activeGarden && activeStageInfo && (
        <div className="space-y-6">
          
          {/* Active Student Picker */}
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800">👦 Học Sinh Xem Cây:</span>
              <select
                value={activeStudentId}
                onChange={(e) => setActiveStudentId(e.target.value)}
                className="bg-transparent text-xs font-black text-emerald-900 focus:outline-none cursor-pointer"
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Profile Card & Interactive Tree View Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Profile Panel */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="text-center space-y-3">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-100 to-green-50 border-4 border-emerald-400 flex items-center justify-center text-5xl shadow-inner">
                    {activeStudent.gender === 'Nữ' ? '👧' : '👦'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                    Cấp {activeStageInfo.currentStage.level}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">{activeStudent.name}</h3>
                  <p className="text-xs font-bold text-slate-500">MSHS: {activeStudent.code} • Lớp {selectedClass}</p>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-xl border border-amber-200 font-extrabold text-xs">
                  <span>{activeGarden.seed || DEFAULT_SEED_NAME}</span>
                </div>
              </div>

              {/* Stats Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">💧 Đã tích lũy:</span>
                  <span className="font-black text-sky-600 text-sm">{activeGarden.water} giọt</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">🏆 Cấp độ hiện tại:</span>
                  <span className="font-black text-emerald-700">Cấp {activeStageInfo.currentStage.level} - {activeStageInfo.currentStage.name}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="font-bold text-slate-600">🎯 Cần để lên cấp:</span>
                  <span className="font-black text-amber-600">
                    {activeStageInfo.currentStage.level === 7 
                      ? 'Đã Đạt Tối Đa!' 
                      : `${activeStageInfo.nextStage.min - activeGarden.water} giọt`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive Tree Canvas */}
            <div className="lg:col-span-8 bg-gradient-to-b from-sky-50/70 via-sky-50/30 to-white rounded-3xl p-6 sm:p-8 border border-sky-200/70 shadow-sm flex flex-col items-center justify-between relative overflow-hidden min-h-[440px]">
              
              {/* Header Canvas */}
              <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider z-20">
                <span>Vườn Cây Học Tập 2026</span>
                <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-[11px] font-black">
                  👉 Chạm cây để tự tưới nước!
                </span>
              </div>

              {/* Tree Display Image with falling & floating drops */}
              <div 
                className="relative my-4 group cursor-pointer select-none overflow-hidden rounded-3xl z-20"
                onClick={handleTreeClick}
              >
                <img
                  src={getStageImageUrl(activeGarden.seed, activeStageInfo.currentStage.level).url}
                  alt={activeStageInfo.currentStage.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => handleGardenDriveImageError(e, activeGarden.seed, getStageImageUrl(activeGarden.seed, activeStageInfo.currentStage.level).fallback)}
                  className="h-60 sm:h-72 object-contain filter drop-shadow-md mx-auto transition-transform duration-300 hover:scale-105 active:scale-95"
                />

                {/* Falling Water Drops Animation from canopy down to tree soil */}
                {fallingWaterDrops.map(drop => (
                  <div
                    key={drop.id}
                    className="absolute pointer-events-none z-20 animate-water-drop-fall"
                    style={{ left: `${drop.left}%`, top: '5%' }}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow-md">💧</span>
                  </div>
                ))}

                {/* Floating drops overlay */}
                {floatingWaterDrops.map(drop => (
                  <div
                    key={drop.id}
                    className="absolute pointer-events-none font-black text-sky-600 text-lg drop-shadow-md animate-bounce"
                    style={{ left: `${drop.x}px`, top: `${drop.y}px` }}
                  >
                    {drop.text}
                  </div>
                ))}
              </div>

              {/* Stage Description */}
              <div className="text-center space-y-1 mb-4 z-20">
                <h3 className="text-2xl font-black text-emerald-900">Cấp {activeStageInfo.currentStage.level}: {activeStageInfo.currentStage.name}</h3>
                <p className="text-xs font-bold text-slate-500">{activeStageInfo.currentStage.desc}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xl space-y-2 z-20">
                <div className="relative w-full bg-slate-200/80 h-7 rounded-full overflow-hidden p-1 shadow-inner">
                  {(() => {
                    let pct = 100;
                    if (activeStageInfo.currentStage.level < 7) {
                      const range = activeStageInfo.nextStage.min - activeStageInfo.currentStage.min;
                      const currentProgress = activeGarden.water - activeStageInfo.currentStage.min;
                      pct = Math.min(100, Math.max(0, (currentProgress / range) * 100));
                    }
                    return (
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 rounded-full transition-all duration-500 relative"
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })()}
                  <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-white drop-shadow-md">
                    {activeGarden.water} / {activeStageInfo.nextStage.min} 💧
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-black text-slate-500 px-1">
                  <span>Cấp {activeStageInfo.currentStage.level} ({activeStageInfo.currentStage.min}💧)</span>
                  <span>Cấp {activeStageInfo.nextStage.level} ({activeStageInfo.nextStage.min}💧)</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6 z-20">
                <button
                  onClick={() => addWaterToStudent(activeStudent.id, 5, 'Chăm chỉ tự tưới cây')}
                  className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>💧</span> Tưới Nước (+5)
                </button>
                <button
                  onClick={() => setActiveTab('reward')}
                  className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs shadow-md shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>🍎</span> Đổi Thưởng
                </button>
              </div>

            </div>

          </div>

          {/* 7 Growth Stages Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wider">
              <span>🌱</span> Lộ Trình 7 Cấp Độ Tăng Trưởng
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {GARDEN_STAGES.map(st => {
                const isActive = st.level === activeStageInfo.currentStage.level;
                const isPassed = activeGarden.water >= st.min;
                return (
                  <div
                    key={st.level}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      isActive 
                        ? 'bg-emerald-100 border-2 border-emerald-500 shadow-xs scale-105' 
                        : isPassed 
                          ? 'bg-emerald-50/60 border border-emerald-200' 
                          : 'bg-slate-50 border border-slate-200 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-1">{st.icon}</div>
                    <span className="block text-xs font-black text-slate-800">Cấp {st.level}</span>
                    <span className="block text-[10px] font-bold text-slate-500">{st.min} 💧</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Logs & Virtue Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Logs Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">📜 Lịch Sử Tưới Nước & Việc Tốt</span>
                <span className="text-xs text-slate-400 font-bold">{activeGarden.logs.length} ghi nhận</span>
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeGarden.logs.length > 0 ? (
                  activeGarden.logs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold">
                      <div>
                        <div className="text-slate-800 font-black">{log.reason}</div>
                        <div className="text-[10px] text-slate-400">{log.date}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        log.amount >= 0 ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {log.amount >= 0 ? `+${log.amount}` : log.amount} 💧
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-bold text-slate-400 p-3 text-center">Chưa có nhật ký tưới nước.</div>
                )}
              </div>
            </div>

            {/* Badges Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>🏅</span> Huy Hiệu Đức Tính Đạt Được
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {activeGarden.badges.length > 0 ? (
                  activeGarden.badges.map((badge, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 shadow-2xs">
                      {badge}
                    </span>
                  ))
                ) : (
                  <div className="text-xs font-bold text-slate-400 p-2">Chưa có huy hiệu nào.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================= 🎁 TAB 3: KHO THU HOẠCH & ĐỔI THƯỞNG (REWARDS) ================= */}
      {activeTab === 'reward' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 rounded-3xl p-6 text-center border border-amber-200 shadow-xs space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-amber-950">🎁 KHO THU HOẠCH & ĐỔI PHẦN THƯỞNG</h3>
            <p className="text-xs font-bold text-amber-800 max-w-2xl mx-auto">
              Dùng giọt nước chăm chỉ của em hoặc thu hoạch trái chín (Cấp 7 - Kết Trái) để đổi phần thưởng xứng đáng!
            </p>
          </div>

          {/* Reward Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewards.map(item => {
              const isHarvest = item.type === 'HARVEST';
              return (
                <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between text-center space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="text-6xl my-2">{item.icon}</div>
                    <h4 className="font-black text-slate-900 text-sm leading-snug">{item.title}</h4>
                    <div className={`text-xs font-black inline-block px-3 py-1 rounded-full ${
                      isHarvest ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {isHarvest ? '🍎 Yêu cầu Kết Trái (Cấp 7)' : `${item.cost} 💧 Giọt Nước`}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeemReward(item)}
                    className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all shadow-xs active:scale-95 ${
                      isHarvest 
                        ? 'bg-amber-400 hover:bg-amber-500 text-amber-950' 
                        : 'bg-sky-500 hover:bg-sky-600 text-white'
                    }`}
                  >
                    {isHarvest ? '🍎 Thu Hoạch & Đổi Quà' : '🎁 Đổi Quà Ngay'}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ================= 👩‍🏫 TAB 4: GIÁO VIÊN QUẢN LÝ (TEACHER DASHBOARD) ================= */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          
          {/* Teacher Header Bar */}
          <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
            
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                  <span>👩‍🏫</span> BẢNG QUẢN LÝ THI ĐUA KHU VƯỜN • LỚP {selectedClass}
                </h3>
                <p className="text-[11px] font-bold text-[#5c4327]">Tặng giọt nước khen thưởng, trao huy hiệu và xuất báo cáo thi đua.</p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">

                <button
                  onClick={() => setIsSeedBankModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>🌾</span> Kho Hạt Giống (7 Cấp)
                </button>

                <button
                  onClick={handleAddWaterToAll}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>💧</span> Thưởng Cả Lớp (+5)
                </button>
                <button
                  onClick={() => setIsAddRewardModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>🎁</span> Thêm Quà Mới
                </button>
                <button
                  onClick={handleResetGardenData}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition-all flex items-center gap-1.5"
                  title="Đặt lại tất cả cây về Cấp 1 (0 giọt)"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Đặt Lại Cây (0💧)
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#fffbf0] space-y-4">
              {/* Search Input */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Tìm tên hoặc MSHS..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-[#cbb89d] bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#cbb89d] bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#e8d7c0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                      <th className="p-3.5 whitespace-nowrap">Học Sinh</th>
                      <th className="p-3.5 whitespace-nowrap">Mã MSHS</th>
                      <th className="p-3.5 whitespace-nowrap">Bộ Hạt Giống</th>
                      <th className="p-3.5 whitespace-nowrap">Cấp Độ</th>
                      <th className="p-3.5 whitespace-nowrap">Giọt Nước</th>
                      <th className="p-3.5 whitespace-nowrap">Huy Hiệu</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Hành Động Khen Thưởng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {filteredTeacherStudents.length > 0 ? (
                      filteredTeacherStudents.map(student => {
                        const g = getStudentGarden(student.id);
                        const { currentStage } = getStageInfo(g.water);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-black text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{student.gender === 'Nữ' ? '👧' : '👦'}</span>
                                <span>{student.name}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">{student.code}</td>
                            <td className="p-3.5">
                              <select
                                value={g.seed || DEFAULT_SEED_NAME}
                                onChange={(e) => handleStudentSeedChange(student.id, e.target.value)}
                                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-emerald-500 text-slate-800 shadow-2xs cursor-pointer max-w-[200px]"
                              >
                                <option value={DEFAULT_SEED_NAME}>🌱 Tiêu chuẩn (🌸 Cây Hoa Đào)</option>
                                {customSeedSets.map(set => (
                                  <option key={set.id} value={set.name}>
                                    {set.icon || '🌾'} {set.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
                                <span className="text-sm">{currentStage.icon}</span>
                                <span>Cấp {currentStage.level} - {currentStage.name}</span>
                              </span>
                            </td>
                            <td className="p-3.5 text-sky-600 font-black">{g.water} 💧</td>
                            <td className="p-3.5">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {g.badges.map((b, idx) => (
                                  <span key={idx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">{b}</span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setWaterModalStudent(student)}
                                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-black text-xs flex items-center gap-1"
                                >
                                  💧 +Nước
                                </button>
                                <button
                                  onClick={() => setBadgeModalStudent(student)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-xs flex items-center gap-1"
                                >
                                  🏅 +Huy hiệu
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                          Chưa có học sinh nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================= 🛠️ MODALS ================= */}

      {/* 1. WATER MODAL */}
      {waterModalStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="text-4xl mb-1">💧</div>
              <h3 className="text-lg font-black text-slate-900">Tặng Giọt Nước Khen Thưởng</h3>
              <p className="text-xs font-bold text-sky-600">Học sinh: {waterModalStudent.name} ({waterModalStudent.code})</p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2 text-xs font-black">
              {[1, 2, 3, 5, 10, 20].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSelectedWaterAmount(amt)}
                  className={`p-3 rounded-2xl border-2 transition-all ${
                    selectedWaterAmount === amt ? 'bg-sky-50 text-sky-700 border-sky-500' : 'bg-slate-50 text-slate-700 border-transparent hover:border-slate-300'
                  }`}
                >
                  +{amt} 💧
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Lý do khen thưởng:</label>
              <input
                type="text"
                value={waterReason}
                onChange={(e) => setWaterReason(e.target.value)}
                placeholder="Ví dụ: Giúp đỡ bạn, Hăng hái phát biểu..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setWaterModalStudent(null)}
                className="w-1/2 py-2.5 rounded-2xl bg-slate-100 font-black text-slate-700 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  addWaterToStudent(waterModalStudent.id, selectedWaterAmount, waterReason || 'Giáo viên khen thưởng');
                  setWaterModalStudent(null);
                  showToast(`Đã tặng +${selectedWaterAmount} 💧 cho ${waterModalStudent.name}!`, 'success');
                }}
                className="w-1/2 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 font-black text-white text-xs shadow-xs"
              >
                Lưu & Tặng Nước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BADGE MODAL */}
      {badgeModalStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="text-4xl mb-1">🏅</div>
              <h3 className="text-lg font-black text-slate-900">Trao Tặng Huy Hiệu Đức Tính</h3>
              <p className="text-xs font-bold text-emerald-700">Tặng cho em: {badgeModalStudent.name}</p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {['🌱 Mầm Xanh Cần Mẫn', '⭐ Chăm Chỉ Phát Biểu', '🤝 Bạn Tốt Trong Lớp', '🎨 Sáng Tạo Xuất Sắc'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setCustomBadgeInput(preset)}
                  className="p-3 rounded-2xl border border-slate-200 hover:bg-emerald-50 text-left"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên huy hiệu tự nhập:</label>
              <input
                type="text"
                value={customBadgeInput}
                onChange={(e) => setCustomBadgeInput(e.target.value)}
                placeholder="Ví dụ: 📚 Vua Đọc Sách"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBadgeModalStudent(null)}
                className="w-1/2 py-2.5 rounded-2xl bg-slate-100 font-black text-slate-700 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleAwardBadge}
                className="w-1/2 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-white text-xs shadow-xs"
              >
                Lưu & Trao Huy Hiệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD REWARD MODAL */}
      {isAddRewardModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 text-center">🎁 Thêm Quà Mới Vào Cửa Hàng</h3>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Biểu tượng Emoji:</label>
                <input
                  type="text"
                  value={newRewardIcon}
                  onChange={(e) => setNewRewardIcon(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên phần thưởng:</label>
                <input
                  type="text"
                  value={newRewardTitle}
                  onChange={(e) => setNewRewardTitle(e.target.value)}
                  placeholder="Ví dụ: Gấu bông tí hon"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Giá Giọt Nước (💧):</label>
                <input
                  type="number"
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Yêu cầu thu hoạch đặc biệt:</label>
                <select
                  value={newRewardType}
                  onChange={(e) => setNewRewardType(e.target.value as 'WATER' | 'HARVEST')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="WATER">Đổi bằng Giọt Nước thông thường</option>
                  <option value="HARVEST">Cần Kết Trái Cấp 7 (Thu Hoạch Mùa Vụ 🍎)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsAddRewardModalOpen(false)}
                className="w-1/2 py-2.5 rounded-2xl bg-slate-100 font-black text-slate-700 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateReward}
                className="w-1/2 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black text-white text-xs shadow-xs"
              >
                Tạo Quà Mới
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
