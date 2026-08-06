import React from 'react';

export const BeeFloralWreathRing: React.FC<{ className?: string }> = ({ 
  className = "absolute -inset-2.5 pointer-events-none z-10 w-[calc(100%+20px)] h-[calc(100%+20px)] -translate-x-[10px] -translate-y-[10px]" 
}) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="wreath-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodOpacity="0.18" floodColor="#1e293b" />
        </filter>
        <linearGradient id="bee-wing-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      <g filter="url(#wreath-drop-shadow)">
        {/* Main circular vine stem */}
        <circle cx="60" cy="60" r="43" stroke="#4ade80" strokeWidth="1.8" fill="none" strokeDasharray="100 4 60 4" />
        <circle cx="60" cy="60" r="44.5" stroke="#16a34a" strokeWidth="0.9" fill="none" opacity="0.6" />

        {/* Leaves along the vine circle */}
        {/* Top-right leaves */}
        <path d="M 82,27 Q 89,22 92,28 Q 85,32 82,27 Z" fill="#4ade80" stroke="#16a34a" strokeWidth="0.5" />
        <path d="M 94,39 Q 101,36 102,43 Q 95,45 94,39 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />
        
        {/* Right leaves */}
        <path d="M 102,61 Q 108,67 102,72 Q 98,66 102,61 Z" fill="#86efac" stroke="#16a34a" strokeWidth="0.5" />
        <path d="M 95,80 Q 101,86 95,91 Q 91,84 95,80 Z" fill="#4ade80" stroke="#15803d" strokeWidth="0.5" />

        {/* Bottom leaves */}
        <path d="M 79,96 Q 81,104 75,105 Q 73,97 79,96 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 58,104 Q 56,111 50,108 Q 53,102 58,104 Z" fill="#86efac" stroke="#16a34a" strokeWidth="0.5" />
        <path d="M 39,99 Q 33,104 29,98 Q 35,95 39,99 Z" fill="#4ade80" stroke="#15803d" strokeWidth="0.5" />

        {/* Left leaves */}
        <path d="M 21,83 Q 14,86 15,79 Q 21,78 21,83 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 15,59 Q 8,57 10,51 Q 16,54 15,59 Z" fill="#86efac" stroke="#16a34a" strokeWidth="0.5" />
        <path d="M 20,38 Q 14,34 19,29 Q 23,34 20,38 Z" fill="#4ade80" stroke="#15803d" strokeWidth="0.5" />

        {/* Decorative Vines and Swirls */}
        <path d="M 88,30 C 94,24 98,30 93,34" fill="none" stroke="#16a34a" strokeWidth="0.8" />
        <path d="M 24,85 C 17,89 14,82 20,79" fill="none" stroke="#16a34a" strokeWidth="0.8" />

        {/* COLORFUL FLOWERS AROUND THE WREATH RING */}
        {/* 1. Purple Blossom (Top Right ~ 1:30 o'clock) */}
        <g transform="translate(88, 31)">
          <g fill="#c084fc" stroke="#7e22ce" strokeWidth="0.4">
            <circle cx="0" cy="-4.5" r="2.8" />
            <circle cx="4.3" cy="-1.3" r="2.8" />
            <circle cx="2.7" cy="3.6" r="2.8" />
            <circle cx="-2.7" cy="3.6" r="2.8" />
            <circle cx="-4.3" cy="-1.3" r="2.8" />
          </g>
          <circle cx="0" cy="0" r="2.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
        </g>

        {/* 2. Pink Flower (Right ~ 3:30 o'clock) */}
        <g transform="translate(101, 51)">
          <g fill="#f472b6" stroke="#be185d" strokeWidth="0.4">
            <circle cx="0" cy="-3.8" r="2.4" />
            <circle cx="3.6" cy="-1.1" r="2.4" />
            <circle cx="2.2" cy="3" r="2.4" />
            <circle cx="-2.2" cy="3" r="2.4" />
            <circle cx="-3.6" cy="-1.1" r="2.4" />
          </g>
          <circle cx="0" cy="0" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
        </g>

        {/* 3. Red/Coral Flower (Bottom Right ~ 4:30 o'clock) */}
        <g transform="translate(92, 76)">
          <g fill="#fb7185" stroke="#e11d48" strokeWidth="0.4">
            <circle cx="0" cy="-4" r="2.6" />
            <circle cx="3.8" cy="-1.2" r="2.6" />
            <circle cx="2.4" cy="3.2" r="2.6" />
            <circle cx="-2.4" cy="3.2" r="2.6" />
            <circle cx="-3.8" cy="-1.2" r="2.6" />
          </g>
          <circle cx="0" cy="0" r="2.3" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
        </g>

        {/* 4. Blue/Cyan Flower (Bottom ~ 6 o'clock) */}
        <g transform="translate(60, 102)">
          <g fill="#38bdf8" stroke="#0369a1" strokeWidth="0.4">
            <circle cx="0" cy="-4.2" r="2.6" />
            <circle cx="4" cy="-1.3" r="2.6" />
            <circle cx="2.5" cy="3.3" r="2.6" />
            <circle cx="-2.5" cy="3.3" r="2.6" />
            <circle cx="-4" cy="-1.3" r="2.6" />
          </g>
          <circle cx="0" cy="0" r="2.4" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
        </g>

        {/* 5. Magenta/Violet Flower (Bottom Left ~ 7:30 o'clock) */}
        <g transform="translate(29, 93)">
          <g fill="#e879f9" stroke="#a21caf" strokeWidth="0.4">
            <circle cx="0" cy="-3.8" r="2.3" />
            <circle cx="3.6" cy="-1.1" r="2.3" />
            <circle cx="2.2" cy="3" r="2.3" />
            <circle cx="-2.2" cy="3" r="2.3" />
            <circle cx="-3.6" cy="-1.1" r="2.3" />
          </g>
          <circle cx="0" cy="0" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
        </g>

        {/* 6. Orange Flower (Left ~ 8:30 o'clock) */}
        <g transform="translate(17, 70)">
          <g fill="#fb923c" stroke="#c2410c" strokeWidth="0.4">
            <circle cx="0" cy="-3.6" r="2.2" />
            <circle cx="3.4" cy="-1" r="2.2" />
            <circle cx="2.1" cy="2.8" r="2.2" />
            <circle cx="-2.1" cy="2.8" r="2.2" />
            <circle cx="-3.4" cy="-1" r="2.2" />
          </g>
          <circle cx="0" cy="0" r="1.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
        </g>

        {/* 7. Cyan/Turquoise Flower (Left ~ 10 o'clock) */}
        <g transform="translate(22, 44)">
          <g fill="#2dd4bf" stroke="#0f766e" strokeWidth="0.4">
            <circle cx="0" cy="-3.8" r="2.3" />
            <circle cx="3.6" cy="-1.1" r="2.3" />
            <circle cx="2.2" cy="3" r="2.3" />
            <circle cx="-2.2" cy="3" r="2.3" />
            <circle cx="-3.6" cy="-1.1" r="2.3" />
          </g>
          <circle cx="0" cy="0" r="2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
        </g>

        {/* Small Yellow Daisy Bud (Top Left ~ 11 o'clock) */}
        <g transform="translate(37, 24)">
          <g fill="#fde047" stroke="#ca8a04" strokeWidth="0.4">
            <circle cx="0" cy="-2.6" r="1.6" />
            <circle cx="2.5" cy="-0.8" r="1.6" />
            <circle cx="1.6" cy="2" r="1.6" />
            <circle cx="-1.6" cy="2" r="1.6" />
            <circle cx="-2.5" cy="-0.8" r="1.6" />
          </g>
          <circle cx="0" cy="0" r="1.4" fill="#f59e0b" stroke="#78350f" strokeWidth="0.4" />
        </g>

        {/* HONEY BEE ON TOP-LEFT WREATH (Position: cx=28, cy=18) */}
        <g transform="translate(27, 18) rotate(-15)">
          {/* Antennae */}
          <path d="M -1,-5 Q -4,-10 -7,-9" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M 2,-5 Q 2,-11 0,-11" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="-7" cy="-9" r="0.9" fill="#1e293b" />
          <circle cx="0" cy="-11" r="0.9" fill="#1e293b" />

          {/* Wings */}
          <g transform="translate(-3, -7)">
            <ellipse cx="-4" cy="-3" rx="5.5" ry="3.2" fill="url(#bee-wing-grad)" stroke="#93c5fd" strokeWidth="0.5" transform="rotate(-35)" />
            <ellipse cx="1" cy="-4" rx="5" ry="3" fill="url(#bee-wing-grad)" stroke="#93c5fd" strokeWidth="0.5" transform="rotate(-10)" />
          </g>

          {/* Bee Body (Yellow & Black Striped) */}
          <ellipse cx="0" cy="0" rx="8" ry="6.2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
          {/* Stripes */}
          <path d="M -2.5,-5.5 C -2.5,5.5 -2.5,5.5 -2.5,5.5" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 2,-5.8 C 2,5.8 2,5.8 2,5.8" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />

          {/* Head */}
          <circle cx="-6" cy="-1" r="3.8" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
          {/* Eye */}
          <circle cx="-7.2" cy="-1.8" r="1" fill="#0f172a" />
          <circle cx="-7.5" cy="-2.1" r="0.4" fill="#ffffff" />
          {/* Rosy Cheek */}
          <circle cx="-5.5" cy="0.8" r="1.1" fill="#f43f5e" opacity="0.65" />

          {/* Stinger */}
          <path d="M 8,0 L 11,0.5 L 8,1 Z" fill="#1e293b" />
        </g>
      </g>
    </svg>
  );
};
