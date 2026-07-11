import React, { useState, useEffect, useRef } from 'react';
import { Question, Member, Student, ClassItem } from '../types';
import { 
  Gamepad2, 
  Trophy, 
  Sparkles, 
  Timer, 
  CheckCircle2, 
  RotateCcw, 
  Zap, 
  Award, 
  Keyboard, 
  Cpu, 
  HelpCircle,
  Play,
  Check,
  X,
  Smile,
  ChevronRight,
  ChevronDown,
  Share2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Users,
  Search,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Flag,
  Sparkle
} from 'lucide-react';

interface InteractiveGamesTabProps {
  currentUser: Member | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  selectedGrade?: number;
}

// Custom synthesizer audio helper
const playSynthSound = (type: 'win' | 'lose' | 'click' | 'tick' | 'ding') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'tick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'ding') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'win') {
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start();
      osc.stop(now + 0.45);
    } else if (type === 'lose') {
      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.35);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start();
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('Audio synthesis blocked or unsupported:', e);
  }
};

const TYPING_TEXTS = [
  "Em yeu truong em voi bao ban than va co giao hien.",
  "Hoc tap tot, lao dong tot, gin giu ve sinh that sach se.",
  "Phim cach la phim dai nhat nam o duoi cung cua ban phim.",
  "Dat tay dung vi tri phim F va J tren ban phim may tinh.",
  "Hay su dung phan mem Paint de ve nhung buc tranh sang tao.",
  "Nho luu bai va tat nguon may tinh dung cach khi ra ve em nhe!"
];

