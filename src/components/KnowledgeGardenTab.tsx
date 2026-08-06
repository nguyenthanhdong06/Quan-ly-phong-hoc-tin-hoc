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
  Filter
} from 'lucide-react';
import { Student, ClassItem, GardenStudentData, GardenReward, WaterLog } from '../types';
import { triggerStarsConfetti } from '../utils/confetti';
import { 
  playStarRewardSound, 
  playVictoryFanfareSound, 
  playWarningDeductSound
} from '../utils/audioEffects';

interface KnowledgeGardenTabProps {
  students: Student[];
  selectedClass: string;
  classes: ClassItem[];
  onSelectClass?: (classId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

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

// Danh Sách Quà Mặc Định
const DEFAULT_REWARDS: GardenReward[] = [
  { id: 'rew-1', icon: '✏️', title: 'Bút chì màu dễ thương', cost: 100, type: 'WATER' },
  { id: 'rew-2', icon: '📓', title: 'Vở bài tập lò xo xinh xắn', cost: 200, type: 'WATER' },
  { id: 'rew-3', icon: '🎨', title: 'Bộ màu vẽ 24 màu sặc sỡ', cost: 350, type: 'HARVEST' },
  { id: 'rew-4', icon: '🧩', title: 'Đồ chơi lắp ráp trí tuệ', cost: 350, type: 'HARVEST' }
];

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

  // Modals state
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

  return (
    <div className="space-y-4 sm:space-y-6 text-slate-800 pb-10">
      
      {/* 🌟 1. DESKOS IMAC WARM BEIGE CARD HEADER STRIP */}
      <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-xl shadow-sm text-white font-bold">
              🌱
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
                KHU VƯỜN TRI THỨC • RÈN LUYỆN TÂM HỒN & THI ĐUA NẾP SỐNG
              </h2>
              <p className="text-[11px] font-bold text-[#5c4327]">
                Nuôi dưỡng mầm xanh học tập qua 7 cấp độ tăng trưởng • Đang chọn: <span className="font-black text-emerald-800">{gradeFilter === 'ALL' ? `Lớp ${selectedClass}` : `Toàn Khối ${gradeFilter}`}</span>
              </p>
            </div>
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
                        src={currentStage.imgUrl} 
                        alt={currentStage.name} 
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.dataset.triedFallback) {
                            target.dataset.triedFallback = 'true';
                            target.src = currentStage.fallbackUrl;
                          }
                        }}
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
                  <span>🌸 Cây Hoa Đào Tri Thức</span>
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
                  src={activeStageInfo.currentStage.imgUrl}
                  alt={activeStageInfo.currentStage.name}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = activeStageInfo.currentStage.fallbackUrl;
                    }
                  }}
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
                  onClick={handleAddWaterToAll}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>💧</span> Tặng Nước Cả Lớp (+5)
                </button>
                <button
                  onClick={() => setIsAddRewardModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>🎁</span> Thêm Quà Mới
                </button>
                <button
                  onClick={handleExportReport}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Báo Cáo TXT
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
                      <th className="p-3.5 whitespace-nowrap">Loại Cây</th>
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
                            <td className="p-3.5 text-slate-600">{g.seed}</td>
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
