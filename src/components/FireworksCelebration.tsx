import React, { useEffect, useRef } from 'react';
import { Sparkles, Award } from 'lucide-react';
import { Student } from '../types';

// Deterministic helper to get a cute avatar based on student's ID/name
const getStudentAvatar = (studentId: string, allStudents?: Student[]) => {
  const avatars = [
    { emoji: "🐼", bg: "bg-indigo-50 border-indigo-100" },
    { emoji: "🐰", bg: "bg-emerald-50 border-emerald-100" },
    { emoji: "🦁", bg: "bg-amber-50 border-amber-100" },
    { emoji: "🦊", bg: "bg-orange-50 border-orange-100" },
    { emoji: "🐯", bg: "bg-yellow-50 border-yellow-100" },
    { emoji: "🐨", bg: "bg-slate-100/80 border-slate-200" },
    { emoji: "🐸", bg: "bg-green-50 border-green-100" },
    { emoji: "🐷", bg: "bg-pink-50 border-pink-100" },
    { emoji: "🐻", bg: "bg-amber-100/60 border-amber-200" },
    { emoji: "🦉", bg: "bg-purple-50 border-purple-100" },
    { emoji: "🐱", bg: "bg-rose-50 border-rose-100" },
    { emoji: "🐶", bg: "bg-blue-50 border-blue-100" },
    { emoji: "🐧", bg: "bg-slate-100/80 border-slate-200"},
    { emoji: "🐻‍❄️", bg: "bg-rose-50 border-rose-200"},
    { emoji: "🦄", bg: "bg-rose-50 border-rose-100"},
    { emoji: "🐺", bg: "bg-slate-100/80 border-slate-200"},
    { emoji: "🦝", bg: "bg-slate-100/80 border-slate-200"},
    { emoji: "🐹", bg: "bg-rose-50 border-rose-100"},
    { emoji: "🐭", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐮", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐴", bg: "bg-amber-100/60 border-amber-200"},
    { emoji: "🐳", bg: "bg-blue-50 border-blue-100"},
    { emoji: "🐋", bg: "bg-blue-50 border-blue-100"},
    { emoji: "🐙", bg: "bg-pink-50 border-pink-100"},
    { emoji: "🦑", bg: "bg-orange-50 border-orange-100"},
    { emoji: "🦀", bg: "bg-blue-50 border-pink-100"},
    { emoji: "🦚", bg: "bg-green-50 border-green-100"},
    { emoji: "🦧", bg: "bg-blue-50 border-blue-100"},
    { emoji: "🕊️", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐞", bg: "bg-amber-50 border-amber-100"},
    { emoji: "🦋", bg: "bg-amber-50 border-amber-100"},
    { emoji: "🐝", bg: "bg-yellow-50 border-yellow-100"},
    { emoji: "🦗", bg: "bg-amber-50 border-amber-100"},
    { emoji: "🪲", bg: "bg-green-50 border-green-100"},
    { emoji: "🪰", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🕷️", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🦂", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🦖", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🦕", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐲", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐔", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐓", bg: "bg-emerald-50 border-emerald-100"}
  ];

  if (allStudents && allStudents.length > 0) {
    const sorted = [...allStudents].sort((a, b) => a.id.localeCompare(b.id));
    const index = sorted.findIndex(s => s.id === studentId);
    if (index !== -1) {
      return avatars[index % avatars.length];
    }
  }

  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 20) - hash);
  }
  hash = Math.abs(hash);

  return avatars[hash % avatars.length];
};

