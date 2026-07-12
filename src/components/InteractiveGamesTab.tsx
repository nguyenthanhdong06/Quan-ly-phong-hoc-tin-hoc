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
  Sparkle,
  Plus,
  Trash2,
  Edit,
  Clipboard,
  Image,
  Music4,
  FolderOpen,
  Save,
  BookOpen
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

const TOPICS_MAP: Record<number, Record<string, { group: string; topics: string[] }[]>> = {
  1: {
    'Toán': [
      {
        group: 'Chủ đề 1: Các số đến 10',
        topics: [
          'Bài 1: Các số 1, 2, 3',
          'Bài 2: Các số 4, 5, 6',
          'Bài 3: Các số 7, 8, 9, 10',
          'Bài 4: Lớn hơn, bé hơn, bằng nhau'
        ]
      },
      {
        group: 'Chủ đề 2: Phép cộng và phép trừ trong phạm vi 10',
        topics: [
          'Bài 5: Phép cộng trong phạm vi 10',
          'Bài 6: Phép trừ trong phạm vi 10'
        ]
      },
      {
        group: 'Chủ đề 3: Hình học phẳng',
        topics: [
          'Bài 7: Hình tròn, hình tam giác, hình vuông, hình chữ nhật'
        ]
      }
    ],
    'Tin học': [
      {
        group: 'Chủ đề 1: Làm quen với máy tính',
        topics: [
          'Bài 1: Bộ phận của máy tính',
          'Bài 2: Tư thế ngồi học máy tính đúng'
        ]
      },
      {
        group: 'Chủ đề 2: Sử dụng chuột máy tính',
        topics: [
          'Bài 3: Làm quen chuột máy tính và các thao tác cơ bản',
          'Bài 4: Thực hành sử dụng chuột máy tính'
        ]
      },
      {
        group: 'Chủ đề 3: Vừa chơi vừa học cùng máy tính',
        topics: [
          'Bài 5: Bé tập vẽ hình cơ bản với Paint',
          'Bài 6: Trò chơi trí tuệ giúp rèn luyện tư duy'
        ]
      }
    ],
    'Tiếng Việt': [
      {
        group: 'Chủ đề 1: Âm chữ và vần',
        topics: [
          'Bài 1: Làm quen với âm và chữ cái',
          'Bài 2: Tập ghép vần đơn giản'
        ]
      }
    ]
  },
  2: {
    'Toán': [
      {
        group: 'Chủ đề 1: Các số trong phạm vi 1000',
        topics: [
          'Bài 1: Đọc, viết các số có ba chữ số',
          'Bài 2: So sánh các số có ba chữ số'
        ]
      },
      {
        group: 'Chủ đề 2: Phép cộng và phép trừ trong phạm vi 1000',
        topics: [
          'Bài 3: Phép cộng có nhớ trong phạm vi 100',
          'Bài 4: Phép trừ có nhớ trong phạm vi 100'
        ]
      }
    ],
    'Tin học': [
      {
        group: 'Chủ đề 1: Máy tính xung quanh em',
        topics: [
          'Bài 1: Các loại máy tính và vai trò của chúng',
          'Bài 2: Khởi động và tắt máy tính đúng cách'
        ]
      },
      {
        group: 'Chủ đề 2: Làm quen với bàn phím',
        topics: [
          'Bài 3: Các hàng phím chính trên bàn phím',
          'Bài 4: Thực hành đặt tay trên bàn phím'
        ]
      },
      {
        group: 'Chủ đề 3: Sáng tạo kỹ thuật số',
        topics: [
          'Bài 5: Tập tô màu và vẽ tranh với các công cụ nâng cao',
          'Bài 6: Sử dụng trò chơi giáo dục ôn luyện kiến thức'
        ]
      }
    ]
  },
  3: {
    'Toán': [
      {
        group: 'Chủ đề 1: Phép nhân và phép chia trong phạm vi 1000',
        topics: [
          'Bài 1: Bảng nhân 3, bảng chia 3',
          'Bài 2: Bảng nhân 4, bảng chia 4',
          'Bài 3: Bảng nhân 6, bảng chia 6'
        ]
      },
      {
        group: 'Chủ đề 2: Hình học và Đo lường',
        topics: [
          'Bài 4: Điểm ở giữa, trung điểm của đoạn thẳng',
          'Bài 5: Hình tròn, tâm, bán kính, đường kính'
        ]
      }
    ],
    'Tin học': [
      {
        group: 'Chủ đề 1: Máy tính và em',
        topics: [
          'Bài 1: Thông tin và quyết định',
          'Bài 2: Xử lí thông tin',
          'Bài 3: Máy tính và em',
          'Bài 4: Làm việc với máy tính',
          'Bài 5: Sử dụng bàn phím'
        ]
      },
      {
        group: 'Chủ đề 2: Mạng máy tính và Internet',
        topics: [
          'Bài 6: Khám phá thông tin trên Internet'
        ]
      },
      {
        group: 'Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
        topics: [
          'Bài 7: Sắp xếp để dễ tìm',
          'Bài 8: Sơ đồ hình cây. Tổ chức thông tin trong máy tính',
          'Bài 9: Thực hành với tệp và thư mục trong máy tính'
        ]
      },
      {
        group: 'Chủ đề 4: Đạo đức, pháp luật và văn hoá trong môi trường số',
        topics: [
          'Bài 10: Bảo vệ thông tin khi dùng máy tính'
        ]
      },
      {
        group: 'Chủ đề 5: Ứng dụng tin học',
        topics: [
          'Bài 11: Bài trình chiếu của em',
          'Bài 12: Tìm hiểu về thế giới tự nhiên',
          'Bài 13: Luyện tập sử dụng chuột'
        ]
      },
      {
        group: 'Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính',
        topics: [
          'Bài 14: Em thực hiện công việc như thế nào?',
          'Bài 15: Công việc được thực hiện theo điều kiện',
          'Bài 16: Công việc của em và sự trợ giúp của máy tính'
        ]
      }
    ]
  },
  4: {
    'Toán': [
      {
        group: 'Chủ đề 1: Số tự nhiên',
        topics: [
          'Bài 1: Các số có nhiều chữ số',
          'Bài 2: So sánh các số tự nhiên'
        ]
      }
    ],
    'Tin học': [
      {
        group: 'Chủ đề 1: Máy tính và em',
        topics: [
          'Bài 1: Phần cứng và phần mềm máy tính',
          'Bài 2: Gõ bàn phím đúng cách'
        ]
      },
      {
        group: 'Chủ đề 2: Mạng máy tính và Internet',
        topics: [
          'Bài 3: Thông tin trên trang web'
        ]
      },
      {
        group: 'Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
        topics: [
          'Bài 4: Tìm kiếm thông tin trên Internet',
          'Bài 5: Thao tác với tệp và thư mục'
        ]
      },
      {
        group: 'Chủ đề 4: Đạo đức, pháp luật và văn hoá trong môi trường số',
        topics: [
          'Bài 6: Sử dụng phần mềm khi được phép'
        ]
      },
      {
        group: 'Chủ đề 5: Ứng dụng tin học',
        topics: [
          'Bài 7: Tạo bài trình chiếu',
          'Bài 8: Định dạng văn bản trên trang chiếu',
          'Bài 9: Hiệu ứng chuyển trang',
          'Bài 10: Phần mềm soạn thảo văn bản',
          'Bài 11: Chỉnh sửa văn bản',
          'Bài 12A: Thực hành sử dụng công cụ đa phương tiện',
          'Bài 12B: Phần mềm luyện gõ bàn phím'
        ]
      },
      {
        group: 'Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính',
        topics: [
          'Bài 13: Chơi với máy tính',
          'Bài 14: Khám phá môi trường lập trình trực quan',
          'Bài 15: Tạo chương trình máy tính để diễn tả ý tưởng',
          'Bài 16: Chương trình của em'
        ]
      }
    ]
  },
  5: {
    'Toán': [
      {
        group: 'Chủ đề 1: Phân số và số thập phân',
        topics: [
          'Bài 1: Khái niệm số thập phân',
          'Bài 2: Cộng trừ hai số thập phân'
        ]
      }
    ],
    'Tin học': [
      {
        group: 'Chủ đề 1: Máy tính và em',
        topics: [
          'Bài 1: Em có thể làm gì với máy tính?'
        ]
      },
      {
        group: 'Chủ đề 2: Mạng máy tính và Internet',
        topics: [
          'Bài 2: Tìm kiếm thông tin trên website'
        ]
      },
      {
        group: 'Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
        topics: [
          'Bài 3: Tìm kiếm thông tin trong giải quyết vấn đề',
          'Bài 4: Cây thư mục'
        ]
      },
      {
        group: 'Chủ đề 4: Đạo đức, pháp luật và văn hoá trong môi trường số',
        topics: [
          'Bài 5: Bản quyền nội dung thông tin'
        ]
      },
      {
        group: 'Chủ đề 5: Ứng dụng tin học',
        topics: [
          'Bài 6: Định dạng kí tự và bố trí hình ảnh trong văn bản',
          'Bài 7: Thực hành soạn thảo văn bản'
        ]
      },
      {
        group: 'Chủ đề 5A: Sử dụng phần mềm đồ hoạ tạo sản phẩm số đơn giản',
        topics: [
          'Bài 8A: Làm quen với phần mềm đồ hoạ',
          'Bài 9A: Sử dụng phần mềm đồ hoạ tạo sản phẩm số'
        ]
      },
      {
        group: 'Chủ đề 5B: Sử dụng công cụ đa phương tiện hỗ trợ tạo sản phẩm đơn giản',
        topics: [
          'Bài 8B: Làm sản phẩm thủ công theo video hướng dẫn',
          'Bài 9B: Thực hành tạo đồ dùng gia đình theo video hướng dẫn'
        ]
      },
      {
        group: 'Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính',
        topics: [
          'Bài 10: Cấu trúc tuần tự',
          'Bài 11: Cấu trúc lặp',
          'Bài 12: Thực hành sử dụng lệnh lặp',
          'Bài 13: Cấu trúc rẽ nhánh',
          'Bài 14: Sử dụng biến trong chương trình',
          'Bài 15: Sử dụng biểu thức trong chương trình',
          'Bài 16: Từ kịch bản đến chương trình'
        ]
      }
    ]
  }
};

