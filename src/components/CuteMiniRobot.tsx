import React from 'react';

interface CuteMiniRobotProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function CuteMiniRobot({ className = '', style }: CuteMiniRobotProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className} 
      style={style}
      id="cute-mini-robot-svg"
    >
      {/* Background soft shadow for the entire character */}
      <ellipse cx="50" cy="95" rx="24" ry="4" fill="#000000" opacity="0.08" />

      {/* Heart Antenna */}
      {/* Antenna stem */}
      <line x1="50" y1="12" x2="50" y2="28" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      {/* Antenna heart on top */}
      <path 
        d="M50 13.5 C49 10.5, 45 10.5, 45 14 C45 17.5, 50 21, 50 21 C50 21, 55 17.5, 55 14 C55 10.5, 51 10.5, 50 13.5 Z" 
        fill="#ff6b8b" 
        stroke="#ffffff" 
        strokeWidth="0.75" 
      />

      {/* Ears/Headphones (Behind Head) */}
      {/* Left ear */}
      <rect x="18" y="42" width="8" height="18" rx="4" fill="#ff8da1" />
      <circle cx="22" cy="51" r="3" fill="#ffffff" />
      {/* Right ear */}
      <rect x="74" y="42" width="8" height="18" rx="4" fill="#ff8da1" />
      <circle cx="78" cy="51" r="3" fill="#ffffff" />

      {/* Head */}
      <rect 
        x="24" 
        y="26" 
        width="52" 
        height="44" 
        rx="20" 
        fill="#ffffff" 
        stroke="#e2e8f0" 
        strokeWidth="2" 
      />
      {/* Head highlight for 3D look */}
      <path d="M34 29 Q50 27 66 29" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Face Screen */}
      <rect 
        x="29" 
        y="32" 
        width="42" 
        height="32" 
        rx="14" 
        fill="#1e293b" 
      />
      
      {/* Face Screen Details (Eyes, Cheeks, Mouth) */}
      {/* Left eye (Glowing pink oval) */}
      <ellipse cx="39" cy="46" rx="4.5" ry="6.5" fill="#ff8da1" />
      <circle cx="37.5" cy="44" r="1.5" fill="#ffffff" /> {/* Light reflection inside eye */}
      
      {/* Right eye (Glowing pink oval) */}
      <ellipse cx="61" cy="46" rx="4.5" ry="6.5" fill="#ff8da1" />
      <circle cx="59.5" cy="44" r="1.5" fill="#ffffff" /> {/* Light reflection inside eye */}
      
      {/* Mouth (Smiling arc) */}
      <path 
        d="M47 50 Q50 53 53 50" 
        stroke="#ff8da1" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Left cheek blush */}
      <circle cx="34" cy="52" r="3" fill="#ff8da1" opacity="0.5" />
      
      {/* Right cheek blush */}
      <circle cx="66" cy="52" r="3" fill="#ff8da1" opacity="0.5" />

      {/* Body (Behind arms) */}
      <rect 
        x="34" 
        y="66" 
        width="32" 
        height="24" 
        rx="11" 
        fill="#ffffff" 
        stroke="#e2e8f0" 
        strokeWidth="2" 
      />
      
      {/* Heart on Chest */}
      <path 
        d="M50 73 C49 71, 46 71, 46 74 C46 76.5, 50 79, 50 79 C50 79, 54 76.5, 54 74 C54 71, 51 71, 50 73 Z" 
        fill="#ff6b8b" 
      />

      {/* Left Arm - Waving (Robot's right arm) */}
      <g transform="translate(34, 72) rotate(-55)">
        <rect 
          x="-8" 
          y="-18" 
          width="10" 
          height="22" 
          rx="5" 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          strokeWidth="2" 
        />
        {/* Pink pad hand */}
        <circle cx="-3" cy="-14" r="3.5" fill="#ff8da1" />
        <circle cx="-3" cy="-14" r="1.5" fill="#ffffff" opacity="0.7" />
      </g>
      
      {/* Right Arm - Resting (Robot's left arm) */}
      <g transform="translate(66, 72) rotate(35)">
        <rect 
          x="-2" 
          y="-2" 
          width="10" 
          height="22" 
          rx="5" 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          strokeWidth="2" 
        />
        {/* Pink pad hand */}
        <circle cx="3" cy="16" r="3.5" fill="#ff8da1" />
      </g>

      {/* Legs */}
      {/* Left Leg */}
      <rect 
        x="38" 
        y="87" 
        width="10" 
        height="7" 
        rx="3" 
        fill="#ffffff" 
        stroke="#e2e8f0" 
        strokeWidth="1.5" 
      />
      <ellipse cx="43" cy="93.5" rx="6" ry="2" fill="#ff8da1" />
      
      {/* Right Leg */}
      <rect 
        x="52" 
        y="87" 
        width="10" 
        height="7" 
        rx="3" 
        fill="#ffffff" 
        stroke="#e2e8f0" 
        strokeWidth="1.5" 
      />
      <ellipse cx="57" cy="93.5" rx="6" ry="2" fill="#ff8da1" />
    </svg>
  );
}