export function InteractiveGamesTab({ currentUser, showToast, selectedGrade = 3 }: InteractiveGamesTabProps) {
  // Navigation: null = lobby, otherwise specific game ID
  const [activeSubGame, setActiveSubGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- CUSTOM QUESTION BANK & CLASS SETUP ---
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [setupGame, setSetupGame] = useState<any | null>(null);
  const [setupSubjectId, setSetupSubjectId] = useState<string>('default');
  const [setupClassId, setSetupClassId] = useState<string>('none');

  // --- TRIVIA QUESTIONS REPOSITORY ---
  const [triviaQuestions, setTriviaQuestions] = useState<Question[]>([]);
  
  // Load questions from localStorage
  useEffect(() => {
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    const storageKey = `school_questions_${userId}`;
    const local = localStorage.getItem(storageKey);
    if (local) {
      try {
        const loaded = JSON.parse(local);
        if (loaded && loaded.length > 0) {
          setTriviaQuestions(loaded);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback default trivia questions
    setTriviaQuestions([
      {
        id: 'q-1',
        title: 'Thiết bị nào sau đây dùng để nhập chữ và số vào máy tính?',
        options: ['Màn hình', 'Máy in', 'Bàn phím', 'Loa'],
        correctIndex: 2,
        explanation: 'Bàn phím (Keyboard) là thiết bị chính giúp chúng ta nhập ký tự, số và ký hiệu vào máy tính.',
        difficulty: 'Dễ',
        gradeId: 3,
        category: 'Phần cứng',
        authorId: 'system'
      },
      {
        id: 'q-2',
        title: 'Để vẽ hình tròn trong phần mềm Paint, em nhấn giữ phím nào trong khi kéo thả chuột?',
        options: ['Phím Ctrl', 'Phím Shift', 'Phím Alt', 'Phím Enter'],
        correctIndex: 1,
        explanation: 'Nhấn giữ phím Shift trong phần mềm vẽ Paint giúp em tạo ra hình tròn hoặc hình vuông hoàn hảo.',
        difficulty: 'Trung bình',
        gradeId: 3,
        category: 'Vẽ Paint',
        authorId: 'system'
      },
      {
        id: 'q-3',
        title: 'Phím dài nhất trên bàn phím máy tính là phím nào?',
        options: ['Phím Enter', 'Phím Backspace', 'Phím Cách (Spacebar)', 'Phím Caps Lock'],
        correctIndex: 2,
        explanation: 'Phím Spacebar (phím cách) nằm dưới cùng bàn phím là phím dài nhất, dùng để tạo khoảng cách giữa các từ.',
        difficulty: 'Dễ',
        gradeId: 3,
        category: 'Bàn phím',
        authorId: 'system'
      },
      {
        id: 'q-4',
        title: 'Trong Windows, biểu tượng "Recycle Bin" chứa cái gì?',
        options: ['Các tệp đã bị xóa tạm thời', 'Phần mềm soạn thảo văn bản', 'Các tệp hình ảnh vừa vẽ', 'Các trò chơi có sẵn'],
        correctIndex: 0,
        explanation: 'Recycle Bin là thùng rác máy tính, nơi chứa các thư mục, tệp tin đã bị xóa tạm thời trước khi xóa vĩnh viễn.',
        difficulty: 'Dễ',
        gradeId: 3,
        category: 'Hệ điều hành',
        authorId: 'system'
      },
      {
        id: 'q-5',
        title: 'Thiết bị nào được ví như "Bộ não" điều khiển mọi hoạt động của máy tính?',
        options: ['Bàn phím', 'Thân máy (CPU)', 'Chuột', 'Loa'],
        correctIndex: 1,
        explanation: 'Bộ xử lý trung tâm CPU (Central Processing Unit) điều khiển mọi tính toán và hành động của toàn hệ thống.',
        difficulty: 'Dễ',
        gradeId: 3,
        category: 'Phần cứng',
        authorId: 'system'
      }
    ]);
  }, [currentUser]);

  // Load students, classes and subjects for custom game setup
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  useEffect(() => {
    const localStudents = localStorage.getItem('school_students');
    if (localStudents) {
      try {
        setAllStudents(JSON.parse(localStudents));
      } catch (e) {
        console.error(e);
      }
    }

    const localClasses = localStorage.getItem('school_classes');
    if (localClasses) {
      try {
        setAllClasses(JSON.parse(localClasses));
      } catch (e) {
        console.error(e);
      }
    } else {
      setAllClasses([
        { id: '3A', name: 'Lớp 3A', gradeId: 3, teacher: 'Nguyễn Văn A' },
        { id: '3B', name: 'Lớp 3B', gradeId: 3, teacher: 'Trần Thị B' },
        { id: '4A', name: 'Lớp 4A', gradeId: 4, teacher: 'Lê Văn C' },
        { id: '5A', name: 'Lớp 5A', gradeId: 5, teacher: 'Phạm Văn D' }
      ]);
    }

    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    const subjectsStorageKey = `school_subjects_${userId}`;
    const localSubjects = localStorage.getItem(subjectsStorageKey);
    if (localSubjects) {
      try {
        setAllSubjects(JSON.parse(localSubjects));
      } catch (e) {
        console.error(e);
      }
    } else {
      setAllSubjects([
        { id: 'subj-3', name: 'Tin học', gradeId: 3 },
        { id: 'subj-4', name: 'Tin học', gradeId: 4 },
        { id: 'subj-5', name: 'Tin học', gradeId: 5 }
      ]);
    }
  }, [currentUser]);

  // Play sound trigger
  const triggerSound = (type: 'win' | 'lose' | 'click' | 'tick' | 'ding') => {
    if (soundEnabled) {
      playSynthSound(type);
    }
  };

  // Start game with loaded questions and students list
  const handleStartGame = (gameId: string, subjectId: string, classId: string) => {
    let customFilteredQuestions: Question[] = [];

    // 1. Fetch questions based on subjectId
    if (subjectId === 'default') {
      const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
      const storageKey = `school_questions_${userId}`;
      const local = localStorage.getItem(storageKey);
      if (local) {
        try {
          const loaded = JSON.parse(local);
          if (loaded && loaded.length > 0) {
            setTriviaQuestions(loaded);
            customFilteredQuestions = loaded;
          }
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
      const storageKey = `school_questions_${userId}`;
      const local = localStorage.getItem(storageKey);
      if (local) {
        try {
          const loaded: Question[] = JSON.parse(local);
          const filtered = loaded.filter(q => q.subjectId === subjectId);
          if (filtered.length > 0) {
            setTriviaQuestions(filtered);
            customFilteredQuestions = filtered;
            showToast(`📥 Đã nạp thành công ${filtered.length} câu hỏi tự chọn làm học liệu!`, "success");
          } else {
            showToast("⚠️ Môn học được chọn không có câu hỏi nào! Sử dụng dữ liệu mặc định.", "error");
            // Use all loaded questions
            setTriviaQuestions(loaded);
            customFilteredQuestions = loaded;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 2. Load student list based on classId
    let filteredStudents: Student[] = [];
    if (classId !== 'none') {
      filteredStudents = allStudents.filter(s => s.classId === classId);
      if (filteredStudents.length > 0) {
        if (gameId === 'lucky-wheel') {
          setWheelEntries(filteredStudents.map(s => s.name));
        }
        showToast(`👥 Đã nạp thành công ${filteredStudents.length} học sinh của lớp!`, "success");
      } else {
        showToast("⚠️ Lớp được chọn chưa có học sinh nào!", "error");
      }
    } else {
      if (gameId === 'lucky-wheel') {
        setWheelMode('prizes');
      }
    }

    // 3. For lucky-wheel, synchronize with its specific localStorage keys
    if (gameId === 'lucky-wheel') {
      // 3.1 Synchronize Class and Students
      if (classId !== 'none' && filteredStudents.length > 0) {
        const selectedClass = allClasses.find(c => c.id === classId);
        const className = selectedClass ? selectedClass.name : 'Lớp được chọn';
        const studentsJoined = filteredStudents.map(s => s.name).join('\n');
        const classListToSave = [{ id: classId, name: className, students: studentsJoined }];

        localStorage.setItem('vongQuayClassList', JSON.stringify(classListToSave));
        localStorage.setItem('vongQuayCurrentClassId', classId.toString());
      }

      // 3.2 Synchronize Quiz Questions
      if (customFilteredQuestions.length > 0) {
        const mappedQuizQuestions = customFilteredQuestions.map((q, idx) => ({
          id: q.id || `q-${idx}`,
          question: q.title,
          options: q.options,
          correctAnswer: q.options[q.correctIndex]
        }));
        localStorage.setItem('vongQuayQuizData', JSON.stringify(mappedQuizQuestions));
      }
    }

    // 4. Launch game!
    setActiveSubGame(gameId);
    setSetupGame(null);
    triggerSound('ding');
  };

  // --- GAME 1: VÒNG QUAY MAY MẮN (LUCKY WHEEL) STATE & LOGIC ---
  const [wheelEntries, setWheelEntries] = useState<string[]>([
    "Học sinh Xuất Sắc", "Cộng 1 Sao ⭐", "Tràng pháo tay 👏", "Thêm lượt 🎲", 
    "Kẹo ngọt 🍬", "Hộp quà bí mật 🎁", "Điểm 10 học tập 💯", "May mắn lần sau 🍀"
  ]);
  const [newEntryText, setNewEntryText] = useState('');
  const [wheelMode, setWheelMode] = useState<'prizes' | 'students'>('prizes');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [wheelWinner, setWheelWinner] = useState<string | null>(null);
  
  // Set entries based on chosen mode
  useEffect(() => {
    if (wheelMode === 'students') {
      if (allStudents.length > 0) {
        setWheelEntries(allStudents.slice(0, 10).map(s => s.name));
      } else {
        setWheelEntries(["Gia Bảo", "Minh Thư", "Tuấn Kiệt", "Khánh Vy", "Hoàng Nam", "Bảo Châu", "Gia Huy", "Thảo My"]);
      }
    } else {
      setWheelEntries([
        "Cộng 1 Sao ⭐", "Tràng pháo tay 👏", "Hộp quà bí mật 🎁", "Thêm 5 giây ⏱️", 
        "Kẹo ngọt 🍬", "Điểm 10 học tập 💯", "Chúc may mắn 🍀", "Nhân đôi sao 🌟"
      ]);
    }
    setWheelWinner(null);
  }, [wheelMode, allStudents]);

  const handleSpinWheel = () => {
    if (isSpinning || wheelEntries.length === 0) return;
    setIsSpinning(true);
    setWheelWinner(null);
    triggerSound('click');

    // Ticking audio interval simulation
    let ticks = 0;
    const tickInterval = setInterval(() => {
      if (ticks < 30) {
        triggerSound('tick');
        ticks++;
      } else {
        clearInterval(tickInterval);
      }
    }, 120);

    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5 to 10 full spins
    const randomSectorAngle = Math.floor(Math.random() * 360);
    const targetAngle = rotationAngle + (extraSpins * 360) + randomSectorAngle;
    
    setRotationAngle(targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      clearInterval(tickInterval);
      
      // Calculate selected segment
      const normalizedAngle = (360 - (targetAngle % 360)) % 360;
      const segmentSize = 360 / wheelEntries.length;
      const winnerIndex = Math.floor(normalizedAngle / segmentSize) % wheelEntries.length;
      
      setWheelWinner(wheelEntries[winnerIndex]);
      triggerSound('win');
    }, 4000);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryText.trim()) return;
    setWheelEntries([...wheelEntries, newEntryText.trim()]);
    setNewEntryText('');
    triggerSound('click');
  };

  const handleRemoveEntry = (index: number) => {
    if (wheelEntries.length <= 2) {
      showToast("Vòng quay cần có tối thiểu 2 ô lựa chọn!", "error");
      return;
    }
    setWheelEntries(wheelEntries.filter((_, i) => i !== index));
    triggerSound('click');
  };

  // --- GAME 2: KÉO CO KIẾN THỨC STATE & LOGIC ---
  const [tugRedScore, setTugRedScore] = useState(0);
  const [tugBlueScore, setTugBlueScore] = useState(0);
  const [tugPosition, setTugPosition] = useState(0); // -100 to 100
  const [tugActiveQIdx, setTugActiveQIdx] = useState(0);
  const [tugTurn, setTugTurn] = useState<'red' | 'blue'>('red');
  const [tugSelectedAns, setTugSelectedAns] = useState<number | null>(null);
  const [tugAnswered, setTugAnswered] = useState(false);
  const [tugWinner, setTugWinner] = useState<'red' | 'blue' | null>(null);

  const handleTugAnswer = (optIdx: number) => {
    if (tugAnswered || tugWinner) return;
    setTugSelectedAns(optIdx);
    setTugAnswered(true);

    const activeQ = triviaQuestions[tugActiveQIdx % triviaQuestions.length];
    const isCorrect = optIdx === activeQ.correctIndex;

    if (isCorrect) {
      triggerSound('ding');
      if (tugTurn === 'red') {
        setTugRedScore(s => s + 1);
        setTugPosition(p => {
          const next = p - 25;
          if (next <= -75) setTugWinner('red');
          return Math.max(-100, next);
        });
        showToast("🎉 Đội Đỏ trả lời CHÍNH XÁC! Kéo mạnh về bên Đỏ!", "success");
      } else {
        setTugBlueScore(s => s + 1);
        setTugPosition(p => {
          const next = p + 25;
          if (next >= 75) setTugWinner('blue');
          return Math.min(100, next);
        });
        showToast("🎉 Đội Xanh trả lời CHÍNH XÁC! Kéo mạnh về bên Xanh!", "success");
      }
    } else {
      triggerSound('lose');
      if (tugTurn === 'red') {
        setTugPosition(p => p + 10); // Penalty: pulled slightly to blue side
        showToast("❌ Đội Đỏ trả lời sai rồi! Cơ hội nghiêng về đội Xanh.", "error");
      } else {
        setTugPosition(p => p - 10); // Penalty: pulled slightly to red side
        showToast("❌ Đội Xanh trả lời sai rồi! Cơ hội nghiêng về đội Đỏ.", "error");
      }
    }
  };

  const handleNextTug = () => {
    setTugActiveQIdx(prev => prev + 1);
    setTugTurn(prev => prev === 'red' ? 'blue' : 'red');
    setTugSelectedAns(null);
    setTugAnswered(false);
    triggerSound('click');
  };

  const resetTugGame = () => {
    setTugRedScore(0);
    setTugBlueScore(0);
    setTugPosition(0);
    setTugActiveQIdx(0);
    setTugTurn('red');
    setTugSelectedAns(null);
    setTugAnswered(false);
    setTugWinner(null);
    triggerSound('click');
  };

  // --- GAME 3: ĐÀO VÀNG TRÍ TUỆ STATE & LOGIC ---
  const [goldScore, setGoldScore] = useState(0);
  const [hookAngle, setHookAngle] = useState(0); // -60 to 60 deg
  const [hookStatus, setHookStatus] = useState<'swinging' | 'shooting' | 'retrieving' | 'question'>('swinging');
  const [hookLength, setHookLength] = useState(40); // length of hook rope
  const [minedItem, setMinedItem] = useState<{ id: number; type: 'gold' | 'diamond' | 'stone'; value: number; x: number; y: number } | null>(null);
  const [goldMinedQ, setGoldMinedQ] = useState<Question | null>(null);
  const [goldMinedAns, setGoldMinedAns] = useState<number | null>(null);
  const [goldMinedAnswered, setGoldMinedAnswered] = useState(false);
  const [goldSwingerDir, setGoldSwingerDir] = useState<1 | -1>(1);

  // Mined items map
  const [goldItems, setGoldItems] = useState([
    { id: 1, type: 'gold', value: 300, x: 20, y: 70 },
    { id: 2, type: 'gold', value: 500, x: 50, y: 85 },
    { id: 3, type: 'diamond', value: 800, x: 80, y: 65 },
    { id: 4, type: 'stone', value: 50, x: 15, y: 80 },
    { id: 5, type: 'stone', value: 50, x: 70, y: 80 }
  ]);

  // Hook swinging loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hookStatus === 'swinging' && activeSubGame === 'gold-miner') {
      interval = setInterval(() => {
        setHookAngle(prev => {
          let next = prev + goldSwingerDir * 3;
          if (next >= 60) {
            setGoldSwingerDir(-1);
            return 60;
          }
          if (next <= -60) {
            setGoldSwingerDir(1);
            return -60;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [hookStatus, goldSwingerDir, activeSubGame]);

  // Hook shooting loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hookStatus === 'shooting' && activeSubGame === 'gold-miner') {
      interval = setInterval(() => {
        setHookLength(prev => {
          const next = prev + 12;
          
          // Calculate tip coordinate of hook
          const angleRad = (hookAngle * Math.PI) / 180;
          const hookX = 50 + (next / 4); // as percent
          const hookY = 15 + (next / 3.5); // as percent

          // Check collisions with items
          const collided = goldItems.find(item => {
            const dx = Math.abs(item.x - hookX);
            const dy = Math.abs(item.y - hookY);
            return dx < 5 && dy < 6;
          });

          if (collided) {
            clearInterval(interval);
            setMinedItem(collided);
            setHookStatus('retrieving');
            // Remove item from pool temporarily
            setGoldItems(items => items.filter(i => i.id !== collided.id));
            triggerSound('ding');
            return next;
          }

          // Limit length, retrieve empty
          if (next >= 300) {
            clearInterval(interval);
            setHookStatus('retrieving');
          }
          return next;
        });
      }, 35);
    } else if (hookStatus === 'retrieving' && activeSubGame === 'gold-miner') {
      interval = setInterval(() => {
        setHookLength(prev => {
          const next = prev - 8;
          if (next <= 40) {
            clearInterval(interval);
            if (minedItem) {
              if (minedItem.type === 'stone') {
                // Stones instantly credit with low points, no question
                setGoldScore(s => s + minedItem.value);
                showToast(`🪨 Em kéo được đá! Nhận được ${minedItem.value} điểm!`, "success");
                setMinedItem(null);
                setHookStatus('swinging');
              } else {
                // Gold / Diamond launches trivia quiz challenge!
                const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
                setGoldMinedQ(q);
                setGoldMinedAns(null);
                setGoldMinedAnswered(false);
                setHookStatus('question');
              }
            } else {
              setHookStatus('swinging');
            }
            return 40;
          }
          return next;
        });
      }, 35);
    }
    return () => clearInterval(interval);
  }, [hookStatus, hookAngle, goldItems, minedItem, triviaQuestions, activeSubGame]);

  const handleShootHook = () => {
    if (hookStatus !== 'swinging') return;
    setHookStatus('shooting');
    triggerSound('click');
  };

  const handleGoldQuestionAnswer = (optIdx: number) => {
    if (goldMinedAnswered || !goldMinedQ || !minedItem) return;
    setGoldMinedAns(optIdx);
    setGoldMinedAnswered(true);

    const isCorrect = optIdx === goldMinedQ.correctIndex;
    if (isCorrect) {
      triggerSound('win');
      setGoldScore(s => s + minedItem.value);
      showToast(`🏆 Trả lời chính xác! Nhận trọn vẹn +${minedItem.value} vàng!`, "success");
    } else {
      triggerSound('lose');
      showToast("❌ Trả lời sai rồi! Khối vàng quý giá đã tuột khỏi tầm tay!", "error");
    }
  };

  const handleCloseGoldQuestion = () => {
    setGoldMinedQ(null);
    setMinedItem(null);
    setHookStatus('swinging');
    triggerSound('click');

    // Reset items if empty
    if (goldItems.length === 0) {
      setGoldItems([
        { id: 11, type: 'gold', value: 300, x: 25, y: 72 },
        { id: 12, type: 'gold', value: 500, x: 48, y: 81 },
        { id: 13, type: 'diamond', value: 800, x: 75, y: 69 },
        { id: 14, type: 'stone', value: 50, x: 18, y: 78 },
        { id: 15, type: 'stone', value: 50, x: 82, y: 83 }
      ]);
    }
  };

  // --- GAME 4: BẬP BÊNH STATE & LOGIC ---
  interface SeesawLevel {
    target: number;
    leftLabel: string;
    options: { text: string; value: number }[];
  }

  const SEESAW_LEVELS: SeesawLevel[] = [
    {
      target: 15,
      leftLabel: "Hộp quà: 15 kg 🎁",
      options: [
        { text: "7 + 8", value: 15 },
        { text: "12 - 4", value: 8 },
        { text: "9 x 2", value: 18 },
        { text: "10 + 3", value: 13 }
      ]
    },
    {
      target: 32,
      leftLabel: "Rương vàng: 32 kg 📦",
      options: [
        { text: "40 - 12", value: 28 },
        { text: "16 x 2", value: 32 },
        { text: "25 + 5", value: 30 },
        { text: "9 x 4", value: 36 }
      ]
    },
    {
      target: 8,
      leftLabel: "Bình nước: 8 kg 🧪",
      options: [
        { text: "24 ÷ 3", value: 8 },
        { text: "5 + 5", value: 10 },
        { text: "12 - 5", value: 7 },
        { text: "16 ÷ 4", value: 4 }
      ]
    },
    {
      target: 50,
      leftLabel: "Túi gạo: 50 kg 🌾",
      options: [
        { text: "15 x 3", value: 45 },
        { text: "100 ÷ 2", value: 50 },
        { text: "35 + 25", value: 60 },
        { text: "80 - 40", value: 40 }
      ]
    }
  ];

  const [seesawLevel, setSeesawLevel] = useState(0);
  const [seesawSelected, setSeesawSelected] = useState<number | null>(null);
  const [seesawScore, setSeesawScore] = useState(0);
  const [seesawAnswered, setSeesawAnswered] = useState(false);
  const [seesawStatus, setSeesawStatus] = useState<'level' | 'tilted-left' | 'tilted-right'>('tilted-left');

  const handleSeesawChoose = (optIdx: number) => {
    if (seesawAnswered) return;
    setSeesawSelected(optIdx);
    setSeesawAnswered(true);
    
    const activeLevel = SEESAW_LEVELS[seesawLevel % SEESAW_LEVELS.length];
    const chosen = activeLevel.options[optIdx];
    
    if (chosen.value === activeLevel.target) {
      triggerSound('ding');
      setSeesawScore(s => s + 100);
      setSeesawStatus('level');
      showToast("🎉 Xuất sắc! Bập bênh đã cân bằng tuyệt hảo!", "success");
    } else {
      triggerSound('lose');
      setSeesawStatus(chosen.value < activeLevel.target ? 'tilted-left' : 'tilted-right');
      showToast("❌ Chưa đúng rồi! Bập bênh bị nghiêng mất cân đối!", "error");
    }
  };

  const handleNextSeesaw = () => {
    setSeesawLevel(prev => prev + 1);
    setSeesawSelected(null);
    setSeesawAnswered(false);
    setSeesawStatus('tilted-left');
    triggerSound('click');
  };

  // --- GAME 5: MÊ CUNG KÝ TỰ STATE & LOGIC ---
  const MAZE_SIZE = 6;
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [mazeGoalWord, setMazeGoalWord] = useState('CPU');
  const [mazeCollected, setMazeCollected] = useState<string>('');
  const [mazeScore, setMazeScore] = useState(0);
  const [mazeMessage, setMazeMessage] = useState('Hãy dẫn thỏ nhặt đúng thứ tự C - P - U!');
  
  // Static letter items and ghost items inside the maze
  const [mazeItems, setMazeItems] = useState([
    { char: 'C', x: 2, y: 1, collected: false },
    { char: 'P', x: 4, y: 3, collected: false },
    { char: 'U', x: 1, y: 5, collected: false },
  ]);

  const [mazeObstacles, setMazeObstacles] = useState([
    { x: 2, y: 3, type: 'ghost' },
    { x: 3, y: 4, type: 'ghost' },
    { x: 0, y: 4, type: 'bomb' },
  ]);

  const handleMazeMove = (dx: number, dy: number) => {
    const nx = Math.max(0, Math.min(MAZE_SIZE - 1, playerPos.x + dx));
    const ny = Math.max(0, Math.min(MAZE_SIZE - 1, playerPos.y + dy));
    
    if (nx === playerPos.x && ny === playerPos.y) return;
    
    triggerSound('tick');
    setPlayerPos({ x: nx, y: ny });

    // Check collision with letters
    const activeItem = mazeItems.find(item => item.x === nx && item.y === ny && !item.collected);
    if (activeItem) {
      const nextExpectedChar = mazeGoalWord[mazeCollected.length];
      if (activeItem.char === nextExpectedChar) {
        triggerSound('ding');
        setMazeCollected(prev => prev + activeItem.char);
        setMazeItems(items => items.map(item => item.id === activeItem.char ? { ...item, collected: true } : item));
        // Soft delete item visual
        activeItem.collected = true;
        setMazeScore(s => s + 200);
        
        const newWord = mazeCollected + activeItem.char;
        if (newWord === mazeGoalWord) {
          triggerSound('win');
          setMazeMessage(`🎉 Xuất sắc! Em đã hoàn thành từ khóa "${mazeGoalWord}"! (+600đ)`);
          setMazeScore(s => s + 400);
        } else {
          setMazeMessage(`Tuyệt vời! Đã nhặt chữ "${activeItem.char}". Hãy tìm chữ tiếp theo!`);
        }
      } else {
        triggerSound('lose');
        setMazeMessage(`⚠️ Sai thứ tự rồi! Em cần tìm chữ "${nextExpectedChar}" trước!`);
      }
    }

    // Check collision with ghosts/bombs
    const hitObstacle = mazeObstacles.find(o => o.x === nx && o.y === ny);
    if (hitObstacle) {
      triggerSound('lose');
      setMazeScore(s => Math.max(0, s - 50));
      setMazeMessage("💥 Bị va phải chướng ngại vật! Trừ 50 điểm!");
    }
  };

  const handleResetMaze = () => {
    setPlayerPos({ x: 0, y: 0 });
    setMazeCollected('');
    setMazeScore(0);
    setMazeMessage('Hãy dẫn thỏ nhặt đúng thứ tự C - P - U!');
    setMazeItems([
      { char: 'C', x: 2, y: 1, collected: false },
      { char: 'P', x: 4, y: 3, collected: false },
      { char: 'U', x: 1, y: 5, collected: false },
    ]);
    triggerSound('click');
  };

  // --- GAME 6: ĐUA XE PHẢN LỰC AI STATE & LOGIC ---
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingInput, setTypingInput] = useState('');
  const [typingStarted, setTypingStarted] = useState(false);
  const [typingTimeLeft, setTypingTimeLeft] = useState(30);
  const [typingWPM, setTypingWPM] = useState(0);
  const [typingAccuracy, setTypingAccuracy] = useState(100);
  const [typingFinished, setTypingFinished] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startTypingGame = () => {
    setTypingInput('');
    setTypingStarted(true);
    setTypingTimeLeft(30);
    setTypingFinished(false);
    setTypingWPM(0);
    setTypingAccuracy(100);
    triggerSound('click');
    
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    
    typingTimerRef.current = setInterval(() => {
      setTypingTimeLeft(prev => {
        if (prev <= 1) {
          if (typingTimerRef.current) clearInterval(typingTimerRef.current);
          setTypingFinished(true);
          triggerSound('lose');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (typingStarted && !typingFinished) {
      const targetText = TYPING_TEXTS[typingIndex];
      let correctChars = 0;
      for (let i = 0; i < typingInput.length; i++) {
        if (typingInput[i] === targetText[i]) {
          correctChars++;
        }
      }
      const acc = typingInput.length > 0 ? Math.round((correctChars / typingInput.length) * 100) : 100;
      setTypingAccuracy(acc);

      if (typingInput.length > 0 && typingInput[typingInput.length - 1] === targetText[typingInput.length - 1]) {
        triggerSound('tick');
      }

      if (typingInput === targetText) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setTypingFinished(true);
        const timeTaken = 30 - typingTimeLeft;
        const speed = timeTaken > 0 ? Math.round((typingInput.split(' ').length / timeTaken) * 60) : 40;
        setTypingWPM(speed);
        triggerSound('win');
        showToast('🎉 Tuyệt vời! Em đã hoàn thành xuất sắc chặng đua gõ phím này!', 'success');
      }
    }
  }, [typingInput, typingStarted, typingFinished, typingIndex]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const resetTypingGame = () => {
    setTypingInput('');
    setTypingStarted(false);
    setTypingFinished(false);
    setTypingTimeLeft(30);
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
  };

  // --- CATALOG GAMES LIST DATA ---
  const gamesList = [
    {
      id: 'lucky-wheel',
      title: 'Vòng Quay May Mắn',
      description: 'Công cụ chọn ngẫu nhiên học sinh hoặc phần thưởng trên lớp học. Giao diện trực quan sống động.',
      plays: 180,
      badge: 'MIỄN PHÍ',
      category: 'INTERACTIVE GAME',
      coverType: 'wheel',
      bgGradient: 'from-amber-400 via-orange-500 to-red-600',
    },
    {
      id: 'tug-of-war',
      title: 'Kéo Co Kiến Thức',
      description: 'Trò chơi trắc nghiệm đối kháng kéo co đầy kịch tính dành cho hai đội chơi trên lớp.',
      plays: 142,
      badge: 'MIỄN PHÍ',
      category: 'INTERACTIVE GAME',
      coverType: 'rope',
      bgGradient: 'from-blue-500 via-indigo-600 to-purple-700',
    },
    {
      id: 'gold-miner',
      title: 'Đào Vàng Trí Tuệ',
      description: 'Căn góc thả lưỡi câu để gắp chính xác các khối vàng chứa đáp án đúng dưới lòng đất.',
      plays: 339,
      badge: 'MIỄN PHÍ',
      category: 'INTERACTIVE GAME',
      coverType: 'gold',
      bgGradient: 'from-yellow-700 via-yellow-600 to-yellow-900',
    },
    {
      id: 'seesaw',
      title: 'Bập bênh',
      description: 'Giải đố kiến thức để xếp các quả cân vật lý lên bập bênh sao cho cân bằng hoặc nghiêng đúng hướng.',
      plays: 82,
      badge: 'MIỄN PHÍ',
      category: 'INTERACTIVE GAME',
      coverType: 'seesaw',
      bgGradient: 'from-sky-400 via-teal-400 to-emerald-500',
    },
    {
      id: 'maze',
      title: 'Mê Cung Ký Tự',
      description: 'Điều khiển chú thỏ vượt mê cung nhặt các chữ cái ghép thành từ khóa đáp án đúng và tránh các chướng ngại vật.',
      plays: 453,
      badge: 'MIỄN PHÍ',
      category: 'INTERACTIVE GAME',
      coverType: 'maze',
      bgGradient: 'from-indigo-900 via-slate-900 to-purple-950',
    },
    {
      id: 'racing',
      title: 'Đua Xe Phản Lực AI',
      description: 'Trò chơi trắc nghiệm đua xe phản lực. Học sinh gõ chữ để tăng tốc xe đua vượt qua bot đối thủ để về đích.',
      plays: 251,
      badge: 'MIỄN PHÍ',
      category: 'INTERACTIVE GAME',
      coverType: 'racing',
      bgGradient: 'from-slate-800 via-blue-900 to-indigo-950',
    }
  ];

  const filteredGames = gamesList.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleShareGame = (title: string) => {
    const shareUrl = `${window.location.origin}/share/game?type=${encodeURIComponent(title)}`;
    navigator.clipboard.writeText(shareUrl);
    showToast(`🔗 Đã sao chép liên kết chia sẻ trò chơi "${title}" vào khay nhớ tạm!`, "success");
    triggerSound('ding');
  };

  // --- RENDER CSS COVER FOR GAMES ---
  const renderGameCover = (type: string) => {
    if (type === 'wheel') {
      return (
        <div className="w-full h-40 bg-gradient-to-tr from-violet-600 to-purple-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] animate-pulse" />
          <div className="w-24 h-24 rounded-full border-4 border-amber-300 relative flex items-center justify-center animate-spin" style={{ animationDuration: '10s' }}>
            <div className="absolute inset-0 rounded-full border-t-8 border-t-red-500 border-r-8 border-r-yellow-400 border-b-8 border-b-emerald-500 border-l-8 border-l-blue-500" />
            <div className="w-4 h-4 bg-amber-300 rounded-full shadow z-10" />
          </div>
          <div className="absolute text-center select-none font-black text-amber-300 text-sm tracking-widest uppercase bg-slate-900/40 py-1 px-3.5 rounded-full border border-amber-300/30">
            VÒNG QUAY ETA
          </div>
        </div>
      );
    }
    if (type === 'rope') {
      return (
        <div className="w-full h-40 bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-700 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent)]" />
          <div className="w-full h-2 bg-amber-100 relative flex items-center justify-center">
            <div className="w-5 h-5 bg-red-500 rounded-full animate-bounce flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">🚩</span>
            </div>
          </div>
          <div className="absolute top-4 text-center font-black text-white text-xs tracking-widest uppercase bg-blue-900/50 py-1 px-3 rounded-full border border-blue-400/30">
            KÉO CO KIẾN THỨC
          </div>
          <div className="flex justify-between w-full px-6 absolute bottom-6 text-2xl animate-pulse">
            <span>👦</span>
            <span>👧</span>
          </div>
        </div>
      );
    }
    if (type === 'gold') {
      return (
        <div className="w-full h-40 bg-gradient-to-tr from-amber-700 via-amber-800 to-yellow-950 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2 left-2 text-amber-400 text-xs font-black">⛏️ GOLD ARENA</div>
          <div className="w-10 h-10 rounded-full border-2 border-amber-300/40 relative flex items-center justify-center animate-bounce">
            <span className="text-xl">🪝</span>
          </div>
          <div className="absolute bottom-3 flex items-center gap-2">
            <span className="text-xl animate-pulse">💎</span>
            <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🪙</span>
            <span className="text-xl animate-pulse">💎</span>
          </div>
          <div className="absolute text-center font-black text-amber-200 text-[11px] uppercase tracking-wider bg-slate-950/60 py-1 px-3 rounded border border-amber-500/20">
            TUỆ - ĐÀO VÀNG
          </div>
        </div>
      );
    }
    if (type === 'seesaw') {
      return (
        <div className="w-full h-40 bg-gradient-to-tr from-emerald-500 to-teal-700 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
          <div className="w-28 h-1 bg-amber-400 relative rotate-6 flex items-center justify-between">
            <span className="text-lg -mt-5">👦</span>
            <span className="text-lg -mt-5">👧</span>
          </div>
          <div className="w-4 h-4 bg-slate-800 rounded-t-full -mt-0.5" />
          <div className="absolute text-center font-black text-emerald-100 text-xs tracking-wider uppercase bg-emerald-950/40 py-1 px-3 rounded-full border border-emerald-400/30 mt-12">
            BẬP BÊNH VUI VẺ
          </div>
        </div>
      );
    }
    if (type === 'maze') {
      return (
        <div className="w-full h-40 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden border-b border-indigo-950">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-15">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-indigo-500/40" />
            ))}
          </div>
          <div className="w-14 h-14 border border-cyan-400/50 rounded flex items-center justify-center relative shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse">
            <span className="text-xl">🐰</span>
            <span className="absolute -top-2 -right-2 text-xs font-black text-cyan-400">A</span>
          </div>
          <div className="absolute text-center font-black text-cyan-400 text-xs tracking-widest uppercase bg-indigo-950/80 py-1 px-3 rounded border border-cyan-400/30 mt-20">
            MÊ CUNG KÝ TỰ
          </div>
        </div>
      );
    }
    if (type === 'racing') {
      return (
        <div className="w-full h-40 bg-gradient-to-tr from-slate-900 to-slate-850 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full h-4 bg-slate-800 border-y border-dashed border-slate-700 relative flex items-center justify-start overflow-hidden">
            <div className="text-xs animate-marquee whitespace-nowrap text-amber-400 font-mono tracking-widest">
              🏎️💨 . . . . . . . . 🛸💨
            </div>
          </div>
          <div className="absolute text-center font-black text-red-400 text-xs tracking-widest uppercase bg-slate-950/80 py-1 px-3 rounded-full border border-red-500/30 mt-12">
            ĐUA XE PHẢN LỰC
          </div>
        </div>
      );
    }
    return <div className="w-full h-40 bg-gradient-to-tr from-slate-500 to-slate-700" />;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Unified Interactive Games Header */}
      {activeSubGame === null && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent p-4 rounded-3xl border border-slate-200/60 gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wide">Trò Chơi Tương Tác Lớp Học</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hoạt động đố vui & Trò chơi vận động</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* General Stats Pill */}
            <div className="bg-slate-50/85 px-3 py-1.5 rounded-2xl border border-slate-200/50 flex items-center gap-2">
              <div className="bg-amber-100 text-amber-700 p-1 rounded-lg">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[8px] text-slate-450 font-black block uppercase tracking-wider">Kho Trò Chơi</span>
                <strong className="text-[11px] font-black text-slate-700">6 Phòng Game</strong>
              </div>
            </div>

            {/* Sound Controller */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- LOBBY GAME CATALOG DIRECTORY ---                           */}
      {/* ============================================================== */}
      {activeSubGame === null && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Search bar & filter */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm tên trò chơi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="text-[11px] font-bold text-slate-400 italic">
              *Mẹo: Chọn trò chơi và nhấn nút <strong className="text-blue-600">Chơi ngay</strong> để mở màn hình trò chơi trực quan!
            </div>
          </div>

          {/* Grid of Games Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <div 
                key={game.id} 
                className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300 relative"
              >
                {/* MIỄN PHÍ Badges top-left */}
                <div className="absolute top-3 left-3 bg-[#10b981] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                  {game.badge}
                </div>

                {/* Cover Image container */}
                <div className="relative overflow-hidden shrink-0">
                  {renderGameCover(game.coverType)}
                </div>

                {/* Game Body details */}
                <div className="p-5 flex-1 flex flex-col space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                      {game.category}
                    </span>
                    
                    {/* Fire count popularity pill */}
                    <span className="bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      🔥 {game.plays} lượt
                    </span>
                  </div>

                  <div className="text-left space-y-1">
                    <h3 className="text-slate-800 text-base font-black tracking-tight group-hover:text-[#2563eb] transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  {/* Actions footer row */}
                  <div className="pt-3 border-t border-slate-50 flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setSetupGame(game);
                        setSetupSubjectId('default');
                        setSetupClassId('none');
                      }}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-black px-5 py-3 flex-1 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      Chơi ngay
                    </button>
                    
                    <button
                      onClick={() => handleShareGame(game.title)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl p-3 flex items-center justify-center transition-all cursor-pointer"
                      title="Chia sẻ trò chơi"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME 1: VÒNG QUAY MAY MẮN (LUCKY WHEEL) DISPLAY ---        */}
      {/* ============================================================== */}
      {activeSubGame === 'lucky-wheel' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="flex justify-between items-center border-b border-slate-100 py-2.5 px-4 shrink-0 bg-slate-50/50 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-slate-550 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-200/50 py-1 px-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại danh sách
              </button>

              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                🎡 Vòng Quay May Mắn
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>

          <div className="flex-1 w-full h-full min-h-[500px]">
            <iframe
              src="/lucky_wheel_game.html"
              className="w-full h-full border-0"
              title="Vòng Quay May Mắn"
              allow="autoplay; clipboard-write; microphone; camera"
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME 2: KÉO CO KIẾN THỨC (TUG OF WAR) DISPLAY ---          */}
      {/* ============================================================== */}
      {activeSubGame === 'tug-of-war' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-slate-550 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại danh sách
              </button>

              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                🪢 Kéo Co Trí Tuệ
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>

          {/* Tug of war game board */}
          <div className="space-y-6">
            {/* Visual Arena Rope and players */}
            <div className="bg-gradient-to-b from-sky-50 to-emerald-50/60 p-6 rounded-3xl border border-slate-200/50 relative overflow-hidden min-h-[180px] flex flex-col justify-between">
              
              {/* Score indicators */}
              <div className="flex justify-between items-center w-full relative z-10">
                <div className="bg-rose-500 text-white rounded-xl px-4 py-1.5 font-black text-xs shadow">
                  🔴 ĐỘI ĐỎ: {tugRedScore} đ
                </div>
                <div className="text-center bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500">
                  Phân định thắng thua tại vạch ranh giới!
                </div>
                <div className="bg-blue-600 text-white rounded-xl px-4 py-1.5 font-black text-xs shadow">
                  🔵 ĐỘI XANH: {tugBlueScore} đ
                </div>
              </div>

              {/* Rope pulling graphic */}
              <div className="relative w-full h-12 flex items-center justify-center my-4">
                {/* Tug field center line */}
                <div className="absolute top-0 bottom-0 w-1 bg-slate-400/40 z-0" />
                <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-2 bg-yellow-800 rounded-full shadow-inner" />

                {/* Pulling Rope Container with dynamic margin offset */}
                <div 
                  className="absolute h-8 flex items-center justify-center transition-all duration-500"
                  style={{ transform: `translateX(${tugPosition}px)` }}
                >
                  <span className="text-3xl pr-8">🏃🔴</span>
                  <div className="w-24 h-1.5 bg-amber-200 border border-amber-400 relative flex items-center justify-center">
                    <span className="absolute text-xl -mt-5">🚩</span>
                  </div>
                  <span className="text-3xl pl-8">🔵🏃</span>
                </div>
              </div>

              {/* Status text */}
              <div className="text-center relative z-10 font-black text-xs text-slate-700 uppercase tracking-widest">
                {tugWinner ? (
                  <span className="text-emerald-600">🏆 Chúc mừng ĐỘI {tugWinner === 'red' ? 'ĐỎ' : 'XANH'} đã chiến thắng chung cuộc!</span>
                ) : (
                  <span>Lượt thi đấu của: <strong className={tugTurn === 'red' ? 'text-rose-500' : 'text-blue-600'}>{tugTurn === 'red' ? '🔴 ĐỘI ĐỎ' : '🔵 ĐỘI XANH'}</strong></span>
                )}
              </div>
            </div>

            {/* Answer & Question Board */}
            {tugWinner ? (
              <div className="bg-emerald-50/50 border border-dashed border-emerald-200 rounded-3xl p-8 text-center space-y-4">
                <span className="text-5xl">👑🥇🏆</span>
                <h3 className="text-base font-black text-emerald-800 uppercase tracking-widest">Vòng đấu kết thúc!</h3>
                <p className="text-xs text-slate-550 max-w-sm mx-auto font-semibold">
                  Đội {tugWinner === 'red' ? 'Đỏ' : 'Xanh'} đã hoàn thành xuất sắc việc kéo sập ranh giới đối phương nhờ sự thông thái của mình!
                </p>
                <button
                  onClick={resetTugGame}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase px-6 py-3 rounded-xl transition"
                >
                  Chơi ván mới
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2.5xl border border-slate-200 space-y-5 text-left">
                {/* Active Question */}
                <div className="space-y-1">
                  <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-black px-2.5 py-0.5 rounded uppercase">
                    Câu hỏi số {tugActiveQIdx + 1}
                  </span>
                  <h4 className="text-sm font-black text-slate-800 pt-1.5">
                    {triviaQuestions[tugActiveQIdx % triviaQuestions.length].title}
                  </h4>
                </div>

                {/* Multiple Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {triviaQuestions[tugActiveQIdx % triviaQuestions.length].options.map((opt, oIdx) => {
                    const isSelected = tugSelectedAns === oIdx;
                    const isCorrect = oIdx === triviaQuestions[tugActiveQIdx % triviaQuestions.length].correctIndex;
                    const showCorrectness = tugAnswered;

                    let btnStyle = 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100';
                    if (showCorrectness) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                      } else {
                        btnStyle = 'bg-white/40 border-slate-150 text-slate-350 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleTugAnswer(oIdx)}
                        disabled={tugAnswered}
                        className={`p-3.5 border-2 rounded-2xl text-xs font-semibold flex items-start gap-3 text-left transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          showCorrectness && isCorrect 
                            ? 'bg-emerald-500 text-white' 
                            : showCorrectness && isSelected 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-slate-150 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="break-words min-w-0 flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation and next controls */}
                {tugAnswered && (
                  <div className="pt-3 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[11px] text-slate-500 italic">
                      *Gợi ý: {triviaQuestions[tugActiveQIdx % triviaQuestions.length].explanation}
                    </p>
                    
                    <button
                      onClick={handleNextTug}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      Tiếp tục lượt sau
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME 3: ĐÀO VÀNG TRÍ TUỆ (GOLD MINER) DISPLAY ---          */}
      {/* ============================================================== */}
      {activeSubGame === 'gold-miner' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-slate-550 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại danh sách
              </button>

              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                ⛏️ Đào Vàng Trí Tuệ
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>

          {/* Gold Miner Game Core layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Golden Miner Arena board */}
            <div className="lg:col-span-8 bg-amber-950 p-4 rounded-3xl relative overflow-hidden min-h-[360px] flex flex-col justify-between shadow-2xl border-4 border-amber-900">
              {/* Sky segment */}
              <div className="h-14 w-full bg-amber-100 border-b-2 border-amber-900 rounded-t-2xl flex justify-between items-center px-4 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🤠</span>
                  <div className="text-left leading-none">
                    <span className="text-[8px] font-black text-amber-800 block uppercase">Thợ Đào Vàng</span>
                    <strong className="text-xs font-black text-slate-700">Độ sâu: 120m</strong>
                  </div>
                </div>

                {/* Visual Swinger Cart hook center anchor points */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-8 h-4 bg-slate-700 rounded-sm" />
                  {/* Rope rendering line */}
                  <div 
                    className="w-1 bg-yellow-500 origin-top shadow-lg"
                    style={{ 
                      height: `${hookLength}px`, 
                      transform: `rotate(${hookAngle}deg)`,
                      transition: hookStatus === 'swinging' ? 'none' : 'height 0.05s linear'
                    }}
                  >
                    {/* The metallic claw */}
                    <div className="absolute bottom-0 -left-2 text-base">
                      {minedItem ? (
                        minedItem.type === 'gold' ? '🪙' : minedItem.type === 'diamond' ? '💎' : '🪨'
                      ) : (
                        '🪝'
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-lg">
                  🪙 VÀNG: {goldScore}
                </div>
              </div>

              {/* Underground Mine cavern section */}
              <div className="flex-1 relative">
                {/* Cavern background details */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/60 to-yellow-950/80 z-0" />
                
                {/* Active Items rendering on relative pos */}
                {goldItems.map(item => (
                  <div 
                    key={item.id} 
                    className="absolute text-2xl transition-all duration-300 animate-pulse z-10"
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  >
                    {item.type === 'gold' ? '🪙' : item.type === 'diamond' ? '💎' : '🪨'}
                    <span className="absolute -bottom-2 -left-2 text-[8px] bg-slate-900/80 text-amber-300 font-bold px-1 rounded">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom bar control action */}
              <div className="h-14 w-full bg-amber-900 border-t-2 border-amber-950 rounded-b-2xl flex items-center justify-center px-4 relative z-10">
                <button
                  onClick={handleShootHook}
                  disabled={hookStatus !== 'swinging'}
                  className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow transition-all ${
                    hookStatus === 'swinging' 
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-amber-950 active:scale-95' 
                      : 'bg-slate-700 text-slate-550 cursor-not-allowed'
                  }`}
                >
                  {hookStatus === 'shooting' ? '🎣 ĐANG THẢ CÂU...' : hookStatus === 'retrieving' ? '⚙️ ĐANG KÉO LÊN...' : '👇 THẢ CÂU NGAY (BẤM)'}
                </button>
              </div>
            </div>

            {/* Right side: Trivia interaction during miners */}
            <div className="lg:col-span-4 bg-slate-50 p-5 rounded-3xl border border-slate-200/60 flex flex-col justify-between min-h-[360px]">
              {hookStatus === 'question' && goldMinedQ && minedItem ? (
                <div className="space-y-4 text-left animate-in fade-in zoom-in-95">
                  <div className="text-center space-y-1">
                    <span className="text-3xl">🤖💎</span>
                    <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest">THỬ THÁCH NHẬN VÀNG</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Trả lời đúng để đổi lấy khối sản vật trị giá <strong className="text-amber-600 font-bold">+{minedItem.value} vàng</strong>!</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-black text-slate-700">
                    Câu hỏi: {goldMinedQ.title}
                  </div>

                  <div className="space-y-2">
                    {goldMinedQ.options.map((opt, idx) => {
                      const isSelected = goldMinedAns === idx;
                      const isCorrect = idx === goldMinedQ.correctIndex;
                      const showResult = goldMinedAnswered;

                      let cStyle = 'bg-white border-slate-200 hover:bg-slate-100';
                      if (showResult) {
                        if (isCorrect) cStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                        else if (isSelected) cStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                        else cStyle = 'bg-white/50 border-slate-150 text-slate-400 opacity-60';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleGoldQuestionAnswer(idx)}
                          disabled={goldMinedAnswered}
                          className={`w-full p-2.5 border rounded-xl text-xs font-semibold text-left transition-all cursor-pointer flex items-center gap-2 ${cStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="truncate flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {goldMinedAnswered && (
                    <button
                      onClick={handleCloseGoldQuestion}
                      className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase py-2.5 rounded-xl shadow cursor-pointer mt-2"
                    >
                      Tiếp tục hành trình
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center space-y-4 my-auto">
                  <span className="text-5xl animate-bounce block">🤠⛏️</span>
                  <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest">PHÒNG ĐÀO VÀNG</h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
                    Căn lúc mỏ neo xoay ở hướng thẳng hàng với các vật phẩm (🪙 hoặc 💎) bên dưới rồi nhấn <strong className="text-amber-700">THẢ CÂU</strong> để bắt lấy kho báu!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME 4: BẬP BÊNH STATE & VISUAL DISPLAY ---                */}
      {/* ============================================================== */}
      {activeSubGame === 'seesaw' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-slate-550 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại danh sách
              </button>

              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                ⚖️ Bập Bênh Cân Bằng
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {/* Visual Seesaw Arena */}
            <div className="bg-gradient-to-b from-teal-50 to-emerald-50/60 p-6 rounded-3xl border border-slate-200/50 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-center w-full z-10">
                <span className="bg-teal-600 text-white rounded-xl px-3 py-1 font-black text-xs shadow">
                  Mức điểm: {seesawScore}đ
                </span>
                
                <span className="bg-white/90 border border-slate-200 text-[10px] font-black px-3 py-1 rounded-full text-slate-500">
                  Cấp độ {seesawLevel + 1}
                </span>
              </div>

              {/* Seesaw pivot & plank */}
              <div className="relative w-full h-24 flex items-center justify-center my-6">
                <div 
                  className={`w-72 h-2.5 rounded-full shadow-md transition-transform duration-500 origin-center flex items-center justify-between px-6 relative ${
                    seesawStatus === 'level' 
                      ? 'bg-amber-400 rotate-0' 
                      : seesawStatus === 'tilted-left' 
                      ? 'bg-teal-500 -rotate-12' 
                      : 'bg-teal-500 rotate-12'
                  }`}
                >
                  {/* Left weight target */}
                  <div className="absolute -top-12 left-4 flex flex-col items-center select-none bg-white p-2 rounded-xl border border-slate-200 shadow-sm leading-none z-10">
                    <span className="text-xl">🎁</span>
                    <strong className="text-[10px] font-black text-slate-700 mt-1">
                      {SEESAW_LEVELS[seesawLevel % SEESAW_LEVELS.length].target} KG
                    </strong>
                  </div>

                  {/* Right chosen block weight */}
                  <div className="absolute -top-12 right-4 flex flex-col items-center select-none bg-white p-2 rounded-xl border border-slate-200 shadow-sm leading-none z-10">
                    <span className="text-xl">⚖️</span>
                    <strong className="text-[10px] font-black text-slate-700 mt-1">
                      {seesawAnswered 
                        ? `${SEESAW_LEVELS[seesawLevel % SEESAW_LEVELS.length].options[seesawSelected!].value} KG` 
                        : '? KG'
                      }
                    </strong>
                  </div>
                </div>

                {/* Triangle stand */}
                <div className="absolute bottom-2 w-8 h-8 bg-slate-800 clip-triangle shadow-lg" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
              </div>

              <div className="text-center text-xs font-black text-slate-700">
                {seesawAnswered ? (
                  seesawStatus === 'level' ? (
                    <span className="text-emerald-600">🏆 Chúc mừng! Sức cân bằng lý tưởng!</span>
                  ) : (
                    <span className="text-rose-500">💥 Bập bênh bị mất thăng bằng rồi!</span>
                  )
                ) : (
                  <span>Hãy tính toán phép tính bên dưới sao cho có giá trị bằng: <strong className="text-teal-600">{SEESAW_LEVELS[seesawLevel % SEESAW_LEVELS.length].target} kg</strong>!</span>
                )}
              </div>
            </div>

            {/* Selection choices panel */}
            <div className="bg-slate-50 p-6 rounded-2.5xl border border-slate-200 space-y-4">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block text-left">Lựa chọn quả cân cân đối</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SEESAW_LEVELS[seesawLevel % SEESAW_LEVELS.length].options.map((opt, idx) => {
                  const isSelected = seesawSelected === idx;
                  const isCorrect = opt.value === SEESAW_LEVELS[seesawLevel % SEESAW_LEVELS.length].target;
                  const showResult = seesawAnswered;

                  let cardStyle = 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300';
                  if (showResult) {
                    if (isCorrect) cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                    else if (isSelected) cardStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                    else cardStyle = 'bg-white/40 border-slate-150 text-slate-300 opacity-60';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSeesawChoose(idx)}
                      disabled={seesawAnswered}
                      className={`p-4 border-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${cardStyle}`}
                    >
                      <span className="text-base font-black font-mono text-slate-700">{opt.text}</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1">Nặng: {opt.value} kg</span>
                    </button>
                  );
                })}
              </div>

              {seesawAnswered && (
                <div className="pt-3 border-t border-slate-200/50 flex justify-end">
                  <button
                    onClick={handleNextSeesaw}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase px-6 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    Cấp độ tiếp theo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME 5: MÊ CUNG KÝ TỰ DISPLAY ---                          */}
      {/* ============================================================== */}
      {activeSubGame === 'maze' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-slate-550 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại danh sách
              </button>

              <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                🌀 Mê Cung Ghép Chữ
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Interactive Maze grid board */}
            <div className="lg:col-span-8 bg-slate-900 p-4 rounded-3xl flex flex-col items-center shadow-2xl border-4 border-slate-850">
              
              {/* Header stats */}
              <div className="flex justify-between items-center w-full bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/50 text-xs font-bold text-white mb-4">
                <span>🎯 Điểm: {mazeScore}đ</span>
                <span>Từ cần ghép: <strong className="text-cyan-400 font-mono tracking-widest">{mazeGoalWord}</strong></span>
                <span>Đã thu thập: <strong className="text-yellow-400 font-mono">{mazeCollected || '___'}</strong></span>
              </div>

              {/* Game Grid */}
              <div className="grid grid-cols-6 gap-1 w-full max-w-[320px] aspect-square bg-slate-950 p-2 rounded-2xl border border-slate-800 relative">
                {Array.from({ length: MAZE_SIZE * MAZE_SIZE }).map((_, idx) => {
                  const x = idx % MAZE_SIZE;
                  const y = Math.floor(idx / MAZE_SIZE);
                  
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const item = mazeItems.find(i => i.x === x && i.y === y && !i.collected);
                  const obs = mazeObstacles.find(o => o.x === x && o.y === y);

                  return (
                    <div 
                      key={idx} 
                      className={`relative flex items-center justify-center rounded-xl border font-bold text-xs ${
                        isPlayer 
                          ? 'bg-cyan-500 text-[#0a2c2f] scale-105 border-cyan-300 z-10' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {isPlayer ? (
                        <span className="text-lg">🐰</span>
                      ) : item ? (
                        <div className="bg-yellow-400 text-slate-900 text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center animate-bounce">
                          {item.char}
                        </div>
                      ) : obs ? (
                        <span className="text-base">{obs.type === 'ghost' ? '👻' : '💣'}</span>
                      ) : (
                        <span className="opacity-10 text-[6px]">⚫</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Message block */}
              <div className="bg-slate-850 border border-slate-700 text-[11px] text-cyan-200 px-4 py-2 rounded-xl mt-4 text-center max-w-sm">
                {mazeMessage}
              </div>
            </div>

            {/* Right side: Directional d-pad controls */}
            <div className="lg:col-span-4 bg-slate-50 p-5 rounded-3xl border border-slate-200/60 flex flex-col justify-between items-center min-h-[320px]">
              <div className="text-center space-y-1 w-full">
                <span className="text-3xl block">🎮🐇</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">BỘ ĐIỀU KHIỂN D-PAD</h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Em có thể dùng các phím bấm phía dưới để dẫn lối chú thỏ tinh nghịch vượt mê cung thu thập chữ!</p>
              </div>

              {/* Layout for arrows */}
              <div className="flex flex-col items-center justify-center gap-2 my-4">
                <button
                  onClick={() => handleMazeMove(0, -1)}
                  className="w-12 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow font-black flex items-center justify-center text-lg active:scale-90 transition cursor-pointer"
                >
                  ▲
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMazeMove(-1, 0)}
                    className="w-12 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow font-black flex items-center justify-center text-lg active:scale-90 transition cursor-pointer"
                  >
                    ◀
                  </button>
                  <button
                    onClick={handleResetMaze}
                    className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow font-black flex items-center justify-center text-xs active:scale-90 transition cursor-pointer"
                  >
                    LÀM MỚI
                  </button>
                  <button
                    onClick={() => handleMazeMove(1, 0)}
                    className="w-12 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow font-black flex items-center justify-center text-lg active:scale-90 transition cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
                <button
                  onClick={() => handleMazeMove(0, 1)}
                  className="w-12 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow font-black flex items-center justify-center text-lg active:scale-90 transition cursor-pointer"
                >
                  ▼
                </button>
              </div>

              <div className="p-3 bg-cyan-50/40 rounded-2xl border border-cyan-150 text-[10px] text-slate-500 italic font-semibold text-center leading-relaxed">
                Mách nhỏ: Đừng chạm vào bóng ma 👻 hay bom 💣 để không bị trừ điểm nha!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME 6: ĐUA XE PHẢN LỰC AI (TYPING RACING) DISPLAY ---      */}
      {/* ============================================================== */}
      {activeSubGame === 'racing' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-slate-550 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại danh sách
              </button>

              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                🏎️ Đua Xe Siêu Tốc AI
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm thanh: BẬT
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Âm thanh: TẮT
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main typing arena dashboard */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-150 space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Keyboard className="w-5 h-5 text-red-500" />
                  ĐƯỜNG ĐUA PHẢN XẠ PHÒNG MÁY
                </h3>
                
                <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-600">
                  Thời gian: {typingTimeLeft}s
                </span>
              </div>

              {/* Goal text model */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center select-none space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Câu mẫu đua xe</span>
                <p className="text-xs font-black text-slate-700 tracking-wide font-mono leading-relaxed px-4">
                  {TYPING_TEXTS[typingIndex]}
                </p>
              </div>

              {/* Arena inputs */}
              <div className="space-y-3">
                {!typingStarted ? (
                  <button
                    onClick={startTypingGame}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Play className="w-4 h-4 text-white" />
                    KHỞI ĐỘNG ĐỘNG CƠ! BẤM ĐỂ ĐUA
                  </button>
                ) : typingFinished ? (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-150 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left space-y-0.5">
                      <h4 className="text-xs font-black text-emerald-800 uppercase">CHẶNG ĐUA HOÀN THÀNH</h4>
                      <p className="text-[10px] text-emerald-600 font-bold">Hãy xem kết quả tay đua siêu tốc của em!</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center bg-white border border-emerald-200 px-3 py-1 rounded-lg">
                        <span className="text-[8px] text-slate-400 font-black block uppercase">Tốc độ</span>
                        <strong className="text-xs font-black text-emerald-700">{typingWPM || '35'} WPM</strong>
                      </div>
                      <div className="text-center bg-white border border-emerald-200 px-3 py-1 rounded-lg">
                        <span className="text-[8px] text-slate-400 font-black block uppercase">Chính xác</span>
                        <strong className="text-xs font-black text-emerald-700">{typingAccuracy}%</strong>
                      </div>
                      <button
                        onClick={startTypingGame}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={typingInput}
                    onChange={(e) => setTypingInput(e.target.value)}
                    placeholder="Bắt đầu gõ thật nhanh dòng chữ phía trên tại đây..."
                    autoFocus
                    className="w-full bg-white border-2 border-red-400 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 font-mono tracking-wide focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-inner"
                  />
                )}
              </div>

              {/* Racetrack Visual Animation progress bar */}
              <div className="bg-slate-50 p-4 rounded-2.5xl border border-slate-200 space-y-4">
                <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block text-left">Tiến độ đua xe (Live Track)</span>
                
                <div className="space-y-4 relative">
                  {/* Lane 1: Player car */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-slate-600">👤 TAY ĐUA (EM):</span>
                      <span className="text-red-500 font-mono">Chính xác: {typingAccuracy}%</span>
                    </div>
                    <div className="h-7 bg-slate-200 rounded-full relative overflow-hidden border border-slate-300">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 to-amber-400 rounded-full flex items-center justify-end px-3 transition-all"
                        style={{ width: `${Math.min(100, Math.max(10, (typingInput.length / TYPING_TEXTS[typingIndex].length) * 100))}%` }}
                      >
                        <span className="text-sm">🏎️</span>
                      </div>
                    </div>
                  </div>

                  {/* Lane 2: AI car opponent */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-500">🤖 BOT KIẾN THỨC (ĐỐI THỦ):</span>
                      <span className="text-indigo-500 font-mono">Tốc độ: 35 WPM</span>
                    </div>
                    <div className="h-7 bg-slate-200 rounded-full relative overflow-hidden border border-slate-300">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full flex items-center justify-end px-3 transition-all"
                        style={{ 
                          width: typingStarted && !typingFinished 
                            ? `${Math.min(100, (30 - typingTimeLeft) * 3.6)}%` 
                            : typingFinished ? '100%' : '10%' 
                        }}
                      >
                        <span className="text-sm">🛸</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side sentence selections */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-150 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-50 text-left">
                CHỌN CHẶNG ĐUA ({TYPING_TEXTS.length})
              </h3>

              <div className="space-y-2">
                {TYPING_TEXTS.map((txt, idx) => {
                  const isActive = typingIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setTypingIndex(idx);
                        resetTypingGame();
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-red-50 border-red-300 text-red-800 shadow-sm' 
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <div className="flex justify-between items-center leading-none">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Chặng đua {idx + 1}</span>
                        {isActive && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">ĐANG CHẠY</span>}
                      </div>
                      <p className="text-[11px] font-mono font-bold truncate mt-1.5 text-slate-700">
                        {txt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- GAME SETUP POPUP MODAL ---                                 */}
      {/* ============================================================== */}
      {setupGame && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-fadeIn">
            
            {/* Header section with orange background */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white relative text-left">
              <button
                onClick={() => {
                  setSetupGame(null);
                  triggerSound('click');
                }}
                className="bg-white/15 hover:bg-white/25 text-white rounded-full p-1.5 transition absolute top-6 right-6 cursor-pointer border-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-3 rounded-2xl w-fit">
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-black text-white mt-4 uppercase tracking-wide">
                {setupGame.title}
              </h3>
              <p className="text-[12px] text-white/90 font-medium leading-relaxed mt-1.5">
                {setupGame.description}
              </p>
            </div>

            {/* Form section */}
            <div className="p-6 text-left space-y-5 bg-white">
              {/* Question Bank Select */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  📚 Chọn ngân hàng câu hỏi làm học liệu:
                </label>
                <div className="relative">
                  <select
                    value={setupSubjectId}
                    onChange={(e) => {
                      const subjectId = e.target.value;
                      setSetupSubjectId(subjectId);
                      if (subjectId !== 'default') {
                        const selectedSubject = allSubjects.find(s => s.id === subjectId);
                        if (selectedSubject) {
                          const isCurrentClassValid = allClasses
                            .filter(cls => cls.gradeId === selectedSubject.gradeId)
                            .some(cls => cls.id === setupClassId);
                          if (!isCurrentClassValid && setupClassId !== 'none') {
                            setSetupClassId('none');
                          }
                        }
                      }
                    }}
                    className="w-full border border-slate-200 bg-white rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="default">Dữ liệu mặc định của Game (Có sẵn)</option>
                    {allSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} - Khối {subject.gradeId}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Class Select */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  👥 Chọn lớp để lấy danh sách học sinh:
                </label>
                <div className="relative">
                  <select
                    value={setupClassId}
                    onChange={(e) => setSetupClassId(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="none">Không nạp học sinh (Dành cho thi đấu chia đội)</option>
                    {allClasses
                      .filter((cls) => {
                        if (setupSubjectId === 'default') return true;
                        const selectedSubj = allSubjects.find(s => s.id === setupSubjectId);
                        return selectedSubj ? cls.gradeId === selectedSubj.gradeId : true;
                      })
                      .map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.teacher})
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="bg-slate-50/50 p-6 border-t border-slate-100/80 flex justify-end items-center gap-2 rounded-b-3xl">
              <button
                onClick={() => {
                  setSetupGame(null);
                  triggerSound('click');
                }}
                className="text-slate-500 hover:text-slate-800 font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer border-0 bg-transparent"
              >
                Hủy bỏ
              </button>
              
              <button
                onClick={() => handleStartGame(setupGame.id, setupSubjectId, setupClassId)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer border-0"
              >
                🚀 Bắt đầu chơi ngay!
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