// 3D Pixel Sticker Component to render gorgeous glossy cute animal badges
const StickerAvatar = ({ emoji, studentId, size = 'w-24 h-24', className = '', avatarUrl }: { emoji: string; studentId: string; size?: string; className?: string; avatarUrl?: string }) => {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const gradientBgs = [
    'from-[#5cd6ff] via-[#38bcf2] to-[#1294d9]', // Soft Sky Blue
    'from-[#6be4a0] via-[#4fd087] to-[#2cb46a]', // Fresh Emerald Mint
    'from-[#ff8cb8] via-[#f7629b] to-[#dc3a74]', // Candy Strawberry Pink
    'from-[#ffb443] via-[#f8951d] to-[#d67200]', // Warm Honey Orange
    'from-[#ab8fff] via-[#8565f4] to-[#6039e1]', // Cosmic Violet Indigo
    'from-[#ffd93d] via-[#fbc118] to-[#e0a000]', // Golden Sunny Yellow
    'from-[#4ade80] via-[#22c55e] to-[#15803d]', // Bright Garden Green
    'from-[#f472b6] via-[#ec4899] to-[#be185d]', // Flamingo Pink
    'from-[#fb7185] via-[#f43f5e] to-[#be123c]', // Coral Rose Red
    'from-[#38bdf8] via-[#0ea5e9] to-[#0369a1]', // Oceanic Deep Blue
  ];

  const currentGradient = gradientBgs[hash % gradientBgs.length];

  return (
    <div className={`relative rounded-full aspect-square flex items-center justify-center border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.25),0_2px_5px_rgba(0,0,0,0.15)] bg-gradient-to-tr ${currentGradient} select-none overflow-hidden ${size} ${className}`}>
      
      {/* 3D Pixel grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-12 mix-blend-overlay pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(45deg, #000 25%, transparent 25%), 
            linear-gradient(-45deg, #000 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #000 75%), 
            linear-gradient(-45deg, transparent 75%, #000 75%)
          `,
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
        }}
      />

      {/* Inner radial shading to enhance the 3D globe/lens effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.22)_100%)] mix-blend-multiply pointer-events-none rounded-full" />
      <div className="absolute inset-1 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.40)_0%,transparent_55%)] pointer-events-none rounded-full" />

      {/* Retro digital scanlines for game-aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_50%,rgba(0,0,0,0.06)_50%)] bg-[length:100%_4px] pointer-events-none" />

      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-[85%] h-[85%] object-cover rounded-full relative z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span 
          className="text-[1.85em] relative z-10 leading-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] saturate-120 contrast-105 select-none pointer-events-none transform scale-110"
          style={{
            imageRendering: 'pixelated',
          }}
        >
          {emoji}
        </span>
      )}

      {/* Glossy epoxy dome reflection (top-half crescent) */}
      <div className="absolute top-[2px] left-[3%] right-[3%] h-[38%] bg-gradient-to-b from-white/35 via-white/8 to-transparent rounded-full opacity-90 pointer-events-none z-20" />
      
      {/* 3D glint dot reflection */}
      <div className="absolute top-[12%] left-[22%] w-2 h-2 bg-white/75 rounded-full blur-[0.2px] pointer-events-none z-20" />

      {/* Inner circular outline layer */}
      <div className="absolute inset-0.5 rounded-full border border-white/15 pointer-events-none z-10" />
    </div>
  );
};

interface FireworksCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentClass?: string;
  badgeName: string;
  students?: Student[];
}

