import React from 'react';

export const HoneyBeeCardFrameDecoration: React.FC = () => (
  <svg 
    className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden rounded-3xl" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="honey-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.18" floodColor="#78350f" />
      </filter>
    </defs>

    {/* Outer Scalloped Edge Yellow Border */}
    <rect x="0" y="0" width="100%" height="100%" rx="24" fill="#facc15" />

    {/* Scallop Circles along top/bottom/left/right borders */}
    <g fill="#facc15" stroke="#eab308" strokeWidth="0.5">
      <circle cx="10%" cy="0" r="6" />
      <circle cx="25%" cy="0" r="6" />
      <circle cx="40%" cy="0" r="6" />
      <circle cx="55%" cy="0" r="6" />
      <circle cx="70%" cy="0" r="6" />
      <circle cx="85%" cy="0" r="6" />

      <circle cx="10%" cy="100%" r="6" />
      <circle cx="25%" cy="100%" r="6" />
      <circle cx="40%" cy="100%" r="6" />
      <circle cx="55%" cy="100%" r="6" />
      <circle cx="70%" cy="100%" r="6" />
      <circle cx="85%" cy="100%" r="6" />

      <circle cx="0" cy="15%" r="6" />
      <circle cx="0" cy="35%" r="6" />
      <circle cx="0" cy="55%" r="6" />
      <circle cx="0" cy="75%" r="6" />
      <circle cx="0" cy="90%" r="6" />

      <circle cx="100%" cy="15%" r="6" />
      <circle cx="100%" cy="35%" r="6" />
      <circle cx="100%" cy="55%" r="6" />
      <circle cx="100%" cy="75%" r="6" />
      <circle cx="100%" cy="90%" r="6" />
    </g>

    {/* White Inner Card Area */}
    <rect 
      x="5" 
      y="5" 
      width="calc(100% - 10px)" 
      height="calc(100% - 10px)" 
      rx="20" 
      fill="#FFFFFF" 
    />

    {/* Dashed Golden Yellow Inner Border */}
    <rect 
      x="10" 
      y="10" 
      width="calc(100% - 20px)" 
      height="calc(100% - 20px)" 
      rx="16" 
      fill="none" 
      stroke="#f59e0b" 
      strokeWidth="2" 
      strokeDasharray="5 3.5" 
      opacity="0.85"
    />

    {/* TOP-RIGHT: Branch & Hanging Beehive */}
    <g transform="translate(100%, 0)" filter="url(#honey-drop-shadow)">
      <g transform="translate(-46, 5)">
        {/* Branch */}
        <path d="M 10,-2 Q -15,10 -38,6" fill="none" stroke="#4d7c0f" strokeWidth="2.5" strokeLinecap="round" />
        {/* Leaves */}
        <path d="M -10,3 Q -6,-3 -8,-8 Q -15,-4 -10,3 Z" fill="#84cc16" stroke="#3f6212" strokeWidth="0.5" />
        <path d="M -22,6 Q -20,-1 -24,-6 Q -30,0 -22,6 Z" fill="#84cc16" stroke="#3f6212" strokeWidth="0.5" />
        <path d="M -34,6 Q -38,1 -36,-5 Q -42,2 -34,6 Z" fill="#65a30d" stroke="#3f6212" strokeWidth="0.5" />
        
        {/* String */}
        <line x1="-18" y1="8" x2="-18" y2="16" stroke="#92400e" strokeWidth="1.2" />

        {/* Beehive */}
        <g transform="translate(-18, 15)">
          <ellipse cx="0" cy="0" rx="8" ry="3.5" fill="#fde047" stroke="#d97706" strokeWidth="0.8" />
          <ellipse cx="0" cy="3.5" rx="10.5" ry="4" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
          <ellipse cx="0" cy="7.5" rx="11" ry="4.5" fill="#fde047" stroke="#d97706" strokeWidth="0.8" />
          <ellipse cx="0" cy="11.5" rx="9.5" ry="4" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
          <ellipse cx="0" cy="15" rx="6.5" ry="3" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
          {/* Hole */}
          <ellipse cx="0" cy="7.5" rx="3" ry="3.5" fill="#451a03" />
        </g>
      </g>
    </g>

    {/* BOTTOM-LEFT: Honey Pot & Dipper */}
    <g transform="translate(0, 100%)" filter="url(#honey-drop-shadow)">
      <g transform="translate(7, -42)">
        {/* Dipper stick */}
        <line x1="10" y1="14" x2="26" y2="-2" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="24" cy="0" rx="2.5" ry="3.5" fill="#d97706" transform="rotate(40 24 0)" />
        
        {/* Pot Body */}
        <path d="M 6,12 C 4,20 6,31 15,33 C 24,33 26,20 24,12 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
        {/* Rim */}
        <rect x="4" y="9" width="20" height="4" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        {/* Dripping honey */}
        <path d="M 5,13 C 8,18 10,15 13,19 C 15,21 17,14 21,17 C 22,18 23,14 24,13 Z" fill="#fde047" stroke="#eab308" strokeWidth="0.6" />
      </g>
    </g>

    {/* BOTTOM-RIGHT: White Daisy Flowers */}
    <g transform="translate(100%, 100%)" filter="url(#honey-drop-shadow)">
      <g transform="translate(-8, -8)">
        {/* Daisy 1 (Bottom Right big) */}
        <g transform="translate(-16, -16)">
          <g fill="#FFFFFF" stroke="#94a3b8" strokeWidth="0.4">
            <circle cx="0" cy="-6" r="2.2" />
            <circle cx="4.2" cy="-4.2" r="2.2" />
            <circle cx="6" cy="0" r="2.2" />
            <circle cx="4.2" cy="4.2" r="2.2" />
            <circle cx="0" cy="6" r="2.2" />
            <circle cx="-4.2" cy="4.2" r="2.2" />
            <circle cx="-6" cy="0" r="2.2" />
            <circle cx="-4.2" cy="-4.2" r="2.2" />
          </g>
          <circle cx="0" cy="0" r="2.8" fill="#f59e0b" stroke="#b45309" strokeWidth="0.4" />
        </g>

        {/* Daisy 2 (Upper right flower) */}
        <g transform="translate(-8, -30)">
          <g fill="#FFFFFF" stroke="#94a3b8" strokeWidth="0.4">
            <circle cx="0" cy="-4.5" r="1.8" />
            <circle cx="3.2" cy="-3.2" r="1.8" />
            <circle cx="4.5" cy="0" r="1.8" />
            <circle cx="3.2" cy="3.2" r="1.8" />
            <circle cx="0" cy="4.5" r="1.8" />
            <circle cx="-3.2" cy="3.2" r="1.8" />
            <circle cx="-4.5" cy="0" r="1.8" />
            <circle cx="-3.2" cy="-3.2" r="1.8" />
          </g>
          <circle cx="0" cy="0" r="2.2" fill="#f59e0b" stroke="#b45309" strokeWidth="0.4" />
        </g>

        {/* Daisy 3 (Lower left flower) */}
        <g transform="translate(-32, -10)">
          <g fill="#FFFFFF" stroke="#94a3b8" strokeWidth="0.4">
            <circle cx="0" cy="-4.5" r="1.8" />
            <circle cx="3.2" cy="-3.2" r="1.8" />
            <circle cx="4.5" cy="0" r="1.8" />
            <circle cx="3.2" cy="3.2" r="1.8" />
            <circle cx="0" cy="4.5" r="1.8" />
            <circle cx="-3.2" cy="3.2" r="1.8" />
            <circle cx="-4.5" cy="0" r="1.8" />
            <circle cx="-3.2" cy="-3.2" r="1.8" />
          </g>
          <circle cx="0" cy="0" r="2.2" fill="#f59e0b" stroke="#b45309" strokeWidth="0.4" />
        </g>

        {/* Daisy 4 (Middle connector flower) */}
        <g transform="translate(-20, -28)">
          <g fill="#FFFFFF" stroke="#94a3b8" strokeWidth="0.4">
            <circle cx="0" cy="-3.8" r="1.5" />
            <circle cx="2.7" cy="-2.7" r="1.5" />
            <circle cx="3.8" cy="0" r="1.5" />
            <circle cx="2.7" cy="2.7" r="1.5" />
            <circle cx="0" cy="3.8" r="1.5" />
            <circle cx="-2.7" cy="2.7" r="1.5" />
            <circle cx="-3.8" cy="0" r="1.5" />
            <circle cx="-2.7" cy="-2.7" r="1.5" />
          </g>
          <circle cx="0" cy="0" r="1.8" fill="#f59e0b" stroke="#b45309" strokeWidth="0.4" />
        </g>
      </g>
    </g>
  </svg>
);
