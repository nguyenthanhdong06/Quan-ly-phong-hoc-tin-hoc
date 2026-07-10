import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, Member } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  HelpCircle, 
  RotateCcw, 
  Check, 
  X, 
  BookOpen, 
  AlertTriangle,
  Grid,
  Table,
  CheckCircle2,
  FileText,
  Sparkles,
  ClipboardCheck,
  List,
  ClipboardList,
  Share2
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  gradeId: number;
}

interface PersonalQuestionsTabProps {
  currentUser: Member | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  selectedGrade?: number;
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'subj-1', name: 'Tin học', gradeId: 1 },
  { id: 'subj-2', name: 'Tin học', gradeId: 2 },
  { id: 'subj-3', name: 'Tin học', gradeId: 3 },
  { id: 'subj-4', name: 'Tin học', gradeId: 4 },
  { id: 'subj-5', name: 'Tin học', gradeId: 5 }
];

const PREDEFINED_TOPICS = [
  {
    group: "Chủ đề 1. Máy tính và em",
    topics: [
      "Bài 1. Thông tin và quyết định",
      "Bài 2. Xử lí thông tin",
      "Bài 3. Máy tính và em",
      "Bài 4. Làm việc với máy tính",
      "Bài 5. Sử dụng bàn phím"
    ]
  },
  {
    group: "Chủ đề 2. Mạng máy tính và Internet",
    topics: [
      "Bài 6. Khám phá thông tin trên Internet"
    ]
  },
  {
    group: "Chủ đề 3. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
    topics: [
      "Bài 7. Sắp xếp để dễ tìm",
      "Bài 8. Sơ đồ hình cây. Tổ chức thông tin trong máy tính",
      "Bài 9. Thực hành với tệp và thư mục trong máy tính"
    ]
  },
  {
    group: "Chủ đề 4. Đạo đức, pháp luật và văn hoá trong môi trường số",
    topics: [
      "Bài 10. Bảo vệ thông tin khi dùng máy tính"
    ]
  },
  {
    group: "Chủ đề 5. Ứng dụng tin học",
    topics: [
      "Bài 11. Bài trình chiếu của em",
      "Bài 12. Tìm hiểu về thế giới tự nhiên",
      "Bài 13. Luyện tập sử dụng chuột"
    ]
  },
  {
    group: "Chủ đề 6. Giải quyết vấn đề với sự trợ giúp của máy tính",
    topics: [
      "Bài 14. Em thực hiện công việc như thế nào?",
      "Bài 15. Công việc được thực hiện theo điều kiện",
      "Bài 16. Công việc của em và sự trợ giúp của máy tính"
    ]
  }
];