const BANK_QUESTIONS: Question[] = [
  // Lớp 1 - Toán
  {
    id: 'bank-1-toan-1',
    title: '3 + 4 bằng bao nhiêu?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    explanation: 'Ta đếm tiếp: 3 thêm 4 bằng 7.',
    difficulty: 'Dễ',
    gradeId: 1,
    category: 'Bài 5: Phép cộng trong phạm vi 10',
    authorId: 'system',
    subjectId: 'Toán'
  },
  {
    id: 'bank-1-toan-2',
    title: 'Số nào lớn nhất trong các số sau: 3, 9, 5, 7?',
    options: ['3', '9', '5', '7'],
    correctIndex: 1,
    explanation: 'Trong dãy số trên, 9 là số có giá trị lớn nhất.',
    difficulty: 'Dễ',
    gradeId: 1,
    category: 'Bài 4: Lớn hơn, bé hơn, bằng nhau',
    authorId: 'system',
    subjectId: 'Toán'
  },
  {
    id: 'bank-1-toan-3',
    title: '10 - 6 bằng bao nhiêu?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    explanation: '10 bớt đi 6 còn 4.',
    difficulty: 'Dễ',
    gradeId: 1,
    category: 'Bài 6: Phép trừ trong phạm vi 10',
    authorId: 'system',
    subjectId: 'Toán'
  },
  {
    id: 'bank-1-toan-4',
    title: 'Số "Tám" được viết là?',
    options: ['6', '7', '8', '9'],
    correctIndex: 2,
    explanation: 'Chữ "Tám" biểu thị số 8.',
    difficulty: 'Dễ',
    gradeId: 1,
    category: 'Bài 3: Các số 7, 8, 9, 10',
    authorId: 'system',
    subjectId: 'Toán'
  },
  {
    id: 'bank-1-toan-5',
    title: 'Hình nào có 3 cạnh?',
    options: ['Hình tròn', 'Hình vuông', 'Hình chữ nhật', 'Hình tam giác'],
    correctIndex: 3,
    explanation: 'Hình tam giác là hình có 3 cạnh và 3 góc.',
    difficulty: 'Dễ',
    gradeId: 1,
    category: 'Bài 7: Hình tròn, hình tam giác, hình vuông, hình chữ nhật',
    authorId: 'system',
    subjectId: 'Toán'
  },
  
  // Lớp 1 - Tin học
  {
    id: 'bank-1-tin-1',
    title: 'Thiết bị nào giúp em di chuyển con trỏ trên màn hình?',
    options: ['Bàn phím', 'Chuột máy tính', 'Máy in', 'Loa'],
    correctIndex: 1,
    explanation: 'Chuột máy tính dùng để điều khiển con trỏ trên màn hình một cách nhanh chóng.',
    difficulty: 'Dễ',
    gradeId: 1,
    category: 'Bài 3: Làm quen chuột máy tính và các thao tác cơ bản',
    authorId: 'system',
    subjectId: 'Tin học'
  },

  // Lớp 2 - Toán
  {
    id: 'bank-2-toan-1',
    title: 'Số liền sau của 99 là bao nhiêu?',
    options: ['98', '100', '101', '90'],
    correctIndex: 1,
    explanation: 'Số liền sau của một số bằng số đó cộng thêm 1: 99 + 1 = 100.',
    difficulty: 'Dễ',
    gradeId: 2,
    category: 'Bài 1: Đọc, viết các số có ba chữ số',
    authorId: 'system',
    subjectId: 'Toán'
  },
  {
    id: 'bank-2-toan-2',
    title: 'Một tuần lễ có mấy ngày?',
    options: ['5 ngày', '6 ngày', '7 ngày', '8 ngày'],
    correctIndex: 2,
    explanation: 'Một tuần có 7 ngày từ Thứ Hai đến Chủ Nhật.',
    difficulty: 'Dễ',
    gradeId: 2,
    category: 'Bài 1: Đọc, viết các số có ba chữ số',
    authorId: 'system',
    subjectId: 'Toán'
  },

  // Lớp 2 - Tin học
  {
    id: 'bank-2-tin-1',
    title: 'Hàng phím cơ sở chứa các phím nào sau đây?',
    options: ['Q W E R T Y', 'A S D F G H J K L', 'Z X C V B N M', 'Các phím số từ 1 đến 9'],
    correctIndex: 1,
    explanation: 'Hàng phím cơ sở có chứa hai phím có gờ F và J, gồm các phím A S D F G H J K L ; .',
    difficulty: 'Trung bình',
    gradeId: 2,
    category: 'Bài 3: Các hàng phím chính trên bàn phím',
    authorId: 'system',
    subjectId: 'Tin học'
  },

  // Lớp 3 - Toán
  {
    id: 'bank-3-toan-1',
    title: 'Trong phép chia cho 5, số dư lớn nhất có thể là bao nhiêu?',
    options: ['5', '4', '3', '1'],
    correctIndex: 1,
    explanation: 'Số dư luôn nhỏ hơn số chia. Vì vậy số dư lớn nhất khi chia cho 5 là 4.',
    difficulty: 'Trung bình',
    gradeId: 3,
    category: 'Bài 1: Bảng nhân 3, bảng chia 3',
    authorId: 'system',
    subjectId: 'Toán'
  },
  {
    id: 'bank-3-toan-2',
    title: 'Hình tròn có bao nhiêu tâm?',
    options: ['1 tâm', '2 tâm', 'Vô số tâm', 'Không có tâm'],
    correctIndex: 0,
    explanation: 'Mỗi hình tròn chỉ có duy nhất một tâm ở chính giữa.',
    difficulty: 'Dễ',
    gradeId: 3,
    category: 'Bài 5: Hình tròn, tâm, bán kính, đường kính',
    authorId: 'system',
    subjectId: 'Toán'
  },

  // Lớp 3 - Tin học
  {
    id: 'bank-3-tin-1',
    title: 'Bộ phận nào của máy tính hiển thị kết quả làm việc?',
    options: ['Màn hình', 'Bàn phím', 'Chuột', 'Loa'],
    correctIndex: 0,
    explanation: 'Màn hình hiển thị hình ảnh và chữ viết, giúp chúng ta thấy kết quả làm việc của máy tính.',
    difficulty: 'Dễ',
    gradeId: 3,
    category: 'Bài 3: Máy tính và em',
    authorId: 'system',
    subjectId: 'Tin học'
  },

  // Lớp 4 - Toán
  {
    id: 'bank-4-toan-1',
    title: 'Số 100 000 đọc là gì?',
    options: ['Mười nghìn', 'Một trăm nghìn', 'Một triệu', 'Một trăm'],
    correctIndex: 1,
    explanation: 'Số 100 000 gồm một chữ số 1 và năm chữ số 0, đọc là một trăm nghìn.',
    difficulty: 'Dễ',
    gradeId: 4,
    category: 'Bài 1: Các số có nhiều chữ số',
    authorId: 'system',
    subjectId: 'Toán'
  },

  // Lớp 4 - Tin học
  {
    id: 'bank-4-tin-1',
    title: 'Thiết bị nào sau đây là phần cứng của máy tính?',
    options: ['Hệ điều hành Windows', 'Phần mềm Paint', 'Màn hình máy tính', 'Trò chơi luyện gõ'],
    correctIndex: 2,
    explanation: 'Màn hình là thiết bị vật lý có thể nhìn thấy và chạm vào nên là phần cứng. Các mục còn lại là phần mềm.',
    difficulty: 'Dễ',
    gradeId: 4,
    category: 'Bài 1: Phần cứng và phần mềm máy tính',
    authorId: 'system',
    subjectId: 'Tin học'
  },

  // Lớp 5 - Toán
  {
    id: 'bank-5-toan-1',
    title: 'Số thập phân gồm có bao nhiêu phần?',
    options: ['Một phần', 'Hai phần (Phần nguyên và Phần thập phân)', 'Ba phần', 'Bốn phần'],
    correctIndex: 1,
    explanation: 'Số thập phân gồm có hai phần: phần nguyên ở bên trái dấu phẩy và phần thập phân ở bên phải dấu phẩy.',
    difficulty: 'Dễ',
    gradeId: 5,
    category: 'Bài 1: Khái niệm số thập phân',
    authorId: 'system',
    subjectId: 'Toán'
  },

  // Lớp 5 - Tin học
  {
    id: 'bank-5-tin-1',
    title: 'Trong Scratch, cấu trúc lặp giúp em làm gì?',
    options: ['Chạy chương trình từ đầu', 'Lặp lại một hoặc nhiều hành động nhiều lần', 'Xóa bớt nhân vật', 'Thay đổi màu nền'],
    correctIndex: 1,
    explanation: 'Cấu trúc lặp giúp thực hiện tự động một chuỗi lệnh lặp đi lặp lại để tối ưu hóa chương trình.',
    difficulty: 'Trung bình',
    gradeId: 5,
    category: 'Bài 11: Cấu trúc lặp',
    authorId: 'system',
    subjectId: 'Tin học'
  }
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [tugStarted, setTugStarted] = useState(false);
  const [tugMode, setTugMode] = useState<'speed' | 'marathon'>('speed');
  const [tugRedTeam, setTugRedTeam] = useState('Đội Đỏ');
  const [tugBlueTeam, setTugBlueTeam] = useState('Đội Xanh');
  const [tugTimeLimit, setTugTimeLimit] = useState(10); // in seconds: 5, 10, 15, 20, 0 (unlimited)
  const [tugSelectedImageIndex, setTugSelectedImageIndex] = useState(0);
  const [tugTimeLeft, setTugTimeLeft] = useState(10);
  const [showTugLeaderboard, setShowTugLeaderboard] = useState(false);
  
  const [tugRedScore, setTugRedScore] = useState(0);
  const [tugBlueScore, setTugBlueScore] = useState(0);
  const [tugPosition, setTugPosition] = useState(0); // -100 to 100
  const [tugActiveQIdx, setTugActiveQIdx] = useState(0);
  const [tugTurn, setTugTurn] = useState<'red' | 'blue'>('red');
  const [tugSelectedAns, setTugSelectedAns] = useState<number | null>(null);
  const [tugAnswered, setTugAnswered] = useState(false);
  const [tugWinner, setTugWinner] = useState<'red' | 'blue' | null>(null);
  const [tugLeaderboard, setTugLeaderboard] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('tug_leaderboard');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Dynamic countdown timer for active tug of war gameplay
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tugStarted && !tugAnswered && !tugWinner && tugTimeLimit > 0) {
      setTugTimeLeft(tugTimeLimit);
      timer = setInterval(() => {
        setTugTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Time ran out! Mark as answered wrong
            handleTugAnswer(-1); // -1 means timeout/wrong
            return 0;
          }
          if (prev <= 4) {
            triggerSound('tick'); // Tick sound for low time
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tugStarted, tugActiveQIdx, tugTurn, tugAnswered, tugWinner, tugTimeLimit]);

  // Keyboard shortcut listener for Tug of War active playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSubGame !== 'tug-of-war' || !tugStarted || tugAnswered || tugWinner) return;
      
      const key = e.key;
      
      // Blue team keys: '1', '2', '3', '4'
      if (tugTurn === 'blue') {
        if (key === '1') { e.preventDefault(); handleTugAnswer(0); }
        else if (key === '2') { e.preventDefault(); handleTugAnswer(1); }
        else if (key === '3') { e.preventDefault(); handleTugAnswer(2); }
        else if (key === '4') { e.preventDefault(); handleTugAnswer(3); }
      }
      
      // Red team keys: ArrowUp, ArrowLeft, ArrowDown, ArrowRight
      if (tugTurn === 'red') {
        if (key === 'ArrowUp') { e.preventDefault(); handleTugAnswer(0); }
        else if (key === 'ArrowLeft') { e.preventDefault(); handleTugAnswer(1); }
        else if (key === 'ArrowDown') { e.preventDefault(); handleTugAnswer(2); }
        else if (key === 'ArrowRight') { e.preventDefault(); handleTugAnswer(3); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSubGame, tugStarted, tugTurn, tugAnswered, tugWinner, triviaQuestions, tugActiveQIdx]);

  const declareTugWinner = (winnerSide: 'red' | 'blue' | 'draw') => {
    setTugWinner(winnerSide === 'draw' ? 'red' : winnerSide);
    triggerSound('win');
    
    let winnerName = 'Hòa';
    if (winnerSide === 'red') winnerName = tugRedTeam;
    if (winnerSide === 'blue') winnerName = tugBlueTeam;

    const newRecord = {
      id: Date.now().toString(),
      redTeam: tugRedTeam,
      blueTeam: tugBlueTeam,
      winner: winnerSide,
      winnerName: winnerName,
      redScore: tugRedScore,
      blueScore: tugBlueScore,
      mode: tugMode === 'speed' ? 'Thi Tốc Độ' : 'Đua Đường Dài',
      date: new Date().toLocaleString('vi-VN')
    };

    const updated = [newRecord, ...tugLeaderboard].slice(0, 20);
    setTugLeaderboard(updated);
    localStorage.setItem('tug_leaderboard', JSON.stringify(updated));
  };

  const handleTugAnswer = (optIdx: number) => {
    if (tugAnswered || tugWinner) return;
    setTugSelectedAns(optIdx);
    setTugAnswered(true);

    if (triviaQuestions.length === 0) return;
    const activeQ = triviaQuestions[tugActiveQIdx % triviaQuestions.length];
    const isCorrect = optIdx === activeQ.correctIndex;

    const teamName = tugTurn === 'red' ? tugRedTeam : tugBlueTeam;
    const oppTeamName = tugTurn === 'red' ? tugBlueTeam : tugRedTeam;

    if (isCorrect) {
      triggerSound('ding');
      if (tugTurn === 'red') {
        const newScore = tugRedScore + 1;
        setTugRedScore(newScore);
        setTugPosition(p => {
          const shift = tugMode === 'speed' ? -25 : -10;
          const next = p + shift;
          if (tugMode === 'speed' && next <= -75) {
            // Use local state variable for score representation
            setTimeout(() => {
              setTugWinner('red');
              declareTugWinner('red');
            }, 10);
          }
          return Math.max(-100, next);
        });
        showToast(`🎉 ${teamName} trả lời CHÍNH XÁC! Kéo mạnh về bên ${teamName}!`, "success");
      } else {
        const newScore = tugBlueScore + 1;
        setTugBlueScore(newScore);
        setTugPosition(p => {
          const shift = tugMode === 'speed' ? 25 : 10;
          const next = p + shift;
          if (tugMode === 'speed' && next >= 75) {
            setTimeout(() => {
              setTugWinner('blue');
              declareTugWinner('blue');
            }, 10);
          }
          return Math.min(100, next);
        });
        showToast(`🎉 ${teamName} trả lời CHÍNH XÁC! Kéo mạnh về bên ${teamName}!`, "success");
      }
    } else {
      triggerSound('lose');
      if (optIdx === -1) {
        showToast(`⏰ Hết giờ! ${teamName} đã mất lượt trả lời.`, "error");
      } else {
        showToast(`❌ ${teamName} trả lời chưa đúng! Cơ hội nghiêng về ${oppTeamName}.`, "error");
      }
      if (tugTurn === 'red') {
        setTugPosition(p => Math.min(100, p + (tugMode === 'speed' ? 10 : 5)));
      } else {
        setTugPosition(p => Math.max(-100, p - (tugMode === 'speed' ? 10 : 5)));
      }
    }
  };

  const handleNextTug = () => {
    const maxQuestions = Math.min(10, triviaQuestions.length);
    if (tugMode === 'marathon' && tugActiveQIdx + 1 >= maxQuestions) {
      // Determine marathon winner
      let winnerSide: 'red' | 'blue' | 'draw' = 'draw';
      if (tugRedScore > tugBlueScore) winnerSide = 'red';
      else if (tugBlueScore > tugRedScore) winnerSide = 'blue';
      else {
        if (tugPosition < 0) winnerSide = 'red';
        else if (tugPosition > 0) winnerSide = 'blue';
      }
      declareTugWinner(winnerSide);
      return;
    }

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
    setTugStarted(false); // Return to lobby on full reset
    triggerSound('click');
  };

  // --- TUG OF WAR QUESTION BANK MANAGEMENT ---
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qFormTitle, setQFormTitle] = useState('');
  const [qFormOptA, setQFormOptA] = useState('');
  const [qFormOptB, setQFormOptB] = useState('');
  const [qFormOptC, setQFormOptC] = useState('');
  const [qFormOptD, setQFormOptD] = useState('');
  const [qFormCorrect, setQFormCorrect] = useState(0); // index 0-3
  const [qFormExplanation, setQFormExplanation] = useState('');
  const [showJSONModal, setShowJSONModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // --- STATE FOR BANK QUESTIONS POPUP ---
  const [showBankPopup, setShowBankPopup] = useState(false);
  const [bankSelectedGrade, setBankSelectedGrade] = useState<number>(3);
  const [bankSelectedSubject, setBankSelectedSubject] = useState<string>('Tin học');
  const [bankSelectedTopic, setBankSelectedTopic] = useState<string>('Tất cả');
  const [bankSelectedQuestions, setBankSelectedQuestions] = useState<string[]>([]);

  // Lấy toàn bộ câu hỏi đã gộp (tự tạo + mẫu có sẵn)
  const getMergedBankQuestions = () => {
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    const localQs = localStorage.getItem(`school_questions_${userId}`);
    let userQuestions: Question[] = [];
    if (localQs) {
      try {
        userQuestions = JSON.parse(localQs);
      } catch (e) {
        console.error(e);
      }
    }

    const allMerged = [...userQuestions, ...BANK_QUESTIONS];
    const uniqueMap = new Map<string, Question>();
    allMerged.forEach(q => {
      const rawSubj = q.subjectId || 'Tin học';
      const foundSubj = allSubjects.find(s => s.id === rawSubj);
      const subjName = foundSubj ? foundSubj.name : rawSubj;
      const key = `${q.gradeId}_${subjName}_${q.title.trim().toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, q);
      }
    });

    return Array.from(uniqueMap.values());
  };

  // Tính câu hỏi thuộc Lớp, Môn và Chủ đề đã chọn
  const filteredBankQuestions = React.useMemo(() => {
    const merged = getMergedBankQuestions();
    return merged.filter(q => {
      // Lọc theo Lớp
      if (q.gradeId !== bankSelectedGrade) return false;
      
      // Lọc theo Môn
      const rawSubj = q.subjectId || 'Tin học';
      const foundSubj = allSubjects.find(s => s.id === rawSubj);
      const subjName = foundSubj ? foundSubj.name : rawSubj;
      if (subjName !== bankSelectedSubject) return false;
      
      // Lọc theo Chủ đề
      if (bankSelectedTopic !== 'Tất cả') {
        const normQCat = (q.category || '').toLowerCase().replace(/[.:]/g, ' ').replace(/\s+/g, ' ').trim();
        const normSelectedTopic = bankSelectedTopic.toLowerCase().replace(/[.:]/g, ' ').replace(/\s+/g, ' ').trim();
        if (normQCat !== normSelectedTopic) return false;
      }
      
      return true;
    });
  }, [bankSelectedGrade, bankSelectedSubject, bankSelectedTopic, showBankPopup, triviaQuestions, allSubjects]);

  // Lấy các chủ đề tương ứng với Lớp và Môn hiện tại
  const currentBankTopics = React.useMemo(() => {
    const topicsForGrade = TOPICS_MAP[bankSelectedGrade];
    if (topicsForGrade && topicsForGrade[bankSelectedSubject]) {
      return topicsForGrade[bankSelectedSubject];
    }
    return [];
  }, [bankSelectedGrade, bankSelectedSubject]);

  useEffect(() => {
    setBankSelectedTopic('Tất cả');
    setBankSelectedQuestions([]);
  }, [bankSelectedGrade, bankSelectedSubject]);

  const isAllBankQuestionsSelected = filteredBankQuestions.length > 0 && 
    filteredBankQuestions.every(q => bankSelectedQuestions.includes(q.id || ''));

  const handleToggleSelectAllBank = () => {
    if (isAllBankQuestionsSelected) {
      setBankSelectedQuestions([]);
    } else {
      const ids = filteredBankQuestions.map(q => q.id || '');
      setBankSelectedQuestions(ids);
    }
    triggerSound('click');
  };

  const handleToggleSelectQuestionBank = (qId: string) => {
    setBankSelectedQuestions(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      } else {
        return [...prev, qId];
      }
    });
    triggerSound('click');
  };

  const handleAddSelectedQuestions = () => {
    if (bankSelectedQuestions.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 câu hỏi!", "error");
      return;
    }
    
    const merged = getMergedBankQuestions();
    const selectedQs = merged.filter(q => bankSelectedQuestions.includes(q.id || ''));
    
    if (selectedQs.length === 0) {
      showToast("Có lỗi xảy ra khi lấy danh sách câu hỏi!", "error");
      return;
    }

    setTriviaQuestions(selectedQs);
    
    // Lưu vào localStorage
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    localStorage.setItem(`school_questions_${userId}`, JSON.stringify(selectedQs));
    
    setShowBankPopup(false);
    showToast(`📚 Đã nạp thành công ${selectedQs.length} câu hỏi từ Ngân hàng!`, "success");
    triggerSound('ding');
  };

  const handleSeedTugQuestions = () => {
    const sampleQuestions: Question[] = [
      {
        id: 'ts-1',
        title: 'Bộ phận nào bảo vệ não bộ của cơ thể người?',
        options: ['Xương sườn', 'Hộp sọ', 'Xương chậu', 'Xương cột sống'],
        correctIndex: 1,
        explanation: 'Hộp sọ cấu tạo từ các xương dẹt ghép lại giúp bao bọc và bảo vệ não bộ khỏi chấn động.',
        difficulty: 'Dễ',
        gradeId: 3,
        category: 'Khoa học',
        authorId: 'system'
      },
      {
        id: 'ts-2',
        title: 'Trong toán học, số nào là số nguyên tố nhỏ nhất?',
        options: ['0', '1', '2', '3'],
        correctIndex: 2,
        explanation: 'Số 2 là số nguyên tố nhỏ nhất và cũng là số nguyên tố chẵn duy nhất.',
        difficulty: 'Dễ',
        gradeId: 3,
        category: 'Toán học',
        authorId: 'system'
      },
      {
        id: 'ts-3',
        title: 'Con sông nào dài nhất thế giới?',
        options: ['Sông Nile', 'Sông Amazon', 'Sông Mê Kông', 'Sông Hồng'],
        correctIndex: 0,
        explanation: 'Sông Nile ở Châu Phi là con sông dài nhất thế giới với chiều dài khoảng 6,650 km.',
        difficulty: 'Trung bình',
        gradeId: 4,
        category: 'Địa lý',
        authorId: 'system'
      },
      {
        id: 'ts-4',
        title: 'Sự kiện lịch sử "Chiến thắng Điện Biên Phủ" diễn ra vào năm nào?',
        options: ['1945', '1954', '1975', '1930'],
        correctIndex: 1,
        explanation: 'Chiến thắng Điện Biên Phủ lẫy lừng năm châu, chấn động địa cầu diễn ra vào ngày 7/5/1954.',
        difficulty: 'Trung bình',
        gradeId: 5,
        category: 'Lịch sử',
        authorId: 'system'
      },
      {
        id: 'ts-5',
        title: 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?',
        options: ['Sao Kim', 'Sao Hỏa', 'Sao Thủy', 'Trái Đất'],
        correctIndex: 2,
        explanation: 'Sao Thủy (Mercury) là hành tinh nằm gần Mặt Trời nhất, chu kỳ quỹ đạo chỉ khoảng 88 ngày Trái Đất.',
        difficulty: 'Dễ',
        gradeId: 4,
        category: 'Khoa học vũ trụ',
        authorId: 'system'
      }
    ];

    setTriviaQuestions(sampleQuestions);
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    localStorage.setItem(`school_questions_${userId}`, JSON.stringify(sampleQuestions));
    showToast("📚 Đã tải 5 câu hỏi mẫu chất lượng cao vào Ngân hàng!", "success");
    triggerSound('ding');
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQFormTitle('');
    setQFormOptA('');
    setQFormOptB('');
    setQFormOptC('');
    setQFormOptD('');
    setQFormCorrect(0);
    setQFormExplanation('');
    setShowQuestionForm(true);
    triggerSound('click');
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQFormTitle(q.title);
    setQFormOptA(q.options[0] || '');
    setQFormOptB(q.options[1] || '');
    setQFormOptC(q.options[2] || '');
    setQFormOptD(q.options[3] || '');
    setQFormCorrect(q.correctIndex || 0);
    setQFormExplanation(q.explanation || '');
    setShowQuestionForm(true);
    triggerSound('click');
  };

  const handleSaveQForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qFormTitle.trim() || !qFormOptA.trim() || !qFormOptB.trim()) {
      showToast("Vui lòng điền tiêu đề câu hỏi và ít nhất 2 đáp án đầu tiên!", "error");
      return;
    }

    const opts = [
      qFormOptA.trim(),
      qFormOptB.trim(),
      qFormOptC.trim() || 'Đáp án C',
      qFormOptD.trim() || 'Đáp án D'
    ];

    let updatedList: Question[] = [];

    if (editingQuestion) {
      updatedList = triviaQuestions.map(q => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            title: qFormTitle.trim(),
            options: opts,
            correctIndex: qFormCorrect,
            explanation: qFormExplanation.trim()
          };
        }
        return q;
      });
      showToast("✏️ Cập nhật câu hỏi thành công!", "success");
    } else {
      const newQ: Question = {
        id: 'q-custom-' + Date.now(),
        title: qFormTitle.trim(),
        options: opts,
        correctIndex: qFormCorrect,
        explanation: qFormExplanation.trim(),
        difficulty: 'Trung bình',
        gradeId: selectedGrade || 3,
        category: 'Kéo co',
        authorId: currentUser ? (currentUser.id || 'user') : 'user'
      };
      updatedList = [...triviaQuestions, newQ];
      showToast("➕ Thêm câu hỏi mới thành công!", "success");
    }

    setTriviaQuestions(updatedList);
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    localStorage.setItem(`school_questions_${userId}`, JSON.stringify(updatedList));
    setShowQuestionForm(false);
    triggerSound('ding');
  };

  const handleDeleteTugQuestion = (qId: string) => {
    const updated = triviaQuestions.filter(q => q.id !== qId);
    setTriviaQuestions(updated);
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    localStorage.setItem(`school_questions_${userId}`, JSON.stringify(updated));
    showToast("🗑️ Đã xóa câu hỏi khỏi ngân hàng!", "success");
    triggerSound('lose');
  };

  const handleSaveQuestionsToLocal = () => {
    const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
    localStorage.setItem(`school_questions_${userId}`, JSON.stringify(triviaQuestions));
    showToast("💾 Đã lưu toàn bộ Ngân hàng Câu hỏi!", "success");
    triggerSound('ding');
  };

  const handleUploadJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const isArr = Array.isArray(parsed);
        const rawItems = isArr ? parsed : [parsed];
        
        const formatted: Question[] = rawItems.map((item: any, idx: number) => {
          return {
            id: item.id || `q-import-${idx}-${Date.now()}`,
            title: item.title || item.question || `Câu hỏi nhập khẩu số ${idx + 1}`,
            options: Array.isArray(item.options) ? item.options : ['Đúng', 'Sai', 'Không biết', 'Khác'],
            correctIndex: typeof item.correctIndex === 'number' ? item.correctIndex : 0,
            explanation: item.explanation || '',
            difficulty: item.difficulty || 'Trung bình',
            gradeId: item.gradeId || selectedGrade || 3,
            category: item.category || 'Kéo co',
            authorId: item.authorId || (currentUser ? (currentUser.id || 'user') : 'user'),
            subjectId: item.subjectId || 'Tin học'
          };
        });

        const newList = [...triviaQuestions, ...formatted];
        setTriviaQuestions(newList);
        const userId = currentUser ? (currentUser.username || currentUser.id || 'default') : 'default';
        localStorage.setItem(`school_questions_${userId}`, JSON.stringify(newList));
        showToast(`📂 Đã nhập thành công ${formatted.length} câu hỏi từ tệp JSON!`, "success");
        triggerSound('ding');
      } catch (err) {
        showToast("Định dạng tệp JSON không hợp lệ! Vui lòng kiểm tra lại.", "error");
      }
      e.target.value = ''; // Reset input
    };
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

      {activeSubGame === 'tug-of-war' && (
        <div className="bg-[#fefaf4] p-5 sm:p-7 rounded-3xl shadow-md border-2 border-[#ede4d7] space-y-6 animate-in zoom-in-95 duration-200 text-slate-800">
          {/* Top navigation controls */}
          <div className="flex justify-between items-center border-b border-[#e6dcce] pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubGame(null);
                  triggerSound('click');
                }}
                className="text-xs font-black text-amber-900 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer transition hover:bg-[#ebdcc9] py-1.5 px-3 rounded-xl border border-[#d6c7b3] bg-white shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
                Quay lại danh sách
              </button>

              <span className="bg-[#fcf1e3] text-amber-800 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border border-[#ebdcc9] flex items-center gap-1">
                🪢 Kéo Co Kiến Thức
              </span>
            </div>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200/50' 
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

          {/* Lobby View */}
          {!tugStarted ? (
            <div className="space-y-6">
              {/* Title Header Block with illustration */}
              <div className="text-center py-2 space-y-2 relative">
                <div className="flex justify-center items-center gap-4 text-3xl select-none animate-bounce duration-1000">
                  <span>👦👧🎒</span>
                  <span className="text-4xl">🪢</span>
                  <span>👧👦🎒</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#85532d] uppercase tracking-tight font-sans drop-shadow-sm flex items-center justify-center gap-2">
                  🏆 Kéo Co Kiến Thức 🏆
                </h1>
                <p className="text-xs bg-[#ebdcc9]/50 inline-block px-4 py-1 rounded-full text-amber-900 font-bold tracking-wider">
                  🎮 Trò chơi trắc nghiệm đối kháng siêu vui 🎮
                </p>
              </div>

              {/* Main setup interface columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left controls column */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Game Mode selection */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#ebdcc9] shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Zap className="w-4 h-4 text-amber-600 fill-amber-100" />
                      Chế Độ Chơi
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => { setTugMode('speed'); triggerSound('click'); }}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                          tugMode === 'speed'
                            ? 'bg-[#fffbf4] border-amber-500 text-amber-950 ring-2 ring-amber-400/20 shadow'
                            : 'bg-white border-slate-200 text-slate-550 hover:border-slate-350 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">🏎️ Thi Tốc Độ</span>
                          {tugMode === 'speed' && <span className="text-amber-600 font-black text-xs">✓</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">Ai đạt mốc trước thì thắng ngay lập tức!</p>
                      </button>

                      <button
                        onClick={() => { setTugMode('marathon'); triggerSound('click'); }}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                          tugMode === 'marathon'
                            ? 'bg-[#fffbf4] border-amber-500 text-amber-950 ring-2 ring-amber-400/20 shadow'
                            : 'bg-white border-slate-200 text-slate-550 hover:border-slate-350 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">🏋️ Đua Đường Dài</span>
                          {tugMode === 'marathon' && <span className="text-amber-600 font-black text-xs">✓</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">Trả lời 10 câu, so tổng điểm của cả hai đội!</p>
                      </button>
                    </div>
                  </div>

                  {/* Team Names inputs */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#ebdcc9] shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      Đặt Tên Đội
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                          🔵 Đội Xanh
                        </label>
                        <input
                          type="text"
                          value={tugBlueTeam}
                          onChange={(e) => setTugBlueTeam(e.target.value.slice(0, 15))}
                          placeholder="Đội Xanh"
                          className="w-full bg-[#f8fafc] border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded-xl p-2 px-3 text-xs font-bold transition-all text-blue-950 shadow-inner"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                          🔴 Đội Đỏ
                        </label>
                        <input
                          type="text"
                          value={tugRedTeam}
                          onChange={(e) => setTugRedTeam(e.target.value.slice(0, 15))}
                          placeholder="Đội Đỏ"
                          className="w-full bg-[#fffcfc] border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 focus:outline-none rounded-xl p-2 px-3 text-xs font-bold transition-all text-rose-950 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stopwatch Countdown limit selection */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#ebdcc9] shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Timer className="w-4 h-4 text-amber-600" />
                      Thời Gian Mỗi Câu
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 20, 0].map((sec) => {
                        const isSelected = tugTimeLimit === sec;
                        return (
                          <button
                            key={sec}
                            onClick={() => { setTugTimeLimit(sec); triggerSound('click'); }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 border border-amber-700 text-white shadow-md'
                                : 'bg-[#faf6f0] border border-slate-200 text-slate-700 hover:bg-[#ede4d7]/40'
                            }`}
                          >
                            {sec === 0 ? '♾️ Không giới hạn' : `${sec} giây`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Character style selection (Đổi ảnh đội) */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#ebdcc9] shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Image className="w-4 h-4 text-amber-600" />
                      Đổi Ảnh Đội Kéo Co
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Học Sinh', left: '👦👦🔴', right: '🔵👧👧' },
                        { label: 'Dã Thú', left: '🐯🐯🔴', right: '🔵🦁🦁' },
                        { label: 'Ninja', left: '🥷🥷🔴', right: '🔵🥷🥷' },
                        { label: 'Robot', left: '👾👾🔴', right: '🔵🤖🤖' }
                      ].map((item, idx) => {
                        const isSelected = tugSelectedImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => { setTugSelectedImageIndex(idx); triggerSound('click'); }}
                            className={`p-2 py-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                              isSelected
                                ? 'bg-[#fffbf4] border-amber-500 shadow-sm ring-1 ring-amber-400/20'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-black text-amber-950">{item.label}</span>
                            <div className="text-[10px] text-slate-400 select-none flex items-center justify-center gap-1 font-mono pt-1">
                              <span>{item.left.slice(0, 4)}</span>
                              <span>vs</span>
                              <span>{item.right.slice(2, 6)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hotkeys info */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#ebdcc9] shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Keyboard className="w-4 h-4 text-amber-600" />
                      Phím Tắt Khi Chơi (Chọn Đáp Án A, B, C, D)
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">🔵</span>
                        <div>
                          <p className="text-[10px] text-blue-800 font-bold uppercase">Phím Đội Xanh</p>
                          <p className="font-mono text-slate-600 text-xs">Phím số: <strong className="text-blue-600">1, 2, 3, 4</strong></p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">🔴</span>
                        <div>
                          <p className="text-[10px] text-rose-800 font-bold uppercase">Phím Đội Đỏ</p>
                          <p className="font-mono text-slate-600 text-xs">Mũi tên: <strong className="text-rose-600">↑, ←, ↓, →</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboards action */}
                  <button
                    onClick={() => { setShowTugLeaderboard(true); triggerSound('click'); }}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-3 rounded-2xl font-black uppercase text-xs tracking-wider shadow transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-600"
                  >
                    <Trophy className="w-4 h-4 fill-amber-200" />
                    BẢNG VÀNG - Lịch sử thi đấu
                  </button>
                </div>

                {/* Right Question Bank column */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#ebdcc9] shadow-sm space-y-4 flex flex-col min-h-[460px]">
                    {/* Header with counter */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        📝 Ngân Hàng Câu Hỏi
                        <span className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                          {triviaQuestions.length} câu
                        </span>
                      </h3>
                    </div>

                    {/* Toolbar buttons */}
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
                      <button
                        onClick={handleOpenAddQuestion}
                        className="p-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                        title="Thêm câu hỏi mới"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm</span>
                      </button>

                      <button
                        onClick={() => {
                          setBankSelectedGrade(selectedGrade || 3);
                          setBankSelectedSubject('Tin học');
                          setBankSelectedTopic('Tất cả');
                          setBankSelectedQuestions([]);
                          setShowBankPopup(true);
                          triggerSound('click');
                        }}
                        className="p-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                        title="Lấy câu hỏi từ Ngân hàng"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Ngân hàng</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleUploadJSONFile}
                        className="hidden"
                      />

                      <button
                        onClick={() => { fileInputRef.current?.click(); triggerSound('click'); }}
                        className="p-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                        title="Tải câu hỏi từ tệp JSON (Máy tính hoặc Google Drive)"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>JSON</span>
                      </button>

                      <button
                        onClick={handleSaveQuestionsToLocal}
                        disabled={triviaQuestions.length === 0}
                        className={`p-2 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shadow-sm transition-all ${
                          triviaQuestions.length > 0
                            ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title="Lưu vào trình duyệt"
                      >
                        <Save className="w-4 h-4" />
                        <span>Lưu</span>
                      </button>
                    </div>

                    {/* Question List container */}
                    <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-100 rounded-xl bg-slate-50/50 p-2 space-y-2">
                      {triviaQuestions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <Clipboard className="w-12 h-12 text-[#e6dcce] animate-pulse" />
                          <p className="text-xs text-slate-500 font-semibold max-w-[200px] leading-relaxed">
                            Chưa có câu hỏi nào. Nhấp vào <strong className="text-amber-800">"Ngân hàng"</strong> hoặc <strong className="text-emerald-600">"Thêm"</strong> để bắt đầu!
                          </p>
                        </div>
                      ) : (
                        triviaQuestions.map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-start justify-between gap-2 shadow-sm hover:border-amber-200 transition-all group"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <p className="text-[11px] font-black text-amber-900">Câu {idx + 1}:</p>
                              <p className="text-xs font-semibold text-slate-800 leading-tight break-words" title={q.title}>
                                {q.title}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-1.5 select-none">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  q.difficulty === 'Dễ' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : q.difficulty === 'Khó' 
                                    ? 'bg-rose-50 text-rose-700' 
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {q.difficulty}
                                </span>
                                <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  Đúng: {String.fromCharCode(65 + q.correctIndex)}
                                </span>
                              </div>
                            </div>

                            <div className="flex shrink-0 space-x-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditQuestion(q)}
                                className="p-1 hover:bg-slate-100 text-blue-500 hover:text-blue-700 rounded transition cursor-pointer"
                                title="Sửa câu hỏi"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTugQuestion(q.id)}
                                className="p-1 hover:bg-slate-100 text-rose-500 hover:text-rose-700 rounded transition cursor-pointer"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Play action */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    if (triviaQuestions.length === 0) {
                      showToast("Vui lòng tải hoặc tạo câu hỏi trước khi bắt đầu!", "error");
                      return;
                    }
                    // Initialize game state variables
                    setTugRedScore(0);
                    setTugBlueScore(0);
                    setTugPosition(0);
                    setTugActiveQIdx(0);
                    setTugTurn('red');
                    setTugSelectedAns(null);
                    setTugAnswered(false);
                    setTugWinner(null);
                    setTugStarted(true);
                    triggerSound('click');
                  }}
                  className={`w-full max-w-lg mx-auto bg-gradient-to-b from-[#e58a2d] to-[#bf6c16] hover:from-[#f39c3e] hover:to-[#cd7d27] text-white p-4.5 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 cursor-pointer border-t-2 border-[#ffbe6a] border-b-4 border-[#854d12] ${
                    triviaQuestions.length === 0 ? 'opacity-50 cursor-not-allowed filter grayscale' : ''
                  }`}
                >
                  <Play className="w-5 h-5 fill-white text-white shrink-0 animate-pulse" />
                  🚀 BẮT ĐẦU KÉO CO! 🚀
                </button>
                {triviaQuestions.length === 0 && (
                  <p className="text-[10px] text-rose-500 font-black mt-2">
                    ⚠️ Ngân hàng câu hỏi đang trống! Nhấp vào "Ngân hàng" để nạp nhanh.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Active Tug of War gameplay view */
            <div className="space-y-6">
              {/* Gameplay stats with round timer */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-[#f7eedf] p-3.5 rounded-2xl border border-[#ebdcc9] gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">Chế độ thi đấu</p>
                    <p className="text-xs font-black text-[#5c3415] uppercase">
                      {tugMode === 'speed' ? '🏎️ Thi Tốc Độ (75 điểm thắng)' : '🏋️ Đua Đường Dài (Tích lũy 10 lượt)'}
                    </p>
                  </div>
                </div>

                {/* Round timer indicator */}
                {tugTimeLimit > 0 && !tugAnswered && !tugWinner && (
                  <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl shadow-sm border border-[#ebdcc9]">
                    <Timer className={`w-4 h-4 ${tugTimeLeft <= 4 ? 'text-rose-600 animate-spin' : 'text-amber-600'}`} />
                    <span className={`text-xs font-black font-mono ${tugTimeLeft <= 4 ? 'text-rose-600 scale-110' : 'text-slate-800'}`}>
                      ⏱️ Còn lại: {tugTimeLeft}s
                    </span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setTugStarted(false);
                    triggerSound('click');
                  }}
                  className="text-[10px] font-bold text-amber-800 bg-white border border-[#d6c7b3] hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm"
                >
                  ↩ Quay lại Sảnh
                </button>
              </div>

              {/* Visual Arena Rope and players */}
              <div className="bg-gradient-to-b from-sky-50 to-emerald-50/60 p-5 sm:p-7 rounded-3xl border border-slate-200/50 relative overflow-hidden min-h-[190px] flex flex-col justify-between shadow-inner">
                {/* Score indicators */}
                <div className="flex justify-between items-center w-full relative z-10 gap-2">
                  <div className="bg-rose-500 text-white rounded-xl px-4 py-2 font-black text-xs sm:text-sm shadow flex items-center gap-2">
                    <span className="shrink-0">🔴</span>
                    <span className="truncate max-w-[100px]">{tugRedTeam.toUpperCase()}</span>: {tugRedScore} đ
                  </div>
                  
                  <div className="text-center bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 hidden sm:block">
                    Phân định thắng thua tại vạch ranh giới!
                  </div>
                  
                  <div className="bg-blue-600 text-white rounded-xl px-4 py-2 font-black text-xs sm:text-sm shadow flex items-center gap-2">
                    <span className="shrink-0">🔵</span>
                    <span className="truncate max-w-[100px]">{tugBlueTeam.toUpperCase()}</span>: {tugBlueScore} đ
                  </div>
                </div>

                {/* Rope pulling graphic */}
                <div className="relative w-full h-16 flex items-center justify-center my-6">
                  {/* Tug field center line */}
                  <div className="absolute top-0 bottom-0 w-1.5 bg-slate-350/50 z-0" />
                  
                  {/* Red limits */}
                  <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-rose-500/20 border-l border-dashed border-rose-500/40" />
                  <div className="absolute top-0 bottom-0 right-12 w-0.5 bg-blue-500/20 border-r border-dashed border-blue-500/40" />

                  <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-2 bg-amber-800 rounded-full shadow-inner" />

                  {/* Pulling Rope Container with dynamic offset */}
                  <div 
                    className="absolute h-12 flex items-center justify-center transition-all duration-500"
                    style={{ transform: `translateX(${tugPosition}px)` }}
                  >
                    {/* Left pulling team */}
                    <span className="text-2xl sm:text-3xl pr-6 select-none filter drop-shadow">
                      {tugSelectedImageIndex === 0 && '👦👦🔴'}
                      {tugSelectedImageIndex === 1 && '🐯🐯🔴'}
                      {tugSelectedImageIndex === 2 && '🥷🥷🔴'}
                      {tugSelectedImageIndex === 3 && '👾👾🔴'}
                    </span>
                    
                    {/* Center flag */}
                    <div className="w-16 h-2 bg-[#d7a15c] border border-amber-600 relative flex items-center justify-center">
                      <span className="absolute text-xl -mt-6 select-none animate-pulse">🚩</span>
                    </div>
                    
                    {/* Right pulling team */}
                    <span className="text-2xl sm:text-3xl pl-6 select-none filter drop-shadow">
                      {tugSelectedImageIndex === 0 && '🔵👧👧'}
                      {tugSelectedImageIndex === 1 && '🔵🦁🦁'}
                      {tugSelectedImageIndex === 2 && '🔵🥷🥷'}
                      {tugSelectedImageIndex === 3 && '🔵🤖🤖'}
                    </span>
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center relative z-10 font-black text-xs text-slate-700 uppercase tracking-widest">
                  {tugWinner ? (
                    <span className="text-emerald-600 text-sm bg-white/95 px-4 py-1.5 rounded-full shadow-sm border border-emerald-200">
                      🏆 Chúc mừng {tugWinner === 'red' ? tugRedTeam.toUpperCase() : tugBlueTeam.toUpperCase()} đã chiến thắng chung cuộc!
                    </span>
                  ) : (
                    <span className="bg-white/80 px-4 py-1.5 rounded-full text-[10px]">
                      Lượt thi đấu của: <strong className={tugTurn === 'red' ? 'text-rose-500' : 'text-blue-600'}>
                        {tugTurn === 'red' ? `🔴 ${tugRedTeam.toUpperCase()}` : `🔵 ${tugBlueTeam.toUpperCase()}`}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Answer & Question Board */}
              {tugWinner ? (
                <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-300 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                  <span className="text-5xl select-none animate-bounce block">👑🥇🏆</span>
                  <h3 className="text-base font-black text-emerald-800 uppercase tracking-widest">Vòng đấu kết thúc!</h3>
                  <p className="text-xs text-slate-650 max-w-sm mx-auto font-bold">
                    {tugWinner === 'red' ? tugRedTeam : tugBlueTeam} đã giành chiến thắng thuyết phục nhờ tinh thần thép và sự thông thái của mình!
                  </p>
                  <button
                    onClick={resetTugGame}
                    className="bg-[#e58a2d] hover:bg-[#cd7d27] text-white text-xs font-black uppercase px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg border-b-4 border-[#854d12]"
                  >
                    Quay lại sảnh trò chơi
                  </button>
                </div>
              ) : (
                <div className="bg-white p-5 sm:p-6 rounded-2.5xl border-2 border-[#ebdcc9] space-y-5 text-left shadow-sm">
                  {/* Active Question */}
                  <div className="space-y-1">
                    <span className="bg-[#fef4e8] border border-[#ebdcc9] text-[#78461b] text-[10px] font-black px-3 py-1 rounded-lg uppercase inline-block">
                      Câu hỏi số {tugActiveQIdx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-800 pt-1.5 leading-relaxed">
                      {triviaQuestions[tugActiveQIdx % triviaQuestions.length]?.title}
                    </h4>
                  </div>

                  {/* Multiple Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {triviaQuestions[tugActiveQIdx % triviaQuestions.length]?.options.map((opt, oIdx) => {
                      const isSelected = tugSelectedAns === oIdx;
                      const isCorrect = oIdx === triviaQuestions[tugActiveQIdx % triviaQuestions.length].correctIndex;
                      const showCorrectness = tugAnswered;

                      let btnStyle = 'bg-white border-slate-200 text-slate-650 hover:border-amber-300 hover:bg-amber-50/20';
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
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            showCorrectness && isCorrect 
                              ? 'bg-emerald-500 text-white' 
                              : showCorrectness && isSelected 
                              ? 'bg-rose-500 text-white' 
                              : 'bg-slate-150 text-slate-500 font-bold'
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
                    <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <p className="text-[11px] text-slate-500 italic max-w-md">
                        💡 {triviaQuestions[tugActiveQIdx % triviaQuestions.length]?.explanation || 'Không có giải thích chi tiết.'}
                      </p>
                      
                      <button
                        onClick={handleNextTug}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer shrink-0 border-b-2 border-amber-800 shadow"
                      >
                        {tugMode === 'marathon' && (tugActiveQIdx + 1 >= Math.min(10, triviaQuestions.length))
                          ? 'Xem kết quả ván đấu'
                          : 'Tiếp tục lượt sau'
                        }
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* MODAL: BẢNG VÀNG - LEADERBOARD RECORDS */}
          {/* ============================================================== */}
          {showTugLeaderboard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border-2 border-amber-500 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4.5 text-white flex justify-between items-center">
                  <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-5 h-5 fill-amber-200" />
                    BẢNG VÀNG KÉO CO KIẾN THỨC
                  </h3>
                  <button
                    onClick={() => setShowTugLeaderboard(false)}
                    className="p-1 hover:bg-white/25 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content list */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {tugLeaderboard.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Trophy className="w-12 h-12 text-slate-200 mx-auto" />
                      <p className="text-xs text-slate-500 font-bold">Chưa ghi nhận trận đấu nào.</p>
                      <p className="text-[10px] text-slate-400">Hãy chơi một trận đấu để lưu thành tích vào đây!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tugLeaderboard.map((item, idx) => {
                        const redWin = item.winner === 'red';
                        const blueWin = item.winner === 'blue';
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  Top {idx + 1}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono font-medium">{item.date}</span>
                                <span className="text-[9px] font-bold text-slate-500">({item.mode})</span>
                              </div>
                              <div className="text-xs font-bold text-slate-700 pt-1 flex items-center gap-1 flex-wrap">
                                <span className={redWin ? 'text-rose-600 font-black' : 'text-slate-650'}>
                                  🔴 {item.redTeam} ({item.redScore}đ)
                                </span>
                                <span className="text-slate-400">vs</span>
                                <span className={blueWin ? 'text-blue-600 font-black' : 'text-slate-650'}>
                                  🔵 {item.blueTeam} ({item.blueScore}đ)
                                </span>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Nhà Vô Địch</p>
                              <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                👑 {item.winnerName}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between gap-3">
                  <button
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử thi đấu?")) {
                        setTugLeaderboard([]);
                        localStorage.removeItem('tug_leaderboard');
                        showToast("Đã xóa toàn bộ lịch sử!", "success");
                      }
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 p-2 border border-rose-200 rounded-xl bg-white hover:bg-rose-50 cursor-pointer"
                  >
                    Xóa sạch lịch sử
                  </button>

                  <button
                    onClick={() => setShowTugLeaderboard(false)}
                    className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODAL: THÊM / SỬA CÂU HỎI */}
          {/* ============================================================== */}
          {showQuestionForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <form
                onSubmit={handleSaveQForm}
                className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-emerald-500 shadow-2xl animate-in zoom-in-95 duration-200"
              >
                {/* Header */}
                <div className="bg-emerald-600 p-4.5 text-white flex justify-between items-center">
                  <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    {editingQuestion ? '✏️ CHỈNH SỬA CÂU HỎI' : '➕ THÊM CÂU HỎI MỚI'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowQuestionForm(false)}
                    className="p-1 hover:bg-white/25 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-amber-900 font-black">1. Câu hỏi / Đề bài *</label>
                    <textarea
                      required
                      value={qFormTitle}
                      onChange={(e) => setQFormTitle(e.target.value)}
                      placeholder="Ví dụ: Thủ đô của Việt Nam là thành phố nào?"
                      rows={2}
                      className="w-full bg-[#fcfcfc] border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none rounded-xl p-2.5 px-3.5 text-xs transition-all"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="text-amber-900 font-black">2. Các đáp án lựa chọn *</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">Đáp án A *</span>
                        <input
                          type="text"
                          required
                          value={qFormOptA}
                          onChange={(e) => setQFormOptA(e.target.value)}
                          placeholder="Nhập phương án A"
                          className="w-full bg-[#fcfcfc] border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none rounded-xl p-2.5 px-3 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">Đáp án B *</span>
                        <input
                          type="text"
                          required
                          value={qFormOptB}
                          onChange={(e) => setQFormOptB(e.target.value)}
                          placeholder="Nhập phương án B"
                          className="w-full bg-[#fcfcfc] border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none rounded-xl p-2.5 px-3 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">Đáp án C</span>
                        <input
                          type="text"
                          value={qFormOptC}
                          onChange={(e) => setQFormOptC(e.target.value)}
                          placeholder="Nhập phương án C (nếu có)"
                          className="w-full bg-[#fcfcfc] border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none rounded-xl p-2.5 px-3 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">Đáp án D</span>
                        <input
                          type="text"
                          value={qFormOptD}
                          onChange={(e) => setQFormOptD(e.target.value)}
                          placeholder="Nhập phương án D (nếu có)"
                          className="w-full bg-[#fcfcfc] border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none rounded-xl p-2.5 px-3 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Correct Index */}
                  <div className="space-y-1.5">
                    <label className="text-amber-900 font-black">3. Đáp án chính xác *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((optIdx) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => setQFormCorrect(optIdx)}
                          className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            qFormCorrect === optIdx
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <label className="text-amber-900 font-black">4. Giải thích / Lời giải gợi ý</label>
                    <input
                      type="text"
                      value={qFormExplanation}
                      onChange={(e) => setQFormExplanation(e.target.value)}
                      placeholder="Nhập giải thích ngắn gọn hiển thị khi học sinh trả lời đúng/sai."
                      className="w-full bg-[#fcfcfc] border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:outline-none rounded-xl p-2.5 px-3.5 text-xs"
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowQuestionForm(false)}
                    className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase shadow cursor-pointer border-b-2 border-emerald-800"
                  >
                    {editingQuestion ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
                  </button>
                </div>
              </form>
            </div>
          )}


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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
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

      {/* ============================================================== */}
      {/* --- BANK QUESTIONS POPUP MODAL ---                             */}
      {/* ============================================================== */}
      {showBankPopup && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border-4 border-[#ffbe6c] transform transition-all animate-fadeIn flex flex-col max-h-[90vh]">
            
            {/* Header section with warm orange-amber background */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 p-5 text-white flex justify-between items-center relative border-b-4 border-[#ffbe6c] text-left">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
                <span>📚</span> Ngân Hàng Câu Hỏi Có Sẵn
              </h3>
              
              <button
                onClick={() => {
                  setShowBankPopup(false);
                  triggerSound('click');
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-2xl p-1.5 transition shadow-md cursor-pointer border-2 border-white flex items-center justify-center"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters section (Grade, Subject, Topic) */}
            <div className="p-6 pb-2 text-left bg-[#fffdf9] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Grade */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-amber-950/85 flex items-center gap-1.5">
                    🎓 Chọn Lớp:
                  </label>
                  <div className="relative">
                    <select
                      value={bankSelectedGrade}
                      onChange={(e) => {
                        setBankSelectedGrade(Number(e.target.value));
                        triggerSound('click');
                      }}
                      className="w-full border-2 border-[#ebdcc9] bg-white rounded-2xl px-4 py-3 text-xs font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value={1}>Lớp 1</option>
                      <option value={2}>Lớp 2</option>
                      <option value={3}>Lớp 3</option>
                      <option value={4}>Lớp 4</option>
                      <option value={5}>Lớp 5</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-amber-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Select Subject */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-amber-950/85 flex items-center gap-1.5">
                    📖 Chọn Môn:
                  </label>
                  <div className="relative">
                    <select
                      value={bankSelectedSubject}
                      onChange={(e) => {
                        setBankSelectedSubject(e.target.value);
                        triggerSound('click');
                      }}
                      className="w-full border-2 border-[#ebdcc9] bg-white rounded-2xl px-4 py-3 text-xs font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="Toán">Toán</option>
                      <option value="Tin học">Tin học</option>
                      <option value="Tiếng Việt">Tiếng Việt</option>
                      <option value="Khoa học">Khoa học</option>
                      <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-amber-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Topic / Chapter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-amber-950/85 flex items-center gap-1.5">
                  📂 Chủ đề & Bài học:
                </label>
                <div className="relative">
                  <select
                    value={bankSelectedTopic}
                    onChange={(e) => {
                      setBankSelectedTopic(e.target.value);
                      triggerSound('click');
                    }}
                    className="w-full border-2 border-[#ebdcc9] bg-white rounded-2xl px-4 py-3 text-xs font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="Tất cả">✨ Tất cả chủ đề & bài học</option>
                    {currentBankTopics.map((grp) => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.topics.map((topic) => (
                          <option key={topic} value={topic}>
                            {topic}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-amber-700">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Select All Banner */}
              <div className="flex items-center justify-between p-3.5 bg-[#fef5e7] border-2 border-[#fbe9d0] rounded-2xl shadow-sm mt-2">
                <label className="flex items-center gap-2.5 font-bold text-xs text-amber-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllBankQuestionsSelected}
                    onChange={handleToggleSelectAllBank}
                    className="w-5 h-5 rounded border-[#ebdcc9] text-orange-500 focus:ring-orange-400 cursor-pointer"
                  />
                  Chọn tất cả
                </label>
                <span className="text-xs font-black text-orange-600 font-mono">
                  {bankSelectedQuestions.length} câu đã chọn
                </span>
              </div>
            </div>

            {/* Questions List Section */}
            <div className="px-6 py-2 overflow-y-auto bg-[#fffdf9] flex-1 text-left min-h-[150px] max-h-[350px]">
              <div className="space-y-3 pr-1">
                {filteredBankQuestions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-2xl">🔍</p>
                    <p className="text-xs font-bold">Không tìm thấy câu hỏi phù hợp!</p>
                    <p className="text-[10px] text-slate-400">Vui lòng điều chỉnh bộ lọc hoặc chọn lớp/môn học khác.</p>
                  </div>
                ) : (
                  filteredBankQuestions.map((q) => {
                    const isSelected = bankSelectedQuestions.includes(q.id || '');
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleToggleSelectQuestionBank(q.id || '')}
                        className={`p-4 bg-white border-2 rounded-2xl transition-all flex gap-3.5 shadow-sm cursor-pointer hover:border-orange-300 ${
                          isSelected ? 'border-orange-400 bg-orange-50/10' : 'border-[#ebdcc9]'
                        }`}
                      >
                        <div onClick={(e) => e.stopPropagation()} className="flex items-start">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectQuestionBank(q.id || '')}
                            className="w-5 h-5 rounded border-[#ebdcc9] text-orange-500 focus:ring-orange-400 cursor-pointer"
                          />
                        </div>

                        <div className="flex-1 space-y-2.5 text-left">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                              {q.title}
                            </h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              q.difficulty === 'Dễ' 
                                ? 'bg-green-100 text-green-700' 
                                : q.difficulty === 'Khó' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctIndex;
                              const prefix = String.fromCharCode(65 + oIdx);
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                                    isCorrect 
                                      ? 'bg-emerald-500 text-white shadow-sm' 
                                      : 'bg-[#faf6f0] text-amber-950 border border-[#ebdcc9]'
                                  }`}
                                >
                                  <span className="opacity-90">{prefix}. {opt}</span>
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <p className="text-[10px] text-slate-500 font-medium italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100/70">
                              💡 {q.explanation}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 pt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>📂 {q.category}</span>
                            <span>•</span>
                            <span>👤 {q.authorId === 'system' ? 'Mặc định' : 'Tự tạo'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-[#fef9f3] p-5 border-t-2 border-[#fbe9d0] flex justify-end items-center gap-3 rounded-b-[28px]">
              <button
                onClick={() => {
                  setShowBankPopup(false);
                  triggerSound('click');
                }}
                className="px-6 py-3 bg-white border-2 border-[#ebdcc9] text-amber-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm hover:bg-[#faf6f0] transition active:scale-95 cursor-pointer border-0"
              >
                Hủy
              </button>
              
              <button
                onClick={handleAddSelectedQuestions}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer border-0"
              >
                <CheckCircle className="w-4 h-4" />
                Thêm câu đã chọn
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