export default function FireworksCelebration({
  isOpen,
  onClose,
  studentId,
  studentName,
  studentClass,
  badgeName,
  students,
}: FireworksCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Color palette for fireworks (vibrant, neon and bright pastel colors)
    const colors = [
      '#FF2A6D', // neon rose
      '#05D9E8', // neon cyan
      '#01012B', // midnight
      '#F5A623', // gold/amber
      '#7ED321', // green apple
      '#B8E986', // light lime
      '#D0021B', // deep red
      '#BD10E0', // magenta
      '#9013FE', // purple
      '#50E3C2', // mint
      '#FF4A00', // bright orange
      '#FFD700', // yellow gold
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      decay: number;
      color: string;
      size: number;
      gravity: number;
      friction: number;
    }

    interface FireworkShell {
      x: number;
      y: number;
      tx: number;
      ty: number;
      vx: number;
      vy: number;
      color: string;
      trail: { x: number; y: number }[];
      trailLength: number;
      progress: number;
      speed: number;
    }

    const particles: Particle[] = [];
    const shells: FireworkShell[] = [];

    // Create a fireworks explosion
    const explode = (x: number, y: number, color: string) => {
      const count = 100 + Math.floor(Math.random() * 60);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2; // initial explosive speed
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 1.5,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008,
          color,
          size: Math.random() * 2.5 + 1,
          gravity: 0.12,
          friction: 0.96,
        });
      }

      // Add a few sparkling crackling secondary gold particles
      const goldCount = 20;
      for (let i = 0; i < goldCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
          color: '#FFE875', // Sparkling gold
          size: Math.random() * 1.5 + 0.5,
          gravity: 0.18,
          friction: 0.94,
        });
      }
    };

    // Spawn a shell from bottom to top
    const spawnShell = (forceX?: number) => {
      const startX = forceX !== undefined ? forceX : Math.random() * (width * 0.8) + width * 0.1;
      const targetX = startX + (Math.random() - 0.5) * 150;
      const targetY = Math.random() * (height * 0.45) + height * 0.1; // explode in upper half
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const angle = Math.atan2(targetY - height, targetX - startX);
      const dist = Math.hypot(targetX - startX, targetY - height);
      const speed = dist / (45 + Math.random() * 15); // frame count to reach target

      shells.push({
        x: startX,
        y: height,
        tx: targetX,
        ty: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        trail: [],
        trailLength: 6 + Math.floor(Math.random() * 6),
        progress: 0,
        speed,
      });
    };

    // Initial launch of multiple fireworks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (isOpen) spawnShell();
      }, i * 450);
    }

    // Auto launcher timer
    const intervalId = setInterval(() => {
      if (shells.length < 4) {
        spawnShell();
      }
    }, 900);

    // Animation Loop
    const loop = () => {
      ctx.fillStyle = 'rgba(7, 10, 24, 0.28)'; // semi-transparent to create long gorgeous trails
      ctx.fillRect(0, 0, width, height);

      // 1. Update & Draw Shells
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        
        // Save trail
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > s.trailLength) {
          s.trail.shift();
        }

        // Draw trail
        ctx.beginPath();
        if (s.trail.length > 1) {
          ctx.moveTo(s.trail[0].x, s.trail[0].y);
          for (let k = 1; k < s.trail.length; k++) {
            ctx.lineTo(s.trail[k].x, s.trail[k].y);
          }
        } else {
          ctx.moveTo(s.x, s.y);
        }
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Move shell
        s.x += s.vx;
        s.y += s.vy;

        // Draw spark head
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();

        // Check if reached target
        if (s.y <= s.ty || s.vy >= 0) {
          explode(s.x, s.y, s.color);
          shells.splice(i, 1);
        }
      }

      // 2. Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Add a brilliant glow effect to the sparks
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      // 3. Fallback/continuous background sparkle rain (confetti)
      if (Math.random() < 0.15) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(Math.random() * width, Math.random() * (height * 0.5), Math.random() * 4 + 2, Math.random() * 4 + 2);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const avatar = getStudentAvatar(studentId, students);
  const matchedStudent = students.find(s => s.id === studentId);
  const avatarUrl = matchedStudent?.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-slate-950/80 backdrop-blur-xs font-sans">
      {/* Absolute background canvas for full screen fireworks */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Foreground celebration modal */}
      <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center border-2 border-amber-300 shadow-[0_20px_50px_rgba(251,191,36,0.35)] transform transition-all duration-500 scale-100 animate-fadeIn z-10 space-y-6">
        
        {/* Decorative corner sparkles */}
        <div className="absolute -top-6 -left-6 bg-amber-500 text-white p-3 rounded-full border-4 border-white shadow-lg animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="absolute -bottom-4 -right-4 bg-amber-500 text-white p-2.5 rounded-full border-4 border-white shadow-lg animate-pulse">
          <Award className="w-5 h-5" />
        </div>

        {/* Shiny congratulations title banner */}
        <div className="space-y-1">
          <div className="inline-block bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-3xs border border-yellow-300 animate-pulse">
            ✨ VINH DANH DANH HIỆU ✨
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-600 leading-tight">
            CHÚC MỪNG BÉ!
          </h2>
        </div>

        {/* Central 3D pixel sticker & student identity showcase */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-2 bg-gradient-to-tr from-amber-50 to-orange-50 rounded-full border border-amber-100 shadow-inner">
            <StickerAvatar emoji={avatar.emoji} studentId={studentId} size="w-24 h-24" avatarUrl={avatarUrl} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {studentName}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Lớp: {studentClass || 'Tin Học'}
            </p>
          </div>
        </div>

        {/* Award detail box */}
        <div className="bg-gradient-to-tr from-amber-50/70 to-yellow-50/70 border border-amber-100/80 p-4 rounded-2xl text-center space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4 select-none">
            <span className="text-8xl">👑</span>
          </div>

          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Đã ghi nhận phần thưởng</span>
          <div className="text-base font-black text-amber-700 flex items-center justify-center gap-1.5 leading-none">
            <span>🎉</span>
            <span>{badgeName}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold italic">
            Xứng đáng với sự tích lũy nỗ lực và chăm ngoan vàng!
          </p>
        </div>

        {/* Interactive sound/vibes click dismiss action */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black py-3 px-6 rounded-2xl shadow-md border-b-4 border-amber-700 hover:border-amber-800 active:border-b-2 active:translate-y-0.5 transition-all text-sm uppercase tracking-wider cursor-pointer"
        >
          Hoàn tất ghi nhận ⭐
        </button>
      </div>
    </div>
  );
}