const PREDEFINED_TOPICS_BY_GRADE: Record<number, typeof PREDEFINED_TOPICS> = {
  1: [
    {
      group: "Chủ đề 1. Làm quen với máy tính",
      topics: [
        "Bài 1. Bộ phận của máy tính",
        "Bài 2. Tư thế ngồi học máy tính đúng"
      ]
    },
    {
      group: "Chủ đề 2. Sử dụng chuột máy tính",
      topics: [
        "Bài 3. Làm quen chuột máy tính và các thao tác cơ bản",
        "Bài 4. Thực hành sử dụng chuột máy tính"
      ]
    },
    {
      group: "Chủ đề 3. Vừa chơi vừa học cùng máy tính",
      topics: [
        "Bài 5. Bé tập vẽ hình cơ bản với Paint",
        "Bài 6. Trò chơi trí tuệ giúp rèn luyện tư duy"
      ]
    }
  ],
  2: [
    {
      group: "Chủ đề 1. Máy tính xung quanh em",
      topics: [
        "Bài 1. Các loại máy tính và vai trò của chúng",
        "Bài 2. Khởi động và tắt máy tính đúng cách"
      ]
    },
    {
      group: "Chủ đề 2. Làm quen với bàn phím",
      topics: [
        "Bài 3. Các hàng phím chính trên bàn phím",
        "Bài 4. Thực hành đặt tay trên bàn phím"
      ]
    },
    {
      group: "Chủ đề 3. Sáng tạo kỹ thuật số",
      topics: [
        "Bài 5. Tập tô màu và vẽ tranh với các công cụ nâng cao",
        "Bài 6. Sử dụng trò chơi giáo dục ôn luyện kiến thức"
      ]
    }
  ],
  3: PREDEFINED_TOPICS,
  4: [
    {
      group: "Chủ đề 1. Máy tính và em",
      topics: [
        "Bài 1. Phần cứng và phần mềm máy tính",
        "Bài 2. Gõ bàn phím đúng cách"
      ]
    },
    {
      group: "Chủ đề 2. Mạng máy tính và Internet",
      topics: [
        "Bài 3. Thông tin trên trang web"
      ]
    },
    {
      group: "Chủ đề 3. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      topics: [
        "Bài 4. Tìm kiếm thông tin trên Internet",
        "Bài 5. Thao tác với tệp và thư mục"
      ]
    },
    {
      group: "Chủ đề 4. Đạo đức, pháp luật và văn hoá trong môi trường số",
      topics: [
        "Bài 6. Sử dụng phần mềm khi được phép"
      ]
    },
    {
      group: "Chủ đề 5. Ứng dụng tin học",
      topics: [
        "Bài 7. Tạo bài trình chiếu",
        "Bài 8. Định dạng văn bản trên trang chiếu",
        "Bài 9. Hiệu ứng chuyển trang",
        "Bài 10. Phần mềm soạn thảo văn bản",
        "Bài 11. Chỉnh sửa văn bản",
        "Bài 12A. Thực hành sử dụng công cụ đa phương tiện",
        "Bài 12B. Phần mềm luyện gõ bàn phím"
      ]
    },
    {
      group: "Chủ đề 6. Giải quyết vấn đề với sự trợ giúp của máy tính",
      topics: [
        "Bài 13. Chơi với máy tính",
        "Bài 14. Khám phá môi trường lập trình trực quan",
        "Bài 15. Tạo chương trình máy tính để diễn tả ý tưởng",
        "Bài 16. Chương trình của em"
      ]
    }
  ],
  5: [
    {
      group: "Chủ đề 1. Máy tính và em",
      topics: [
        "Bài 1. Em có thể làm gì với máy tính?"
      ]
    },
    {
      group: "Chủ đề 2. Mạng máy tính và Internet",
      topics: [
        "Bài 2. Tìm kiếm thông tin trên website"
      ]
    },
    {
      group: "Chủ đề 3. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      topics: [
        "Bài 3. Tìm kiếm thông tin trong giải quyết vấn đề",
        "Bài 4. Cây thư mục"
      ]
    },
    {
      group: "Chủ đề 4. Đạo đức, pháp luật và văn hoá trong môi trường số",
      topics: [
        "Bài 5. Bản quyền nội dung thông tin"
      ]
    },
    {
      group: "Chủ đề 5. Ứng dụng tin học",
      topics: [
        "Bài 6. Định dạng kí tự và bố trí hình ảnh trong văn bản",
        "Bài 7. Thực hành soạn thảo văn bản"
      ]
    },
    {
      group: "A. Sử dụng phần mềm đồ hoạ tạo sản phẩm số đơn giản",
      topics: [
        "Bài 8A. Làm quen với phần mềm đồ hoạ",
        "Bài 9A. Sử dụng phần mềm đồ hoạ tạo sản phẩm số"
      ]
    },
    {
      group: "B. Sử dụng công cụ đa phương tiện hỗ trợ tạo sản phẩm đơn giản",
      topics: [
        "Bài 8B. Làm sản phẩm thủ công theo video hướng dẫn",
        "Bài 9B. Thực hành tạo đồ dùng gia đình theo video hướng dẫn"
      ]
    },
    {
      group: "Chủ đề 6. Giải quyết vấn đề với sự trợ giúp của máy tính",
      topics: [
        "Bài 10. Cấu trúc tuần tự",
        "Bài 11. Cấu trúc lặp",
        "Bài 12. Thực hành sử dụng lệnh lặp",
        "Bài 13. Cấu trúc rẽ nhánh",
        "Bài 14. Sử dụng biến trong chương trình",
        "Bài 15. Sử dụng biểu thức trong chương trình",
        "Bài 16. Từ kịch bản đến chương trình"
      ]
    }
  ]
};

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    title: 'Thiết bị nào sau đây dùng để nhập chữ và số vào máy tính?',
    options: ['Màn hình', 'Máy in', 'Bàn phím', 'Loa'],
    correctIndex: 2,
    explanation: 'Bàn phím (Keyboard) là thiết bị chính giúp chúng ta nhập ký tự, số và ký hiệu vào máy tính.',
    difficulty: 'Dễ',
    gradeId: 3,
    category: 'Phần cứng',
    authorId: 'system',
    subjectId: 'subj-3'
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
    authorId: 'system',
    subjectId: 'subj-3'
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
    authorId: 'system',
    subjectId: 'subj-3'
  },
  {
    id: 'q-4',
    title: 'Trên bàn phím có hai phím có gờ nổi làm mốc cho việc đặt ngón tay, đó là phím nào?',
    options: ['Phím A và phím L', 'Phím F và phím J', 'Phím G và phím H', 'Phím S và phím K'],
    correctIndex: 1,
    explanation: 'Phím F và J có gờ nổi nhỏ giúp ngón tay trỏ trái và trỏ phải xác định vị trí xuất phát khi gõ 10 ngón.',
    difficulty: 'Trung bình',
    gradeId: 4,
    category: 'Bàn phím',
    authorId: 'system',
    subjectId: 'subj-4'
  },
  {
    id: 'q-5',
    title: 'Trong phần mềm lập trình Scratch, khối lệnh nào nằm ở nhóm lệnh Motion (Chuyển động) để di chuyển nhân vật?',
    options: ['move 10 steps', 'say Hello for 2 seconds', 'play sound', 'when green flag clicked'],
    correctIndex: 0,
    explanation: 'Khối lệnh "move 10 steps" có màu xanh dương đặc trưng của nhóm lệnh Motion, giúp điều khiển nhân vật di chuyển.',
    difficulty: 'Dễ',
    gradeId: 5,
    category: 'Scratch',
    authorId: 'system',
    subjectId: 'subj-5'
  },
  {
    id: 'q-6',
    title: 'Thao tác nháy đúp chuột (Double click) có nghĩa là gì?',
    options: ['Nhấn nút trái chuột và giữ nguyên', 'Nhấn nhanh nút trái chuột hai lần liên tiếp', 'Nhấn nút phải chuột một lần', 'Nhấn con lăn chuột giữa'],
    correctIndex: 1,
    explanation: 'Nháy đúp chuột là thao tác nhấn nhanh liên tiếp hai lần nút trái chuột, thường để mở ứng dụng hoặc tệp tin.',
    difficulty: 'Dễ',
    gradeId: 3,
    category: 'Sử dụng chuột',
    authorId: 'system',
    subjectId: 'subj-3'
  },
  {
    id: 'q-7',
    title: 'Thầy cô dặn học sinh làm gì khi muốn ra về đúng quy định của phòng máy tính?',
    options: ['Cứ thế rút phích cắm điện nguồn', 'Tắt máy tính bằng lệnh Shutdown, dọn ghế gọn gàng', 'Để nguyên máy tính đang bật và tự do đi ra', 'Tắt màn hình và để thân máy chạy liên tục'],
    correctIndex: 1,
    explanation: 'Theo nội quy phòng máy, học sinh cần lưu bài, tắt máy tính qua hệ điều hành (Shutdown), sắp xếp gọn gàng và tắt thiết bị điện phụ trợ.',
    difficulty: 'Dễ',
    gradeId: 3,
    category: 'Nội quy',
    authorId: 'system',
    subjectId: 'subj-3'
  },
  {
    id: 'q-8',
    title: 'Thư mục (Folder) trong máy tính dùng để làm gì?',
    options: ['Để lưu trữ và phân loại các tệp tin một cách ngăn nắp', 'Để làm sạch bụi bẩn bên trong máy', 'Để kết nối mạng Internet', 'Để vẽ tranh cổ động'],
    correctIndex: 0,
    explanation: 'Thư mục giống như những chiếc ngăn tủ/kệ sách giúp chúng ta gom nhóm và phân loại dữ liệu ngăn nắp.',
    difficulty: 'Trung bình',
    gradeId: 4,
    category: 'Hệ điều hành',
    authorId: 'system',
    subjectId: 'subj-4'
  }
];

