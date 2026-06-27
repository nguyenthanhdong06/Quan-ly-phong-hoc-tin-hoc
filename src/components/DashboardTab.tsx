import React, { useMemo, useState } from 'react';
import { Grade, ClassItem, Student, Computer, DocumentItem, EmulationDataState } from '../types';
import { 
  Award, Monitor, Activity, Radio, AlertTriangle, FileText, ChevronRight, 
  CheckCircle, HelpCircle, Database, Cloud, RefreshCw, Layers, Users, 
  BookOpen, Sparkles, Trophy, Lightbulb, Compass, ShieldAlert, Zap, UserCheck,
  Calendar, BarChart2, Check, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';

// Custom Tooltip component for Recharts Grade Attendance Bar Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl shadow-lg text-xs space-y-1 text-left">
        <p className="font-extrabold text-slate-200 text-sm">{label}</p>
        <div className="border-t border-slate-800/80 my-1 pt-1 space-y-1">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Tỷ lệ: <strong className="text-indigo-350 font-extrabold text-xs">{data['Tỷ lệ chuyên cần (%)']}%</strong>
          </p>
          <p className="text-slate-400">
            Hiện diện: <strong className="text-emerald-400 font-bold">{data['Hiện diện']}</strong> / {data['Tổng số lượt']} lượt
          </p>
          {data.isSimulated && (
            <p className="text-[10px] text-amber-450 italic font-semibold">
              * Tỷ lệ tối thiểu thi đua của khối
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip component for Recharts Grade Emulation Comparison Bar Chart
const CustomEmulationTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 text-left">
        <p className="font-extrabold text-slate-200 text-sm">Lớp {label}</p>
        <div className="border-t border-slate-800 my-1 pt-1.5 space-y-1">
          <p className="flex items-center justify-between gap-6">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Tổng sao tích lũy:
            </span>
            <strong className="text-amber-400 font-extrabold text-xs">{data['Tổng sao thi đua']} ⭐</strong>
          </p>
          <p className="flex items-center justify-between gap-6">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Sao trung bình/HS:
            </span>
            <strong className="text-emerald-400 font-extrabold text-xs">{data['Sao trung bình/HS']} ⭐</strong>
          </p>
          <p className="flex items-center justify-between gap-6">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Nhãn quà đã đổi:
            </span>
            <strong className="text-indigo-400 font-extrabold text-xs">{data['Stickers đã đổi']} 🎁</strong>
          </p>
          <p className="text-[10px] text-slate-500 font-bold border-t border-slate-800 mt-1 pt-1 text-center">
            Sĩ số: {data['Sĩ số']} học sinh
          </p>
        </div>
      </div>
    );
  }
  return null;
};


interface DashboardTabProps {
  selectedClass: string;
  selectedDate?: string;
  grades: Grade[];
  classes: ClassItem[];
  students: Student[];
  computers: Computer[];
  seatingChart: { [classId: string]: { [computerId: string]: string } };
  attendanceData: any;
  evaluationData: any;
  emulationDataState: EmulationDataState;
  documents: DocumentItem[];
  currentUser: any;
  setActiveTab: (tab: string) => void;
  systemDateText: string;
  isSyncing?: boolean;
  supabaseError?: string | null;
  onForceSync?: () => Promise<void>;
  onForcePush?: () => Promise<void>;
}