export function PersonalQuestionsTab({ currentUser, showToast, selectedGrade = 3 }: PersonalQuestionsTabProps) {
  const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
  const questionsStorageKey = `school_questions_${userId}`;
  const subjectsStorageKey = `school_subjects_${userId}`;

  const [innerTab, setInnerTab] = useState<'manage' | 'bulk-import'>('manage');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const local = localStorage.getItem(subjectsStorageKey);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SUBJECTS;
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return subjects.length > 0 ? subjects[0].id : 'subj-3';
  });

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(() => {
    const local = localStorage.getItem(questionsStorageKey);
    let loaded: Question[] = [];
    if (local) {
      try {
        loaded = JSON.parse(local);
      } catch (e) {
        console.error(e);
        loaded = DEFAULT_QUESTIONS;
      }
    } else {
      loaded = DEFAULT_QUESTIONS;
    }

    // Auto backward compatibility: map subjectId based on grade if missing
    let modified = false;
    const mapped = loaded.map(q => {
      if (!q.subjectId) {
        modified = true;
        if (q.gradeId === 3) return { ...q, subjectId: 'subj-3' };
        if (q.gradeId === 4) return { ...q, subjectId: 'subj-4' };
        if (q.gradeId === 5) return { ...q, subjectId: 'subj-5' };
        return { ...q, subjectId: 'subj-3' };
      }
      return q;
    });

    if (modified && loaded.length > 0) {
      localStorage.setItem(questionsStorageKey, JSON.stringify(mapped));
    }
    return mapped;
  });

  // Local storage writers
  useEffect(() => {
    localStorage.setItem(questionsStorageKey, JSON.stringify(questions));
  }, [questions, questionsStorageKey]);

  useEffect(() => {
    localStorage.setItem(subjectsStorageKey, JSON.stringify(subjects));
  }, [subjects, subjectsStorageKey]);

  // Selected Subject computation
  const selectedSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  // Auto set selected subject when selectedGrade prop changes
  useEffect(() => {
    if (selectedGrade) {
      const match = subjects.find(s => s.gradeId === selectedGrade);
      if (match) {
        setSelectedSubjectId(match.id);
      }
    }
  }, [selectedGrade, subjects]);

  // Scoped Questions under selected subject
  const selectedSubjectQuestions = useMemo(() => {
    if (!selectedSubject) return [];
    return questions.filter(q => q.subjectId === selectedSubject.id);
  }, [questions, selectedSubject]);

  // Filters State
  const [searchText, setSearchText] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó' | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filtered List
  const filteredQuestions = useMemo(() => {
    return selectedSubjectQuestions.filter(q => {
      const matchSearch = q.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          (q.explanation && q.explanation.toLowerCase().includes(searchText.toLowerCase())) ||
                          q.category.toLowerCase().includes(searchText.toLowerCase());
      const matchDiff = filterDifficulty === 'all' ? true : q.difficulty === filterDifficulty;
      const matchCat = filterCategory === 'all' ? true : q.category === filterCategory;
      return matchSearch && matchDiff && matchCat;
    });
  }, [selectedSubjectQuestions, searchText, filterDifficulty, filterCategory]);

  // Categories list derived from current selected subject questions
  const categories = useMemo(() => {
    const set = new Set<string>();
    selectedSubjectQuestions.forEach(q => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [selectedSubjectQuestions]);

  // Subject Modal states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormName, setSubjectFormName] = useState('');
  const [subjectFormGrade, setSubjectFormGrade] = useState<number>(3);

  // Question Modal states
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [formCategory, setFormCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formGradeId, setFormGradeId] = useState<number>(3);
  const [formSubjectId, setFormSubjectId] = useState<string>('');

  // Bulk Import States
  const [bulkText, setBulkText] = useState('');
  const [importSubjectId, setImportSubjectId] = useState<string>(() => selectedSubjectId);
  const [importDifficulty, setImportDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [importCategory, setImportCategory] = useState('Luyện tập tổng hợp');
  const [isCustomImportCategory, setIsCustomImportCategory] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Question[]>([]);

  const importGradeId = useMemo(() => {
    const subj = subjects.find(s => s.id === importSubjectId) || selectedSubject;
    return subj ? subj.gradeId : 3;
  }, [subjects, importSubjectId, selectedSubject]);

  const importGradeTopics = useMemo(() => {
    return PREDEFINED_TOPICS_BY_GRADE[importGradeId] || [];
  }, [importGradeId]);

  useEffect(() => {
    const subj = subjects.find(s => s.id === importSubjectId) || selectedSubject;
    if (subj) {
      const newGrade = subj.gradeId;
      const gradeTopics = PREDEFINED_TOPICS_BY_GRADE[newGrade] || [];
      const defaultCat = (gradeTopics[0] && gradeTopics[0].topics[0]) || '';
      setImportCategory(defaultCat);
      setIsCustomImportCategory(false);
    }
  }, [importSubjectId, subjects, selectedSubject]);

  // Import JSON trigger ref for subjects
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTargetSubjectId, setImportTargetSubjectId] = useState<string | null>(null);

  // Subject Modal handlers
  const openAddSubjectModal = () => {
    setEditingSubject(null);
    setSubjectFormName('');
    setSubjectFormGrade(selectedGrade || 3);
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (subj: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubject(subj);
    setSubjectFormName(subj.name);
    setSubjectFormGrade(subj.gradeId);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormName.trim()) {
      showToast('Tên bộ môn không được để trống', 'error');
      return;
    }

    if (editingSubject) {
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? {
        ...s,
        name: subjectFormName.trim(),
        gradeId: Number(subjectFormGrade)
      } : s));
      setQuestions(prev => prev.map(q => q.subjectId === editingSubject.id ? {
        ...q,
        gradeId: Number(subjectFormGrade)
      } : q));
      showToast('Cập nhật bộ môn thành công!');
    } else {
      const newSubj: Subject = {
        id: `subj-${Date.now()}`,
        name: subjectFormName.trim(),
        gradeId: Number(subjectFormGrade)
      };
      setSubjects(prev => [...prev, newSubj]);
      setSelectedSubjectId(newSubj.id);
      showToast(`Đã thêm bộ môn "${newSubj.name}" thành công!`);
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (subj: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = questions.filter(q => q.subjectId === subj.id).length;
    if (confirm(`Thầy/Cô có chắc chắn muốn xóa bộ môn "${subj.name} - Lớp ${subj.gradeId}"? \nHành động này sẽ XÓA TOÀN BỘ ${count} câu hỏi thuộc bộ môn này!`)) {
      setSubjects(prev => prev.filter(s => s.id !== subj.id));
      setQuestions(prev => prev.filter(q => q.subjectId !== subj.id));
      if (selectedSubjectId === subj.id) {
        const remaining = subjects.filter(s => s.id !== subj.id);
        setSelectedSubjectId(remaining.length > 0 ? remaining[0].id : '');
      }
      showToast(`Đã xóa bộ môn "${subj.name}" cùng các câu hỏi liên quan.`);
    }
  };

  // Question Modal handlers
  const openAddQuestionModal = () => {
    if (!selectedSubject) {
      showToast('Vui lòng tạo hoặc chọn một bộ môn trước!', 'error');
      return;
    }
    setEditingQuestion(null);
    setFormTitle('');
    setFormOptions(['', '', '', '']);
    setFormCorrectIndex(0);
    setFormExplanation('');
    setFormDifficulty('Dễ');
    setFormSubjectId(selectedSubject.id);
    
    const currentGrade = selectedSubject.gradeId || 3;
    setFormGradeId(currentGrade);
    
    // Default to the first topic in predefined topics list for this grade
    const gradeTopics = PREDEFINED_TOPICS_BY_GRADE[currentGrade] || [];
    const defaultCat = (gradeTopics[0] && gradeTopics[0].topics[0]) || '';
    setFormCategory(defaultCat);
    setIsCustomCategory(false);
    
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setFormTitle(q.title);
    setFormOptions([...q.options]);
    setFormCorrectIndex(q.correctIndex);
    setFormExplanation(q.explanation || '');
    setFormDifficulty(q.difficulty);
    setFormCategory(q.category);
    setFormSubjectId(q.subjectId || selectedSubjectId || '');
    
    const currentGrade = q.gradeId || 3;
    setFormGradeId(currentGrade);
    
    const gradeTopics = PREDEFINED_TOPICS_BY_GRADE[currentGrade] || [];
    const isPredefined = gradeTopics.flatMap(g => g.topics).includes(q.category);
    setIsCustomCategory(!isPredefined);
    
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    if (!formTitle.trim()) {
      showToast('Nội dung câu hỏi không được để trống', 'error');
      return;
    }
    if (formOptions.some(opt => !opt.trim())) {
      showToast('Vui lòng điền đầy đủ cả 4 lựa chọn đáp án', 'error');
      return;
    }
    if (!formCategory.trim()) {
      showToast('Chủ đề của câu hỏi không được để trống', 'error');
      return;
    }

    // Find corresponding subject for the selected formSubjectId or formGradeId
    let targetSubject = subjects.find(s => s.id === formSubjectId);
    if (!targetSubject) {
      targetSubject = subjects.find(s => s.gradeId === formGradeId) || selectedSubject;
    }

    if (editingQuestion) {
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? {
        ...q,
        title: formTitle.trim(),
        options: formOptions.map(o => o.trim()),
        correctIndex: formCorrectIndex,
        explanation: formExplanation.trim() || undefined,
        difficulty: formDifficulty,
        gradeId: formGradeId,
        category: formCategory.trim(),
        subjectId: targetSubject ? targetSubject.id : q.subjectId
      } : q));
      showToast('Cập nhật câu hỏi thành công!');
    } else {
      const newQ: Question = {
        id: `q-${Date.now()}`,
        title: formTitle.trim(),
        options: formOptions.map(o => o.trim()),
        correctIndex: formCorrectIndex,
        explanation: formExplanation.trim() || undefined,
        difficulty: formDifficulty,
        gradeId: formGradeId,
        category: formCategory.trim(),
        authorId: userId,
        subjectId: targetSubject ? targetSubject.id : selectedSubject.id
      };
      setQuestions(prev => [newQ, ...prev]);
      showToast('Thêm câu hỏi mới thành công!');
    }
    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Thầy cô có chắc chắn muốn xóa câu hỏi này không?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast('Đã xóa câu hỏi khỏi kho lưu trữ.');
    }
  };

  // Export & Import functions for Subject Cards
  const handleExportJSONForSubject = (subj: Subject) => {
    const subjQuestions = questions.filter(q => q.subjectId === subj.id);
    if (subjQuestions.length === 0) {
      showToast('Bộ môn này chưa có câu hỏi nào để xuất!', 'error');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(subjQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cau_hoi_${subj.name.replace(/\s+/g, '_')}_lop_${subj.gradeId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Đã xuất ${subjQuestions.length} câu hỏi của bộ môn "${subj.name}" thành công!`);
  };

  const handleImportJSONForSubject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const targetSubjId = importTargetSubjectId;
    if (!files || files.length === 0 || !targetSubjId) return;

    const targetSubj = subjects.find(s => s.id === targetSubjId);
    if (!targetSubj) return;

    const fileReader = new FileReader();
    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const valid = parsed.every(q => q.title && Array.isArray(q.options));
          if (valid) {
            setQuestions(prev => {
              const importedList = parsed.map((item, idx) => ({
                ...item,
                id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
                subjectId: targetSubj.id,
                gradeId: targetSubj.gradeId,
                category: item.category || 'Luyện tập',
                difficulty: item.difficulty || 'Dễ',
                authorId: userId
              }));
              return [...importedList, ...prev];
            });
            showToast(`Đã nạp ${parsed.length} câu hỏi vào môn "${targetSubj.name} - Lớp ${targetSubj.gradeId}" thành công!`);
          } else {
            showToast('Cấu trúc file câu hỏi không hợp lệ.', 'error');
          }
        } else {
          showToast('Tệp không đúng định dạng mảng JSON câu hỏi.', 'error');
        }
      } catch (err) {
        showToast('Không thể đọc file JSON. Vui lòng kiểm tra kỹ.', 'error');
      }
      e.target.value = ''; // Reset input
    };
  };

  const handleShareSubject = (subj: Subject) => {
    const mockShareUrl = `${window.location.origin}/share/subject?id=${subj.id}&name=${encodeURIComponent(subj.name)}&grade=${subj.gradeId}`;
    navigator.clipboard.writeText(mockShareUrl);
    showToast(`🔗 Đã sao chép liên kết chia sẻ bộ môn "${subj.name} - Lớp ${subj.gradeId}" vào khay nhớ tạm!`, 'success');
  };

  const handleResetDefaults = () => {
    if (confirm('Thầy cô muốn khôi phục lại kho câu hỏi mẫu mặc định? Toàn bộ môn học và câu hỏi tùy chỉnh sẽ bị ghi đè.')) {
      const resetQuestions = DEFAULT_QUESTIONS.map(q => {
        if (q.gradeId === 3) return { ...q, subjectId: 'subj-3' };
        if (q.gradeId === 4) return { ...q, subjectId: 'subj-4' };
        if (q.gradeId === 5) return { ...q, subjectId: 'subj-5' };
        return { ...q, subjectId: 'subj-3' };
      });
      setSubjects(DEFAULT_SUBJECTS);
      setQuestions(resetQuestions);
      setSelectedSubjectId('subj-3');
      showToast('Đã phục hồi danh sách câu hỏi mẫu và bộ môn mặc định.');
    }
  };

  // --- AIKEN / TEXT BULK PARSER ---
  const handleParseText = (text: string) => {
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }
    const lines = text.split('\n');
    const parsed: (Question & { optionLineIndices?: number[]; answerLineIndex?: number })[] = [];
    
    let currentTitle = '';
    let currentOptions: string[] = [];
    let currentOptionLineIndices: number[] = [];
    let currentCorrectIndex = -1;
    let currentExplanation = '';
    let currentAnswerLineIndex = -1;
    
    const saveCurrent = () => {
      const cleanTitle = currentTitle.trim().replace(/^Câu\s+\d+[:.]\s*/i, '').trim();
      if (cleanTitle && currentOptions.length >= 2) {
        const finalOptions = [...currentOptions];
        while (finalOptions.length < 4) {
          finalOptions.push(`Đáp án ${String.fromCharCode(65 + finalOptions.length)}`);
        }
        
        const destSubject = subjects.find(s => s.id === importSubjectId) || selectedSubject;
        parsed.push({
          id: `bulk-${Date.now()}-${parsed.length}-${Math.random().toString(36).substring(2, 5)}`,
          title: cleanTitle,
          options: finalOptions.slice(0, 4),
          correctIndex: currentCorrectIndex === -1 ? 0 : currentCorrectIndex,
          explanation: currentExplanation.trim() || undefined,
          difficulty: importDifficulty,
          gradeId: destSubject ? destSubject.gradeId : 3,
          category: importCategory.trim() || 'Luyện tập tổng hợp',
          authorId: userId,
          subjectId: destSubject ? destSubject.id : 'subj-3',
          optionLineIndices: [...currentOptionLineIndices],
          answerLineIndex: currentAnswerLineIndex !== -1 ? currentAnswerLineIndex : undefined
        });
      }
      currentTitle = '';
      currentOptions = [];
      currentOptionLineIndices = [];
      currentCorrectIndex = -1;
      currentExplanation = '';
      currentAnswerLineIndex = -1;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const optionMatch = line.match(/^(\*?)\s*([A-D])\s*([\.\/\)])\s*(\*?)\s*(.*)$/i);
      if (optionMatch) {
        const isLeadingStar = optionMatch[1] === '*';
        const isMiddleStar = optionMatch[4] === '*';
        const letter = optionMatch[2].toUpperCase();
        const oIdx = letter.charCodeAt(0) - 65;

        currentOptions.push(optionMatch[5].trim());
        currentOptionLineIndices.push(i);

        if (isLeadingStar || isMiddleStar) {
          currentCorrectIndex = oIdx;
        }
        continue;
      }

      const answerMatch = line.match(/^(Đáp\s+án|Đáp\s+án\s+đúng|ANSWER|Key|Chọn)[:\s\-]+([A-D])/i);
      if (answerMatch) {
        const letter = answerMatch[2].toUpperCase();
        currentCorrectIndex = letter.charCodeAt(0) - 65;
        currentAnswerLineIndex = i;
        continue;
      }

      const explanationMatch = line.match(/^(Giải\s+thích|Gợi\s+ý)[:\s]+(.*)$/i);
      if (explanationMatch) {
        currentExplanation = explanationMatch[2].trim();
        continue;
      }

      if (line.match(/^Câu\s+\d+[:.]/i)) {
        saveCurrent();
        currentTitle = line;
      } else {
        if (currentOptions.length > 0) {
          saveCurrent();
          currentTitle = line;
        } else {
          currentTitle = currentTitle ? currentTitle + ' ' + line : line;
        }
      }
    }
    saveCurrent();
    setParsedPreview(parsed);
  };

  const handleSelectCorrectOptionInPreview = (qIdx: number, optIdx: number) => {
    const lines = bulkText.split('\n');
    const q = parsedPreview[qIdx] as (Question & { optionLineIndices?: number[]; answerLineIndex?: number });
    if (!q) return;

    // Update in-memory correct index first for immediate feedback
    const updatedPreview = [...parsedPreview];
    updatedPreview[qIdx] = {
      ...q,
      correctIndex: optIdx
    };
    setParsedPreview(updatedPreview);

    // Synchronize to the bulkText options
    if (q.optionLineIndices && q.optionLineIndices.length > 0) {
      q.optionLineIndices.forEach((lineIndex, oIdx) => {
        const line = lines[lineIndex];
        const m = line.match(/^(\*?)\s*([A-D])\s*([\.\/\)])\s*(\*?)\s*(.*)$/i);
        if (m) {
          const letter = m[2];
          const delim = m[3];
          const content = m[5];
          if (oIdx === optIdx) {
            lines[lineIndex] = `*${letter}${delim} ${content}`;
          } else {
            lines[lineIndex] = `${letter}${delim} ${content}`;
          }
        }
      });
    }

    // Synchronize to the bulkText answer line if present
    if (q.answerLineIndex !== undefined && q.answerLineIndex !== -1) {
      const lineIndex = q.answerLineIndex;
      const line = lines[lineIndex];
      const m = line.match(/^(Đáp\s+án|Đáp\s+án\s+đúng|ANSWER|Key|Chọn)([:\s\-]+)([A-D])/i);
      if (m) {
        const prefix = m[1];
        const separator = m[2];
        const newLetter = String.fromCharCode(65 + optIdx);
        lines[lineIndex] = `${prefix}${separator}${newLetter}`;
      }
    }

    const newBulkText = lines.join('\n');
    setBulkText(newBulkText);
  };

  useEffect(() => {
    handleParseText(bulkText);
  }, [bulkText, importSubjectId, importDifficulty, importCategory]);

  const handleApplyBulkImport = () => {
    if (parsedPreview.length === 0) {
      showToast('Không tìm thấy câu hỏi hợp lệ nào để nạp.', 'error');
      return;
    }
    setQuestions(prev => [...parsedPreview, ...prev]);
    setBulkText('');
    setParsedPreview([]);
    setInnerTab('manage');
    showToast(`Đã nạp thành công ${parsedPreview.length} câu hỏi mới vào môn học!`, 'success');
  };

  const handleFillSampleBulk = () => {
    const sample = `Câu 1: Thiết bị nào dưới đây là "bộ não" điều khiển mọi hoạt động của máy tính?
A. Chuột máy tính
B. Thân máy (CPU)
C. Màn hình
D. Máy in
Đáp án: B
Giải thích: Bộ vi xử lý (CPU) bên trong thân máy được ví là bộ não của máy tính.

Câu 2: Hệ điều hành Windows là gì?
A. Là một phần cứng máy tính
B. Là phần mềm hệ thống giúp quản lý và điều hành toàn bộ máy tính
C. Là một trò chơi giải trí
D. Là thiết bị xuất dữ liệu
Đáp án: B
Giải thích: Hệ điều hành là phần mềm nền tảng vô cùng quan trọng trên máy tính.

Câu 3: Đâu là phím dùng để xóa ký tự phía bên TRÁI con trỏ soạn thảo?
A. Phím Delete
B. Phím Enter
C. Phím Backspace
D. Phím Spacebar
Đáp án: C
Giải thích: Phím Backspace xóa ký tự trước (bên trái) con trỏ, còn Delete xóa ký tự sau (bên phải) con trỏ.`;
    setBulkText(sample);
    showToast('Đã điền mẫu soạn thảo! Thầy cô có thể sửa trực tiếp.');
  };

  return (
    <div className="space-y-6 text-left">
      <input 
        type="file" 
        ref={fileInputRef}
        accept=".json" 
        onChange={handleImportJSONForSubject} 
        className="hidden" 
      />

      {/* Dynamic Header Banner */}
      <div className="bg-gradient-to-r from-teal-500/15 via-indigo-500/5 to-transparent p-6 rounded-3xl border border-teal-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Tài nguyên số</span>
            <span className="text-slate-400 font-semibold">•</span>
            <span className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
              <BookOpen className="w-3.5 h-3.5" />
              Sở hữu: Thầy {currentUser?.name || 'Giáo viên'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Kho Câu Hỏi Cá Nhân
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý ngân hàng câu hỏi tin học tương tác. Dữ liệu câu hỏi ở đây sẽ tự động cung cấp làm bộ đề cho các Trò chơi tương tác (Lucky Wheel, Tug of War...).
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-150 transition-all bg-white flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
          title="Khôi phục câu hỏi mẫu mặc định của hệ thống"
        >
          <RotateCcw className="w-4 h-4" />
          Khôi phục gốc
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setInnerTab('manage')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            innerTab === 'manage'
              ? 'border-orange-500 text-orange-600 bg-orange-50/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <List className="w-4 h-4" />
          Ngân hàng câu hỏi bộ môn ({questions.length})
        </button>
        <button
          type="button"
          onClick={() => setInnerTab('bulk-import')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            innerTab === 'bulk-import'
              ? 'border-orange-500 text-orange-600 bg-orange-50/10'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-orange-500" />
          Nhập nhanh câu hỏi (Từ Word / Excel / Text)
          <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">Hot</span>
        </button>
      </div>

      {/* Tab Switchboard */}
      {innerTab === 'manage' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: SUBJECTS LIST */}
          <div className="lg:col-span-4 bg-slate-50/50 p-5 rounded-3xl border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-1.5">
                📖 Danh sách bộ môn
              </h3>
              <button
                type="button"
                onClick={openAddSubjectModal}
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm môn
              </button>
            </div>

            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {subjects.map((subj) => {
                const count = questions.filter(q => q.subjectId === subj.id).length;
                const isSelected = selectedSubjectId === subj.id;

                return (
                  <div
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`p-4 rounded-2.5xl bg-white border cursor-pointer transition-all duration-200 shadow-sm relative flex flex-col justify-between space-y-3 hover:shadow-md ${
                      isSelected 
                        ? 'border-orange-500 ring-1 ring-orange-400' 
                        : 'border-slate-200/85'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-left space-y-1 flex-1 min-w-0 pr-4">
                        <h4 className="text-slate-800 text-sm font-black tracking-tight leading-snug truncate">
                          {subj.name}
                        </h4>
                        <span className="inline-block bg-orange-50 text-orange-600 font-extrabold px-2.5 py-0.5 rounded-lg text-[10px]">
                          Lớp {subj.gradeId}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => openEditSubjectModal(subj, e)}
                          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Sửa môn học"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSubject(subj, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa môn học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-550 font-bold gap-2">
                      <span className="shrink-0 text-left">Câu hỏi: <strong className="text-slate-700 font-black">{count} câu</strong></span>
                      
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportJSONForSubject(subj);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-black flex items-center gap-0.5"
                        >
                          <Download className="w-2.5 h-2.5" />
                          JSON
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImportTargetSubjectId(subj.id);
                            setTimeout(() => fileInputRef.current?.click(), 50);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-black flex items-center gap-0.5"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          Import
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareSubject(subj);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-black flex items-center gap-0.5"
                        >
                          <Share2 className="w-2.5 h-2.5" />
                          Chia sẻ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <p className="text-slate-450 text-xs py-8 text-center font-bold">Chưa có môn học nào</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED SUBJECT VIEW */}
          <div className="lg:col-span-8 space-y-4">
            {selectedSubject ? (
              <>
                {/* Header widget */}
                <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-left space-y-1">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      📝 Môn: {selectedSubject.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Lớp {selectedSubject.gradeId} • Tổng số {selectedSubjectQuestions.length} câu hỏi trắc nghiệm
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={openAddQuestionModal}
                    className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm câu hỏi
                  </button>
                </div>

                {/* Question Area Container */}
                {selectedSubjectQuestions.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200/90 rounded-3xl bg-white py-16 px-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
                    <div className="p-4 bg-orange-50 rounded-full text-orange-500">
                      <ClipboardList className="w-10 h-10" />
                    </div>
                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                      Chưa có câu hỏi nào trong môn này
                    </h4>
                    <p className="text-xs text-slate-450 font-semibold max-w-md leading-relaxed">
                      Thầy/Cô vui lòng soạn câu hỏi bằng tay hoặc bấm nút "Import JSON" ở cột bên trái để nạp câu hỏi nhanh nhé ạ!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Inner filter bar */}
                    <div className="bg-white p-4 rounded-2.5xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1">
                        <div className="md:col-span-6 relative">
                          <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Tìm kiếm câu hỏi, gợi ý..."
                            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl pl-8 pr-3.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                        
                        <div className="md:col-span-3">
                          <select
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                          >
                            <option value="all">Mức độ (Tất cả)</option>
                            <option value="Dễ">🟢 Dễ</option>
                            <option value="Trung bình">🟡 T.Bình</option>
                            <option value="Khó">🔴 Khó</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-3">
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                          >
                            <option value="all">Chủ đề ({categories.length})</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'table'
                              ? 'bg-white text-orange-600 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Table className="w-3.5 h-3.5" />
                          Bảng
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('card')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'card'
                              ? 'bg-white text-orange-600 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Grid className="w-3.5 h-3.5" />
                          Thẻ
                        </button>
                      </div>
                    </div>

                    {/* View results */}
                    {viewMode === 'table' ? (
                      <div className="bg-white rounded-2.5xl border border-slate-150 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse table-auto min-w-[800px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 text-[10px] font-black uppercase tracking-wider">
                                <th className="py-3 px-4 text-center w-12">STT</th>
                                <th className="py-3 px-4 w-32">Chủ đề</th>
                                <th className="py-3 px-4">Nội dung câu hỏi & Các đáp án</th>
                                <th className="py-3 px-4 text-center w-24">Mức độ</th>
                                <th className="py-3 px-4 text-center w-24">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredQuestions.map((q, idx) => {
                                const diffColor = q.difficulty === 'Dễ' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : q.difficulty === 'Trung bình'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200';

                                return (
                                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-3 text-center text-xs font-black text-slate-400">
                                      {idx + 1}
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50 block truncate max-w-[120px]" title={q.category}>
                                        {q.category}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 space-y-2">
                                      <div className="text-xs font-black text-slate-800 leading-relaxed text-left">
                                        {q.title}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-left">
                                        {q.options.map((option, oIdx) => {
                                          const isCorrect = oIdx === q.correctIndex;
                                          return (
                                            <div 
                                              key={oIdx}
                                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 ${
                                                isCorrect 
                                                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800 font-black' 
                                                  : 'bg-slate-50/50 border-slate-150 text-slate-500'
                                              }`}
                                            >
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                                isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                              }`}>
                                                {String.fromCharCode(65 + oIdx)}
                                              </span>
                                              <span className="truncate flex-1">{option}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${diffColor}`}>
                                        {q.difficulty}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openEditQuestionModal(q)}
                                          className="p-1.5 text-teal-600 hover:text-white hover:bg-teal-600 rounded-lg border border-teal-100 hover:border-teal-600 transition cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteQuestion(q.id)}
                                          className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-100 hover:border-rose-600 transition cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredQuestions.map((q, idx) => {
                          const diffBadgeColor = q.difficulty === 'Dễ' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                            : q.difficulty === 'Trung bình'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                            : 'bg-rose-50 text-rose-700 border-rose-200/50';

                          return (
                            <div 
                              key={q.id}
                              className="bg-white p-5 rounded-2.5xl shadow-sm border border-slate-150 hover:border-orange-300 hover:shadow transition-all duration-200 flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${diffBadgeColor}`}>
                                      {q.difficulty}
                                    </span>
                                    <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg border border-slate-200/40">
                                      📂 {q.category}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditQuestionModal(q)}
                                      className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <h4 className="text-[12.5px] font-black text-slate-800 leading-snug flex gap-1">
                                    <span className="text-orange-500 font-bold">Câu {idx + 1}:</span>
                                    {q.title}
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-1.5">
                                  {q.options.map((option, oIdx) => {
                                    const isCorrect = oIdx === q.correctIndex;
                                    return (
                                      <div 
                                        key={oIdx}
                                        className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                                          isCorrect 
                                            ? 'bg-emerald-50/45 border-emerald-300 text-emerald-800 font-bold' 
                                            : 'bg-slate-50/50 border-slate-200 text-slate-600'
                                        }`}
                                      >
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                          {String.fromCharCode(65 + oIdx)}
                                        </span>
                                        <span className="truncate flex-1 text-left">{option}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {q.explanation && (
                                <div className="bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/40 text-[10px] text-slate-500 font-medium italic flex items-start gap-1">
                                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <p className="leading-relaxed text-left">
                                    <strong>Giải thích:</strong> {q.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
                <p className="text-3xl">👈</p>
                <p className="text-xs font-black uppercase text-slate-500 mt-2">Vui lòng chọn môn học hoặc thêm mới ở cột bên trái</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BULK IMPORT LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-orange-500" />
                  Hộp Soạn Thảo / Dán Câu Hỏi
                </h3>
                <button
                  type="button"
                  onClick={handleFillSampleBulk}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Điền câu hỏi mẫu
                </button>
              </div>

              {/* Configurations bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Môn nạp vào *</label>
                  <select
                    value={importSubjectId}
                    onChange={(e) => setImportSubjectId(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-orange-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - Lớp {s.gradeId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Độ Khó Đồng Loạt</label>
                  <select
                    value={importDifficulty}
                    onChange={(e) => setImportDifficulty(e.target.value as any)}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Dễ">🟢 Dễ</option>
                    <option value="Trung bình">🟡 Trung bình</option>
                    <option value="Khó">🔴 Khó</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Gán Chủ Đề (Chung)</label>
                  <select
                    value={
                      (PREDEFINED_TOPICS_BY_GRADE[importGradeId] || [])
                        .flatMap(g => g.topics)
                        .includes(importCategory) && !isCustomImportCategory
                        ? importCategory
                        : "custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomImportCategory(true);
                        setImportCategory("");
                      } else {
                        setIsCustomImportCategory(false);
                        setImportCategory(val);
                      }
                    }}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {(PREDEFINED_TOPICS_BY_GRADE[importGradeId] || []).map((group, gIdx) => (
                      <optgroup key={gIdx} label={group.group}>
                        {group.topics.map((topic, tIdx) => (
                          <option key={tIdx} value={topic}>{topic}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="custom">✏️ Nhập chủ đề tùy chỉnh...</option>
                  </select>

                  {(isCustomImportCategory || !(PREDEFINED_TOPICS_BY_GRADE[importGradeId] || []).flatMap(g => g.topics).includes(importCategory)) && (
                    <input
                      type="text"
                      required
                      value={importCategory}
                      onChange={(e) => setImportCategory(e.target.value)}
                      placeholder="Ví dụ: Lập trình Scratch, Vẽ Paint..."
                      className="w-full mt-1.5 bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-orange-500"
                    />
                  )}
                </div>
              </div>

              {/* Main text area */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-550 font-black uppercase tracking-wider block">Nội dung đề (Hỗ trợ định dạng Aiken & Trắc nghiệm) *</label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Dán câu hỏi của thầy cô từ file Word hoặc Excel tại đây..."
                  rows={14}
                  className="w-full bg-slate-50/50 border border-slate-250 rounded-2xl px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all shadow-inner leading-relaxed"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-slate-500 font-semibold">
                  Đã bóc tách thành công: <strong className="text-orange-600 font-bold">{parsedPreview.length}</strong> câu hỏi.
                </div>
                <button
                  type="button"
                  onClick={handleApplyBulkImport}
                  disabled={parsedPreview.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    parsedPreview.length > 0
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Nạp ngay {parsedPreview.length} câu hỏi vào môn học
                </button>
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-slate-50 p-4.5 rounded-2.5xl border border-slate-200 text-xs text-slate-650 space-y-3">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Hướng dẫn viết câu hỏi định dạng mẫu chuẩn
              </h4>
              <p className="leading-relaxed font-medium">
                Hệ thống hỗ trợ bóc tách định dạng Aiken tiêu chuẩn (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">Đáp án: B</code>) hoặc thêm trực tiếp ký tự <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-mono font-bold">*</code> vào trước đáp án đúng (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-mono font-bold">*B. Thân máy</code>). 
              </p>
              <p className="leading-relaxed font-medium text-indigo-650 font-bold">
                💡 Thầy cô có thể click trực tiếp vào đáp án trong "Bảng xem trước câu hỏi" bên phải để đồng bộ đáp án đúng tự động!
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[10px] leading-relaxed text-slate-600 whitespace-pre-wrap select-all">
{`Câu 1: Thiết bị nào dưới đây là "bộ não" của máy tính?
A. Chuột máy tính
*B. Thân máy (CPU)
C. Màn hình
D. Máy in
Giải thích: Bộ vi xử lý (CPU) điều khiển mọi hoạt động của máy tính.`}
              </div>
            </div>
          </div>

          {/* RIGHT LIVE PREVIEW */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-indigo-500/10 to-orange-500/5 p-4.5 rounded-3xl border border-indigo-100 shadow-xs space-y-3.5">
              <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Bảng xem trước câu hỏi ({parsedPreview.length})
              </h3>
              
              {parsedPreview.length === 0 ? (
                <div className="py-20 bg-white/70 border border-dashed border-slate-200 rounded-2.5xl text-center text-slate-400 space-y-2">
                  <p className="text-2xl">📝📋</p>
                  <p className="text-[11px] font-semibold text-slate-500">Chưa có dữ liệu phân tích</p>
                  <p className="text-[10px] text-slate-450 max-w-[200px] mx-auto font-medium">Nhập câu hỏi ở bảng bên trái để xem kết xuất tức thời!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {parsedPreview.map((q, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[9px] bg-teal-50 text-teal-800 font-black px-2 py-0.5 rounded-md">
                          Câu hỏi {idx + 1}
                        </span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded-md">
                          {q.difficulty}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {q.title}
                      </h4>

                      <div className="space-y-1.5">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.correctIndex;
                          return (
                            <button
                              type="button"
                              key={oIdx}
                              onClick={() => handleSelectCorrectOptionInPreview(idx, oIdx)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                                isCorrect 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold shadow-2xs'
                                  : 'bg-slate-50 border-slate-150 text-slate-500 hover:bg-indigo-50/40 hover:border-indigo-200 hover:text-slate-700'
                              }`}
                              title="Click để chọn làm đáp án đúng"
                            >
                              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 transition-colors ${
                                isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate flex-1 text-left">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBJECT ADD/EDIT DIALOG POPUP */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-orange-200 animate-pulse" />
                {editingSubject ? 'Sửa thông tin bộ môn' : 'Thêm bộ môn mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="bg-black/10 hover:bg-black/25 text-white rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Tên bộ môn *</label>
                <input
                  type="text"
                  required
                  value={subjectFormName}
                  onChange={(e) => setSubjectFormName(e.target.value)}
                  placeholder="Ví dụ: Tin học, Công nghệ, Toán học..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Khối lớp *</label>
                <select
                  value={subjectFormGrade}
                  onChange={(e) => setSubjectFormGrade(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                >
                  <option value={3}>Học sinh Khối 3</option>
                  <option value={4}>Học sinh Khối 4</option>
                  <option value={5}>Học sinh Khối 5</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  {editingSubject ? 'Cập nhật' : 'Thêm môn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION ADD/EDIT DIALOG POPUP */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-teal-200" />
                  {editingQuestion ? 'Cập nhật Câu Hỏi Khảo Sát' : 'Tạo Mới Câu Hỏi Trắc Nghiệm'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="bg-black/10 hover:bg-black/25 text-white rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Nội dung câu hỏi *</label>
                <textarea
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Để lưu văn bản Microsoft Word, em nhấn phím tắt nào dưới đây?"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Các lựa chọn đáp án (Bắt buộc cả 4) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">Lựa chọn {oIdx + 1}</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[oIdx] = e.target.value;
                          setFormOptions(updated);
                        }}
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                        className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Bộ môn *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => {
                      const subjId = e.target.value;
                      setFormSubjectId(subjId);
                      const subj = subjects.find(s => s.id === subjId);
                      if (subj) {
                        const newGrade = subj.gradeId;
                        setFormGradeId(newGrade);
                        // Auto update category to first topic in the new grade
                        const gradeTopics = PREDEFINED_TOPICS_BY_GRADE[newGrade] || [];
                        const defaultCat = (gradeTopics[0] && gradeTopics[0].topics[0]) || '';
                        setFormCategory(defaultCat);
                        setIsCustomCategory(false);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>📚 {s.name} - Lớp {s.gradeId}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Khối lớp *</label>
                  <select
                    value={formGradeId}
                    onChange={(e) => {
                      const newGrade = Number(e.target.value);
                      setFormGradeId(newGrade);
                      // Auto select first subject of this new grade if exists
                      const firstSubj = subjects.find(s => s.gradeId === newGrade);
                      if (firstSubj) {
                        setFormSubjectId(firstSubj.id);
                      }
                      // Auto update category to first topic in the new grade
                      const gradeTopics = PREDEFINED_TOPICS_BY_GRADE[newGrade] || [];
                      const defaultCat = (gradeTopics[0] && gradeTopics[0].topics[0]) || '';
                      setFormCategory(defaultCat);
                      setIsCustomCategory(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>🏫 Khối 1</option>
                    <option value={2}>🏫 Khối 2</option>
                    <option value={3}>🏫 Khối 3</option>
                    <option value={4}>🏫 Khối 4</option>
                    <option value={5}>🏫 Khối 5</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Đáp án chính xác *</label>
                  <select
                    value={formCorrectIndex}
                    onChange={(e) => setFormCorrectIndex(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>🔴 Lựa chọn A</option>
                    <option value={1}>🟢 Lựa chọn B</option>
                    <option value={2}>🔵 Lựa chọn C</option>
                    <option value={3}>🟡 Lựa chọn D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Mức độ khó *</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Dễ">🟢 Dễ</option>
                    <option value="Trung bình">🟡 Trung bình</option>
                    <option value="Khó">🔴 Khó</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Chủ đề phân nhóm *</label>
                <div className="space-y-2">
                  <select
                    value={
                      (PREDEFINED_TOPICS_BY_GRADE[formGradeId] || [])
                        .flatMap(g => g.topics)
                        .includes(formCategory) && !isCustomCategory
                        ? formCategory
                        : "custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomCategory(true);
                        setFormCategory("");
                      } else {
                        setIsCustomCategory(false);
                        setFormCategory(val);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    <option value="">-- Chọn chủ đề phân nhóm --</option>
                    {(PREDEFINED_TOPICS_BY_GRADE[formGradeId] || []).map((group, gIdx) => (
                      <optgroup key={gIdx} label={group.group}>
                        {group.topics.map((topic, tIdx) => (
                          <option key={tIdx} value={topic}>{topic}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="custom">✏️ Nhập chủ đề tùy chỉnh khác...</option>
                  </select>

                  {(isCustomCategory || !(PREDEFINED_TOPICS_BY_GRADE[formGradeId] || []).flatMap(g => g.topics).includes(formCategory)) && (
                    <input
                      type="text"
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Ví dụ: Lập trình Scratch, Vẽ Paint, Sử dụng phím..."
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Giải thích lý do / Gợi ý bổ sung (Tùy chọn)</label>
                <textarea
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Giải thích tại sao đáp án này đúng để giúp học sinh sửa sai tốt hơn..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                {editingQuestion ? 'Cập nhật ngay' : 'Tạo câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