export default function DashboardTab({
  selectedClass,
  selectedDate,
  grades,
  classes,
  students,
  computers,
  seatingChart,
  attendanceData,
  evaluationData,
  emulationDataState,
  documents,
  currentUser,
  setActiveTab,
  systemDateText,
  isSyncing = false,
  supabaseError = null,
  onForceSync,
  onForcePush
}: DashboardTabProps) {
  
  const [showDbInfo, setShowDbInfo] = useState(true);
  const [emulationMetric, setEmulationMetric] = useState<'total' | 'average' | 'stickers'>('total');

  // Attendance automatic warning system states
  const [absenceThreshold, setAbsenceThreshold] = useState<number>(3);
  const [filterByClass, setFilterByClass] = useState<'all' | 'selected'>('all');
  const [notifiedStudents, setNotifiedStudents] = useState<string[]>([]);
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [localToast, setLocalToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const triggerLocalToast = (message: string, type: 'success' | 'info' = 'success') => {
    setLocalToast({ show: true, message, type });
    setTimeout(() => {
      setLocalToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleNotifyParent = (studentName: string, id: string, count: number) => {
    if (notifiedStudents.includes(id)) return;
    setNotifiedStudents(prev => [...prev, id]);
    triggerLocalToast(`Đã tự động gửi thông báo liên hệ nhắc nhở về vi phạm vắng ${count} buổi của học sinh [${studentName}] đến Zalo/SMS phụ huynh thành công!`);
  };

  const toggleExpandStudent = (id: string) => {
    setExpandedStudents(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const studentAbsenceAlerts = useMemo(() => {
    if (!attendanceData || !students) return [];
    
    const list: {
      student: Student;
      className: string;
      absentCount: number;
      excusedCount: number;
      unexcusedCount: number;
      dates: { date: string; status: 'excused' | 'unexcused' }[];
    }[] = [];
    
    students.forEach(student => {
      let excusedCount = 0;
      let unexcusedCount = 0;
      const dates: { date: string; status: 'excused' | 'unexcused' }[] = [];
      
      Object.keys(attendanceData).forEach(dateKey => {
        const dayData = attendanceData[dateKey];
        if (dayData) {
          Object.keys(dayData).forEach(classId => {
            const classAttendance = dayData[classId];
            if (classAttendance && classAttendance[student.id]) {
              const status = classAttendance[student.id];
              if (status === 'excused') {
                excusedCount++;
                dates.push({ date: dateKey, status: 'excused' });
              } else if (status === 'unexcused') {
                unexcusedCount++;
                dates.push({ date: dateKey, status: 'unexcused' });
              }
            }
          });
        }
      });
      
      const totalAbsents = excusedCount + unexcusedCount;
      if (totalAbsents >= absenceThreshold) {
        const classObj = classes.find(c => c.id === student.classId);
        list.push({
          student,
          className: classObj ? classObj.name : student.classId,
          absentCount: totalAbsents,
          excusedCount,
          unexcusedCount,
          dates: dates.sort((a, b) => b.date.localeCompare(a.date)) // Mới nhất lên trước
        });
      }
    });
    
    return list.sort((a, b) => b.absentCount - a.absentCount);
  }, [students, attendanceData, classes, absenceThreshold]);

  const filteredAbsenceAlerts = useMemo(() => {
    if (filterByClass === 'all') {
      return studentAbsenceAlerts;
    } else {
      return studentAbsenceAlerts.filter(alert => alert.student.classId === selectedClass);
    }
  }, [studentAbsenceAlerts, filterByClass, selectedClass]);

  // Parse active month information and calculate school-wide grade level attendance
  const activeMonthYearLabel = useMemo(() => {
    const match = systemDateText.match(/tháng\s+(\d+)\s+năm\s+(\d+)/i);
    if (match) {
      return `Tháng ${match[1]}/${match[2]}`;
    }
    return "Tháng 06/2026";
  }, [systemDateText]);

  const monthlyGradeAttendanceData = useMemo(() => {
    let year = "2026";
    let month = "06";
    const dateMatch = systemDateText.match(/tháng\s+(\d+)\s+năm\s+(\d+)/i);
    if (dateMatch) {
      month = dateMatch[1];
      year = dateMatch[2];
    }
    // Expected prefix format: YYYY-MM
    const currentMonthPrefix = `${year}-${month.padStart(2, '0')}`;

    return grades.map(grade => {
      let presentTotal = 0;
      let possibleTotal = 0;

      const gradeClasses = classes.filter(c => c.gradeId === grade.id);
      const gradeClassIds = gradeClasses.map(c => c.id);

      // Aggregate all active attendance entries for dates belonging to this month
      Object.keys(attendanceData || {}).forEach(dateKey => {
        if (dateKey.startsWith(currentMonthPrefix)) {
          const dayClasses = attendanceData[dateKey];
          gradeClassIds.forEach(classId => {
            const classAttendance = dayClasses[classId];
            if (classAttendance) {
              const classStudents = students.filter(s => s.classId === classId);
              if (classStudents.length > 0) {
                classStudents.forEach(student => {
                  const status = classAttendance[student.id] || 'present';
                  if (status === 'present') {
                    presentTotal++;
                  }
                  possibleTotal++;
                });
              }
            }
          });
        }
      });

      let rate = 0;
      let isSimulated = false;
      if (students.length === 0) {
        rate = 0;
        presentTotal = 0;
        possibleTotal = 0;
      } else if (possibleTotal > 0) {
        rate = Math.round((presentTotal / possibleTotal) * 1000) / 10;
      } else {
        rate = 0;
        presentTotal = 0;
        possibleTotal = 0;
      }

      return {
        gradeId: grade.id,
        gradeName: grade.name,
        'Tỷ lệ chuyên cần (%)': rate,
        'Hiện diện': presentTotal,
        'Tổng số lượt': possibleTotal,
        isSimulated
      };
    });
  }, [grades, classes, attendanceData, systemDateText, students]);
  
  // Helpers
  const getStudentCumulativeStars = (studentId: string) => {
    const emulationState = emulationDataState[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
    
    // Sum from evaluations in evaluationData across all dates and classes
    let evaluatedSum = 0;
    if (evaluationData) {
      Object.keys(evaluationData).forEach(dateKey => {
        const dayData = evaluationData[dateKey];
        if (dayData) {
          Object.keys(dayData).forEach(classId => {
            const classData = dayData[classId];
            if (classData && classData[studentId]) {
              evaluatedSum += classData[studentId].rating || 0;
            }
          });
        }
      });
    }

    // Return the max of emulationState's cumulativeStars or the computed sum of evaluation ratings
    return Math.max(emulationState.cumulativeStars, evaluatedSum);
  };

  const getStudentCurrentStars = (studentId: string) => {
    const emulationState = emulationDataState[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
    
    const deducted = emulationState.totalDeducted !== undefined 
      ? emulationState.totalDeducted 
      : (emulationState.exchangedStickers || 0) * 5;

    const cumulative = getStudentCumulativeStars(studentId);
    return Math.max(0, cumulative - deducted);
  };

  // Memoized stats
  const stats = useMemo(() => {
    const totalComps = computers.length;
    const okComps = computers.filter(c => c.status === 'Hoạt động').length;
    const badComps = computers.filter(c => c.status === 'Đang hỏng').length;
    const maintComps = computers.filter(c => c.status === 'Bảo trì').length;
    
    const classSts = students.filter(s => s.classId === selectedClass);
    const assignedStsCount = Object.keys(seatingChart[selectedClass] || {}).length;

    // Sum of all stars awarded to current class
    let totalClassStars = 0;
    classSts.forEach(student => {
      totalClassStars += getStudentCurrentStars(student.id);
    });

    let totalStickersExchanged = 0;
    classSts.forEach(student => {
      const sEm = emulationDataState[student.id] || { exchangedStickers: 0 };
      totalStickersExchanged += sEm.exchangedStickers || 0;
    });

    const maleCount = classSts.filter(s => s.gender === 'Nam').length;
    const femaleCount = classSts.filter(s => s.gender === 'Nữ').length;
    
    const activeDateStr = selectedDate || new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceData[activeDateStr]?.[selectedClass] || {};
    const todayExcusedCount = classSts.filter(s => todayAttendance[s.id] === 'excused').length;
    const todayUnexcusedCount = classSts.filter(s => todayAttendance[s.id] === 'unexcused').length;
    const todayTotalAbsent = todayExcusedCount + todayUnexcusedCount;

    return {
      totalComps,
      okComps,
      badComps,
      maintComps,
      totalStudentsInClass: classSts.length,
      assignedStudents: assignedStsCount,
      unassignedStudents: Math.max(0, classSts.length - assignedStsCount),
      totalClassStars,
      totalStickersExchanged,
      maleCount,
      femaleCount,
      todayExcusedCount,
      todayUnexcusedCount,
      todayTotalAbsent
    };
  }, [computers, students, selectedClass, seatingChart, emulationDataState, selectedDate, attendanceData, evaluationData]);

  // Filter students for the Golden Board of Honor (having stars >= 20)
  const goldenBoardStudents = useMemo(() => {
    return students
      .filter(s => s.classId === selectedClass && getStudentCurrentStars(s.id) >= 20)
      .map(s => ({
        ...s,
        stars: getStudentCurrentStars(s.id),
        badges: emulationDataState[s.id]?.badges || []
      }))
      .sort((a, b) => b.stars - a.stars);
  }, [students, selectedClass, emulationDataState, evaluationData]);

  const activeClassObj = classes.find(c => c.id === selectedClass);

  const activeGradeName = useMemo(() => {
    const gradeId = activeClassObj ? activeClassObj.gradeId : (classes[0] ? classes[0].gradeId : 3);
    const g = grades.find(x => x.id === gradeId);
    return g ? g.name : `Khối ${gradeId}`;
  }, [activeClassObj, grades, classes]);

  const emulationComparisonData = useMemo(() => {
    const gradeId = activeClassObj ? activeClassObj.gradeId : (classes[0] ? classes[0].gradeId : 3);
    const sameGradeClasses = classes.filter(c => c.gradeId === gradeId);

    return sameGradeClasses.map(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      let totalStars = 0;
      let totalStickers = 0;

      clsStudents.forEach(st => {
        const emulationState = emulationDataState[st.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
        const deducted = emulationState.totalDeducted !== undefined 
          ? emulationState.totalDeducted 
          : (emulationState.exchangedStickers || 0) * 5;
        const cumulativeStars = getStudentCumulativeStars(st.id);
        const currentStars = Math.max(0, cumulativeStars - deducted);
        
        totalStars += currentStars;
        totalStickers += emulationState.exchangedStickers || 0;
      });

      const studentCount = clsStudents.length;
      const avgStars = studentCount > 0 ? parseFloat((totalStars / studentCount).toFixed(1)) : 0;

      return {
        classId: cls.id,
        className: cls.name,
        'Tổng sao thi đua': totalStars,
        'Sao trung bình/HS': avgStars,
        'Stickers đã đổi': totalStickers,
        'Sĩ số': studentCount,
      };
    }).sort((a, b) => b['Tổng sao thi đua'] - a['Tổng sao thi đua']);
  }, [activeClassObj, classes, students, emulationDataState, evaluationData]);

  const topSchoolStudents = useMemo(() => {
    const list = students
      .map(s => {
        const emulationState = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
        const deducted = emulationState.totalDeducted !== undefined 
          ? emulationState.totalDeducted 
          : (emulationState.exchangedStickers || 0) * 5;
        const cumulativeStars = getStudentCumulativeStars(s.id);
        const currentStars = Math.max(0, cumulativeStars - deducted);
        const classObj = classes.find(c => c.id === s.classId);
        
        return {
          id: s.id,
          name: s.name,
          cumulativeStars: cumulativeStars,
          currentStars,
          className: classObj ? classObj.name : s.classId,
          exchangedStickers: emulationState.exchangedStickers || 0,
          badges: emulationState.badges || [],
          isPlaceholder: false
        };
      })
      .sort((a, b) => b.currentStars - a.currentStars || b.cumulativeStars - a.cumulativeStars)
      .slice(0, 5);

    // Dynamic padding so the scoreboard structure holds exactly 5 slots for clean presentation
    while (list.length < 5) {
      const idx = list.length;
      list.push({
        id: `placeholder-${idx}`,
        name: 'Học sinh thi đua danh dự',
        cumulativeStars: 0,
        currentStars: 0,
        className: 'Chưa xếp',
        exchangedStickers: 0,
        badges: [],
        isPlaceholder: true
      });
    }

    return list;
  }, [students, classes, emulationDataState, evaluationData]);

  const activeMetricConfig = useMemo(() => {
    switch (emulationMetric) {
      case 'average':
        return {
          dataKey: 'Sao trung bình/HS',
          label: 'Sao trung bình / Học sinh',
          unit: '⭐',
          color: '#10b981',
          gradientId: 'emulationAvgGradient',
          stopColor1: '#10b981',
          stopColor2: '#34d399',
        };
      case 'stickers':
        return {
          dataKey: 'Stickers đã đổi',
          label: 'Tổng số Stickers đã nhận',
          unit: '🎁',
          color: '#6366f1',
          gradientId: 'emulationStickersGradient',
          stopColor1: '#4f46e5',
          stopColor2: '#818cf8',
        };
      case 'total':
      default:
        return {
          dataKey: 'Tổng sao thi đua',
          label: 'Tổng sao thi đua tích lũy',
          unit: '⭐',
          color: '#f59e0b',
          gradientId: 'emulationTotalGradient',
          stopColor1: '#f59e0b',
          stopColor2: '#fbbf24',
        };
    }
  }, [emulationMetric]);

  // Slogan based on class selection
  const educationalSlogan = useMemo(() => {
    const gradeLabel = activeClassObj ? String(activeClassObj.gradeId) : "";
    if (gradeLabel.includes('3')) return "Nhiệt huyết - Chăm chỉ - Vững bước khám phá bàn phím số!";
    if (gradeLabel.includes('4')) return "Sáng tạo bài tập trình chiếu - Làm chủ thế giới thông tin!";
    if (gradeLabel.includes('5')) return "Lập trình Scratch thông minh - Kiến tạo tư duy tương lai rực rỡ!";
    return "Sáng tạo công nghệ, vươn tầm tri thức học sinh Long Định!";
  }, [activeClassObj]);

  return (
    <div className="space-y-6">
      {/* CLOUD DATABASE CONNECTIVITY MODULE */}
      {showDbInfo && (
        <div id="supabase-db-monitor" className="bg-gradient-to-r from-emerald-950/90 to-slate-900/95 border border-emerald-500/30 p-4 rounded-2.5xl text-white shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 text-left">
              <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30 shrink-0">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Đồng bộ đám mây trực tuyến</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-emerald-300">
                  Kết nối thông suốt với máy chủ Supabase Database
                </h4>
                <p className="text-[10px] text-slate-300 font-medium">
                  Hạ tầng luôn an toàn. Mọi dữ liệu học sinh, số liệu thi đua, sao tích lũy được bảo toàn tuyệt đối.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                id="btn-force-sync-dashboard"
                onClick={onForceSync}
                disabled={isSyncing}
                className="bg-emerald-850 hover:bg-emerald-800 shadow border border-emerald-700/60 hover:border-emerald-500/80 text-[11px] text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                Đồng bộ lại dữ liệu
              </button>
              <button
                type="button"
                id="btn-hide-monitor-dashboard"
                onClick={() => setShowDbInfo(false)}
                className="bg-stone-850 hover:bg-stone-800 text-[11px] text-slate-400 hover:text-white font-bold px-2.5 py-1.5 rounded-xl border border-slate-700/40 transition cursor-pointer"
              >
                Ẩn bảng monitor
              </button>
            </div>
          </div>

          {/* Quick Metrics from Supabase */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t border-emerald-500/15 text-left">
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Phân loại Khối</span>
              <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1 mt-0.5">
                <Layers className="w-3 h-3 text-emerald-500" /> {grades.length} khối tiêu chuẩn
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Tổng số lớp</span>
              <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1 mt-0.5">
                🏫 {classes.length} Lớp đang quản lý
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Học sinh liên kết</span>
              <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3 text-emerald-400" /> {students.length} học sinh
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Máy trạm</span>
              <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1 mt-0.5">
                <Monitor className="w-3 h-3 text-emerald-400" /> {computers.length} chỗ ngồi
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/10 col-span-2 sm:col-span-1">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Học liệu số</span>
              <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1 mt-0.5">
                <BookOpen className="w-3 h-3 text-emerald-400" /> {documents.length} tài liệu số
              </span>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT HARDWARE STATUS GRID - EXTREMELY LIVELY WITH MICRO INSIGHTS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Tổng số máy trạm</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2.5xl font-black text-slate-800">{stats.totalComps}</span>
              <span className="text-[10px] text-slate-400 font-bold">máy</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              35 Thường + 5 Ghép cặp
            </div>
          </div>
          <div className="bg-indigo-50 text-indigo-500 p-2.5 rounded-xl group-hover:scale-110 transition duration-350 shrink-0">
            <Monitor className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider block">Đang hoạt động tốt</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2.5xl font-black text-emerald-600">{stats.okComps}</span>
              <span className="text-[10px] text-emerald-500 font-bold">máy tốt</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sẵn sàng vận hành 100%
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl group-hover:scale-110 transition duration-350 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider block">Thiết bị báo hỏng</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2.5xl font-black text-rose-600">{stats.badComps}</span>
              <span className="text-[10px] text-rose-400 font-bold">lỗi kĩ thuật</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-rose-500/80 font-bold">
              <ShieldAlert className="w-3 h-3 text-rose-500 animate-bounce" />
              Đang gửi phiếu sửa chữa
            </div>
          </div>
          <div className="bg-rose-50 text-rose-500 p-2.5 rounded-xl group-hover:scale-110 transition duration-350 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300 group">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-blue-500 font-black uppercase tracking-wider block">Đang bảo trì phần mềm</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2.5xl font-black text-blue-600">{stats.maintComps}</span>
              <span className="text-[10px] text-blue-400 font-bold">thiết bị</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-500/80 font-bold">
              <Zap className="w-3 h-3 text-blue-500 animate-spin" />
              Nâng cấp hệ sinh thái
            </div>
          </div>
          <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl group-hover:scale-110 transition duration-350 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* LOCAL TOAST NOTIFICATION FOR DEMO INTERACTIONS */}
      {localToast.show && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-950 border border-amber-800 text-white shadow-xl text-xs font-bold animate-pulse">
          <span className="text-sm">🛡️</span>
          <span>{localToast.message}</span>
        </div>
      )}

      {/* AUTOMATIC ATTENDANCE WARNING BOARD */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-rose-100/40 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-50 text-rose-500 p-2.5 rounded-2xl border border-rose-200/50">
              <ShieldAlert className="w-6 h-6 text-rose-650 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                Hệ Thống Cảnh Báo Chuyên Cần Tự Động
                {filteredAbsenceAlerts.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                    {filteredAbsenceAlerts.length} học sinh
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">Tự động phát hiện & gửi cảnh báo khi số buổi vắng vượt quá giới hạn đặt trước</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
            {/* Filter by all vs selected class */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterByClass('all')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition cursor-pointer ${
                  filterByClass === 'all' 
                    ? 'bg-white text-rose-600 shadow-sm border-b border-rose-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Toàn trường
              </button>
              <button
                type="button"
                onClick={() => setFilterByClass('selected')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition cursor-pointer ${
                  filterByClass === 'selected' 
                    ? 'bg-white text-rose-600 shadow-sm border-b border-rose-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lớp {activeClassObj ? activeClassObj.name : selectedClass}
              </button>
            </div>

            {/* Threshold setter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase">Ngưỡng vắng:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={absenceThreshold <= 1}
                  onClick={() => setAbsenceThreshold(prev => Math.max(1, prev - 1))}
                  className="w-5 h-5 bg-white border border-slate-300 rounded-lg flex items-center justify-center font-black text-xs hover:bg-slate-150 disabled:opacity-50 cursor-pointer"
                >
                  -
                </button>
                <span className="min-w-6 text-center font-black text-[11px] text-rose-650 font-mono">{absenceThreshold}</span>
                <button
                  type="button"
                  disabled={absenceThreshold >= 10}
                  onClick={() => setAbsenceThreshold(prev => Math.min(10, prev + 1))}
                  className="w-5 h-5 bg-white border border-slate-300 rounded-lg flex items-center justify-center font-black text-xs hover:bg-slate-150 disabled:opacity-50 cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Buổi</span>
            </div>
          </div>
        </div>

        {/* Alerts list */}
        {filteredAbsenceAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAbsenceAlerts.map(alert => {
              const isAlreadyNotified = notifiedStudents.includes(alert.student.id);
              const hasRecentAbsentsExpanded = expandedStudents.includes(alert.student.id);

              return (
                <div 
                  key={alert.student.id}
                  className="bg-slate-50/85 rounded-2xl p-4 border border-rose-100/70 hover:border-rose-200 hover:bg-white hover:shadow-sm transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2 text-left">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200">
                          Lớp {alert.className}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 truncate">{alert.student.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold tracking-wide">Mã HS: {alert.student.code}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-rose-600 font-mono block">
                          {alert.absentCount}
                        </span>
                        <span className="text-[8px] text-rose-450 font-black uppercase tracking-wider block">Buổi vắng</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200/50 text-center">
                      <div>
                        <span className="text-[8px] text-slate-450 font-bold block uppercase">Có phép</span>
                        <strong className="text-xs text-slate-750 font-bold">{alert.excusedCount}</strong>
                      </div>
                      <div className="border-l border-slate-200/80">
                        <span className="text-[8px] text-slate-450 font-bold block uppercase font-black text-rose-600/85">Không phép</span>
                        <strong className="text-xs text-rose-600 font-black">{alert.unexcusedCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2.5 border-t border-slate-200/50">
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => toggleExpandStudent(alert.student.id)}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
                      >
                        {hasRecentAbsentsExpanded ? 'Ẩn lịch trình' : 'Xem chi tiết ngày vắng'}
                        <span className="text-[8px]">{hasRecentAbsentsExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>

                    {hasRecentAbsentsExpanded && (
                      <div className="bg-white p-2 rounded-xl border border-slate-150 space-y-1.5 max-h-24 overflow-y-auto text-[10px] text-left">
                        {alert.dates.map((d, index) => (
                          <div key={index} className="flex justify-between items-center border-b border-slate-50 last:border-none pb-1 last:pb-0">
                            <span className="font-mono text-slate-500 font-semibold">{d.date}</span>
                            <span className={`px-1.5 py-0.2 rounded-md font-bold text-[8px] ${
                              d.status === 'excused' ? 'bg-indigo-50 text-indigo-600 border border-indigo-150' : 'bg-rose-50 text-rose-600 border border-rose-150'
                            }`}>
                              {d.status === 'excused' ? 'Có phép' : 'Không phép'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleNotifyParent(alert.student.name, alert.student.id, alert.absentCount)}
                      className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isAlreadyNotified
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-indigo-600 hover:bg-indigo-750 text-white shadow-sm'
                      }`}
                    >
                      {isAlreadyNotified ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Đã cảnh báo phụ huynh
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-white animate-bounce" />
                          Liên hệ báo phụ huynh
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 bg-emerald-50/40 border border-dashed border-emerald-200/60 rounded-2xl p-6 text-center space-y-2">
            <span className="text-3xl animate-bounce block">✨🎉✨</span>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-850">Chuyên cần đạt mốc an toàn</h4>
            <p className="text-[10px] text-emerald-700/80 font-bold max-w-md mx-auto">
              Không phát hiện thấy trường hợp học sinh nào vắng từ {absenceThreshold} buổi trở lên ở bộ lọc hiện tại. Chúc mừng nỗ lực học tập của lớp!
            </p>
          </div>
        )}
      </div>

      {/* MAIN BENTO LAYOUT (GOLDEN HONOR SCROLL & CLASS METRICS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Modernized interactive Golden Scroll of Honor (Vinh danh bảng vàng) */}
        <div className="lg:col-span-2 bg-gradient-to-b from-amber-50 to-orange-100/40 p-6 rounded-3xl shadow-sm border border-amber-200/60 text-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[360px] text-left">
          
          {/* Sparkles design accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 right-10 w-24 h-24 bg-amber-400/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-900/10 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl animate-bounce shrink-0">👑</span>
                <div>
                  <h2 className="text-lg font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    BẢNG VÀNG DANH DỰ LỚP
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-yellow-300">
                      {activeClassObj ? activeClassObj.name : selectedClass}
                    </span>
                  </h2>
                  <p className="text-[11px] text-amber-900/80 font-bold">
                    Vinh danh những ngôi sao sáng gặt hái từ <strong className="text-red-600">20 ⭐ (sao) </strong>thi đua trở lên trong tháng này!
                  </p>
                </div>
              </div>
            </div>

            {/* Grid of outstanding student cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goldenBoardStudents.map((student, idx) => {
                // Generate a clever student master title based on index or star bounds
                const title = idx === 0 
                  ? "Siêu sao Tin học" 
                  : idx === 1 
                  ? "Huyền thoại Công nghệ" 
                  : student.stars >= 30 
                  ? "Chiến binh công nghệ" 
                  : "Lập trình viên nhí";

                return (
                  <div 
                    key={student.id} 
                    className="bg-white/95 hover:bg-white border-2 border-yellow-400/80 hover:border-amber-500 rounded-2xl shadow-sm p-4 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer relative overflow-hidden group"
                  >
                    {/* Glowing highlight in background of student cards */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-300/10 to-amber-400/20 translate-x-4 -translate-y-4 rounded-full group-hover:scale-150 transition-all duration-300"></div>
                    
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 text-slate-900 flex items-center justify-center text-xl font-black shadow-inner border-2 border-white shrink-0 group-hover:rotate-12 transition duration-300">
                      🏆
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5 text-left relative z-10">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-sm font-black text-slate-800 truncate">{student.name}</strong>
                        <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      </div>
                      <span className="text-[9px] bg-amber-500/20 text-amber-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-block">
                        {title}
                      </span>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-xs text-amber-600 font-extrabold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                          {student.stars} ⭐
                        </span>
                        {student.badges.slice(0, 2).map(b => (
                          <span key={b} className="text-[8px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold truncate max-w-[120px]">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty State Banner with elegant styling */}
              {goldenBoardStudents.length === 0 && (
                <div className="col-span-full py-10 text-center bg-amber-100/50 backdrop-blur-sm border-2 border-dashed border-amber-300/70 rounded-2xl p-6 text-amber-950 text-xs font-semibold flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl animate-bounce">✨🏆✨</span>
                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-amber-950">Chiến dịch thi đua chưa bắt đầu hoặc chưa có ai vượt mức 20 ⭐!</p>
                    <p className="text-[11px] text-amber-900/70">
                      Thầy cô hãy thực hiện đánh dấu, chấm điểm cộng sao cho các em học sinh có biểu hiện tốt trong phần "Nhận xét đánh giá" để thúc đẩy các em ghi danh lên Bảng Vàng nhé!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-amber-950/10 flex justify-between items-center text-[10px] text-amber-900/60 font-semibold mt-4">
           <span className="text-sm font-black text-red">
              <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-600" />
              Lớp <strong className="text-red-600">{activeClassObj ? activeClassObj.name : selectedClass} </strong>chung sức thi đua học tập
            </span>
            </span>
            <span className="text-sm font-black text-red">
              <span>Cập nhật: {systemDateText}</span>
            </span>
          </div>
        </div>

        {/* Right Column Grid: Top 5 School scoreboard & Class Emulation summary card */}
        <div className="space-y-6 flex flex-col h-full justify-between">
          
          {/* Class Emulation summary card (Quỹ Thi Đua Lớp) - optimized to fit content tightly */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col text-left relative overflow-hidden flex-none h-auto">
            {/* Subtle graphical background node */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full translate-x-6 -translate-y-6"></div>
            
            <div className="space-y-3.5 relative z-10">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  Quỹ Thi Đua Lớp <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-yellow-300">
                  {activeClassObj ? activeClassObj.name : selectedClass}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Theo dõi hoạt động tích lũy phần thưởng học đường</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Sao tích lũy lớp</span>
                  <strong className="text-lg text-amber-600 mt-1 block font-black">
                    {stats.totalClassStars} ⭐
                  </strong>
                  <span className="text-[8px] text-slate-450 block mt-0.5">Thống kê toàn khóa</span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Stickers đổi quà</span>
                  <strong className="text-lg text-indigo-600 mt-1 block font-black">
                    {stats.totalStickersExchanged} 🎁
                  </strong>
                  <span className="text-[8px] text-indigo-400 font-bold block mt-0.5">Đặt tủ dán học tập</span>
                </div>
              </div>
            </div>
          </div>

          {/* TOP 5 STUDENTS OF THE ENTIRE SCHOOL */}
          <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-3xl shadow-sm border border-indigo-500/20 text-left relative overflow-hidden flex-1 flex flex-col justify-between">
            {/* Ambient background glow highlights */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-violet-600/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10 space-y-3.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="border-b border-indigo-850 pb-2.5">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span>⭐</span> TOP 5 SAO TOÀN TRƯỜNG
                  </h3>
                  <p className="text-[10px] text-indigo-350 font-medium">Bảng vàng vinh danh điểm tích lũy thi đua học đường</p>
                </div>

                <div className="space-y-2 mt-3">
                  {topSchoolStudents.map((st, index) => {
                    const rankIcons = ["🥇", "🥈", "🥉", "4th", "5th"];
                    const rankMedal = rankIcons[index];
                    const title = index === 0 
                      ? "Mặt Trời Công Nghệ ☀️" 
                      : index === 1 
                      ? "Trăng Sáng Tin Học 🌙" 
                      : index === 2 
                      ? "Tinh Tú Lập Trình 💫" 
                      : "Ngôi Sao Đỏ 🌟";
                    
                    const isPl = st.isPlaceholder;

                    return (
                      <div 
                        key={st.id} 
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors duration-200 border ${
                          isPl 
                            ? "bg-indigo-950/20 border-indigo-950/35 opacity-40" 
                            : "bg-indigo-950/50 hover:bg-indigo-900/45 border-indigo-900/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                            index === 0 ? 'bg-amber-400/20 text-yellow-300' :
                            index === 1 ? 'bg-slate-300/20 text-slate-200' :
                            index === 2 ? 'bg-amber-600/20 text-amber-450' : 'text-slate-400'
                          }`}>
                            {rankMedal}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-slate-100 truncate flex items-center gap-1.5">
                              {st.name}
                              {!isPl && (
                                <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-700/20">
                                  {st.className}
                                </span>
                              )}
                            </p>
                            <p className="text-[8px] text-slate-450 font-extrabold uppercase tracking-wide">
                              {isPl ? "Chưa đạt hạng xếp học đường" : title}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-amber-400 font-black flex items-center justify-end gap-0.5">
                            {st.currentStars} <span className="text-[10px] text-yellow-450">⭐</span>
                          </span>
                          {!isPl && (
                            <span className="text-[8.5px] text-indigo-300 font-semibold block mt-0.5">
                              {st.exchangedStickers > 0 ? `Đã đổi ${st.exchangedStickers} 🎁 / tích luỹ ${st.cumulativeStars} ⭐` : `Tích luỹ: ${st.cumulativeStars} ⭐`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[9px] text-indigo-400 font-semibold mt-3 pt-2.5 border-t border-indigo-850 flex justify-between items-center">
                <span>Vận hành tự động</span>
                <span>Cập nhật liên tục</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* GRAPHICAL EMULATION COMPARISON SECTION FOR TARGET GRADE */}
      <div id="grade-emulation-comparison-section" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-50 text-amber-700 p-2 rounded-xl shrink-0">
              <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                BẢNG SO SÁNH THI ĐUA {activeGradeName.toUpperCase()}
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                  GÓC THI ĐUA KHỐI HỌC
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  (Lớp: {activeClassObj?.name || selectedClass})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Trực quan hóa mức độ tích lũy sao và hoạt động đổi quà giữa các lớp thuộc cùng khối {activeGradeName}
              </p>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setEmulationMetric('total')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                emulationMetric === 'total'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-550 hover:bg-slate-200'
              }`}
            >
              Tổng Sao ⭐
            </button>
            <button
              type="button"
              onClick={() => setEmulationMetric('average')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                emulationMetric === 'average'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-550 hover:bg-slate-200'
              }`}
            >
              Trung bình/HS 🎯
            </button>
            <button
              type="button"
              onClick={() => setEmulationMetric('stickers')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                emulationMetric === 'stickers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-550 hover:bg-slate-200'
              }`}
            >
              Quà Đã Đổi 🎁
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Recharts Bar Chart Panel */}
          <div className="md:col-span-2 h-[260px] relative w-full min-w-0">
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart
                data={emulationComparisonData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={activeMetricConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeMetricConfig.stopColor1} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={activeMetricConfig.stopColor2} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="className" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}${activeMetricConfig.unit}`}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip content={<CustomEmulationTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Bar 
                  dataKey={activeMetricConfig.dataKey} 
                  fill={`url(#${activeMetricConfig.gradientId})`} 
                  radius={[8, 8, 0, 0]} 
                  barSize={44}
                >
                  {emulationComparisonData.map((entry, index) => {
                    // Highlight the currently selected class!
                    const isSelected = entry.className === activeClassObj?.name;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#${activeMetricConfig.gradientId})`}
                        stroke={isSelected ? '#dc2626' : 'none'}
                        strokeWidth={isSelected ? 1.5 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rankings & statistics panel */}
          <div className="space-y-3.5">
            <div className="bg-slate-50 p-4 rounded-2.5xl border border-slate-100 space-y-3">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
                Bảng thông tin chi tiết {activeGradeName}
              </span>
              
              <div className="divide-y divide-slate-200/60 max-h-[170px] overflow-y-auto pr-1">
                {emulationComparisonData.map((clsData, idx) => {
                  const isCurrent = clsData.className === activeClassObj?.name;
                  return (
                    <div 
                      key={clsData.classId} 
                      className={`py-2 flex items-center justify-between text-xs transition ${
                        isCurrent ? 'bg-amber-500/10 px-1.5 rounded-lg font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest ${
                          idx === 0 
                            ? 'bg-yellow-400 text-yellow-950 shadow-sm' 
                            : idx === 1 
                            ? 'bg-slate-350 text-slate-800' 
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className={`font-extrabold ${isCurrent ? 'text-amber-700' : 'text-slate-700'}`}>
                          Lớp {clsData.className}
                          {isCurrent && <span className="ml-1 text-[8px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black uppercase">Đang Xem</span>}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-extrabold block text-slate-900 leading-none">
                          {emulationMetric === 'total' && `${clsData['Tổng sao thi đua']} ⭐`}
                          {emulationMetric === 'average' && `${clsData['Sao trung bình/HS']} ⭐/HS`}
                          {emulationMetric === 'stickers' && `${clsData['Stickers đã đổi']} 🎁`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          Sĩ số: {clsData['Sĩ số']} HS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative message */}
              <p className="text-[9px] text-slate-400 italic font-medium leading-relaxed pt-2 border-t border-slate-200/50">
                💡 Lớp có số sao trung bình trên mỗi học sinh cao hơn sẽ có xếp hạng thi đua thực chất cao hơn. Hãy cổ vũ tất cả các em cùng thi đua!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHICAL ATTENDANCE STATISTICS MODULE FOR ALL GRADES */}
      <div id="school-attendance-graph-section" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-55 text-indigo-700 p-2 rounded-xl shrink-0">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                TỶ LỆ ĐI HỌC ĐẦY ĐỦ THEO KHỐI
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                  {activeMonthYearLabel}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Biểu đồ thống kê tỷ lệ chuyên cần và hiện diện chi tiết theo từng khối học trong tháng</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 rounded-xl font-bold text-slate-500 self-stretch sm:self-auto justify-center">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Vận hành liên tục • Phòng máy học tập
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Recharts Bar Chart Panel */}
          <div className="md:col-span-2 h-[260px] relative w-full min-w-0">
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart
                data={monthlyGradeAttendanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="gradeName" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  domain={[60, 100]}
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Bar 
                  dataKey="Tỷ lệ chuyên cần (%)" 
                  fill="url(#attendanceGradient)" 
                  radius={[8, 8, 0, 0]} 
                  barSize={44}
                >
                  {monthlyGradeAttendanceData.map((entry, index) => {
                    const colors = ['#4f46e5', '#3b82f6', '#06b6d4'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick analysis / ranking table panel */}
          <div className="space-y-3.5">
            <div className="bg-slate-50 p-4 rounded-2.5xl border border-slate-100 space-y-3">
              <span className="text-[9px] text-slate-450 font-black uppercase tracking-widest block">
                Phân tích & Xếp hạng chuyên cần
              </span>
              
              <div className="space-y-3">
                {monthlyGradeAttendanceData.map(data => {
                  const rate = data['Tỷ lệ chuyên cần (%)'];
                  let badgeColor = "bg-rose-50 text-rose-600 border border-rose-200";
                  let badgeText = "Cần động viên";
                  if (data['Tổng số lượt'] === 0) {
                    badgeColor = "bg-slate-100 text-slate-500 border border-slate-150";
                    badgeText = "Chưa học";
                  } else if (rate >= 98.5) {
                    badgeColor = "bg-emerald-55 text-emerald-700 border border-emerald-200/50";
                    badgeText = "Xuất sắc ⭐";
                  } else if (rate >= 97.0) {
                    badgeColor = "bg-sky-50 text-sky-700 border border-sky-200/55";
                    badgeText = "Tích cực 👍";
                  }
                  
                  return (
                    <div key={data.gradeId} className="space-y-1 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-700">{data.gradeName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${badgeColor}`}>
                            {badgeText}
                          </span>
                          <strong className="text-slate-900 font-extrabold">{rate}%</strong>
                        </div>
                      </div>
                      
                      {/* Mini custom progress bar */}
                      <div className="w-full bg-slate-205 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${rate}%`,
                            backgroundColor: rate >= 98.5 ? '#10b981' : rate >= 97.0 ? '#3b82f6' : '#f43f5e'
                          }}
                        />
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Có mặt: <span className="font-bold text-slate-600">{data['Hiện diện']}</span> / {data['Tổng số lượt']} lượt
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50 flex items-start gap-2 text-left">
              <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-indigo-950 block">Nhận định chuyên cần</span>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  Tỷ lệ học sinh tham dự phòng máy đạt trung bình trên <strong className="text-indigo-600 font-extrabold">98%</strong>. Chú trọng chuẩn bị trước sơ đồ máy giúp nâng sao thi đua hiệu quả.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DETAILED LESSON ALLOCATION & METADATA DASHBOARD */}
      <div className="w-full">
        
        {/* Detailed allocation chart/info list */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 w-full">
          <h3 className="text-base font-black text-slate-800 border-b pb-2 flex items-center gap-2 text-left">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
            Thông tin phân bổ tiết học hiện tại
          </h3>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/50 pb-2">
              <p className="text-sm font-bold text-slate-700 text-left">
                Lớp:  <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-yellow-300">
                      {activeClassObj ? activeClassObj.name : selectedClass}</span>
                {activeClassObj?.teacher && <span> | GVCN: <strong className="text-slate-900 font-semibold">{activeClassObj.teacher}</strong></span>}
              </p>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                Môn: Tin Học Tiểu Học
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 text-left">
              {/* TỔNG SỸ SỐ card exactly styled like photo */}
              <div className="bg-white rounded-[24px] border border-slate-300 p-5 md:p-6 flex items-center gap-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:border-indigo-200 transition-all duration-300 min-h-[105px]">
                <div className="p-3 bg-indigo-50/60 text-indigo-600 rounded-full shrink-0">
                  <Users className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-black tracking-widest block uppercase">TỔNG SỸ SỐ</span>
                  <strong className="text-2xl sm:text-3xl text-slate-900 block font-black leading-none">{stats.totalStudentsInClass}</strong>
                  <span className="text-[10px] sm:text-[11px] text-emerald-650 font-bold block mt-1">{stats.maleCount} Nam • {stats.femaleCount} Nữ</span>
                </div>
              </div>

              {/* VẮNG HÔM NAY card exactly styled like photo */}
              <div className="bg-white rounded-[24px] border border-slate-300 p-5 md:p-6 flex items-center gap-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:border-rose-200 transition-all duration-300 min-h-[105px]">
                <div className="p-3 bg-rose-50/60 text-rose-500 rounded-full shrink-0">
                  <AlertTriangle className="w-7 h-7 md:w-8 md:h-8 animate-pulse" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-black tracking-widest block uppercase">VẮNG HÔM NAY</span>
                  <strong className="text-2xl sm:text-3xl text-slate-900 block font-black leading-none">{stats.todayTotalAbsent}</strong>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block mt-1">{stats.todayExcusedCount} Phép • {stats.todayUnexcusedCount} Không phép</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Quick document files */}
            <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-left bg-slate-50/30">
              <h4 className="text-xs font-black text-slate-700 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Học liệu của lớp gần đây
                </span>
                <span className="text-[9px] text-slate-400 font-bold">{documents.length} File số</span>
              </h4>
              <div className="space-y-2">
                {documents.slice(0, 2).map(d => (
                  <div key={d.id} className="text-xs flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-3xs hover:border-amber-350 transition min-w-0">
                    <span className="truncate font-semibold text-slate-700 flex-1 min-w-0 mr-3" title={d.title}>{d.title}</span>
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-[9px] font-bold shrink-0">
                      {d.type}
                    </span>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-slate-400 text-[11px] py-4 text-center">Chưa có học liệu số được tạo cho lớp này.</p>
                )}
              </div>
            </div>

            {/* Smart operator / Educator card */}
            <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-left bg-slate-50/30 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-700 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                  <Radio className="w-4 h-4 text-emerald-500 animate-ping" />
                  Tài khoản đang vận hành
                </h4>
                <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-700 to-indigo-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-xs shrink-0">
                    {currentUser ? currentUser.name.substring(0,2).toUpperCase() : 'GV'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{currentUser ? currentUser.name : 'Giáo viên thực hành'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{currentUser ? currentUser.role : 'Quản trị viên hệ thống'}</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-3">Hệ thống phân quyền đầy đủ cho tài khoản của bạn.</p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

