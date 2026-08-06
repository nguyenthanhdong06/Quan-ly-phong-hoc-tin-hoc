import React from 'react';

export const CyberRobotCardFrameDecoration: React.FC = () => (
  <svg 
    className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden rounded-[26px]" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Outer Blue 3D Frame Gradient */}
      <linearGradient id="cyber-frame-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="35%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>

      {/* Inner Ice Blue Canvas Gradient */}
      <linearGradient id="cyber-ice-canvas" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0f9ff" />
        <stop offset="60%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#dbeafe" />
      </linearGradient>

      {/* Robot Body White Gradient */}
      <linearGradient id="robot-white-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="80%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>

      {/* Robot Blue Armor Gradient */}
      <linearGradient id="robot-blue-armor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>

      {/* Robot Visor / Face Gradient */}
      <linearGradient id="robot-visor-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>

      {/* Microchip Center Die Gradient */}
      <linearGradient id="chip-die-cyan" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>

      {/* Soft Drop Shadow for 3D elements */}
      <filter id="cyber-3d-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" floodColor="#0369a1" />
      </filter>
    </defs>

    {/* Outer 3D Bevelled Cyan/Blue Border Frame */}
    <rect x="0" y="0" width="100%" height="100%" rx="24" fill="url(#cyber-frame-grad)" />

    {/* Top Glossy Edge Highlight */}
    <path d="M 24 3 L calc(100% - 24) 3" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

    {/* Inner Ice Canvas */}
    <rect 
      x="5" 
      y="5" 
      width="calc(100% - 10px)" 
      height="calc(100% - 10px)" 
      rx="20" 
      fill="url(#cyber-ice-canvas)" 
      stroke="#7dd3fc"
      strokeWidth="1.2"
    />

    {/* Subtle Cyber Grid / Circuit Line on Canvas */}
    <rect 
      x="9" 
      y="9" 
      width="calc(100% - 18px)" 
      height="calc(100% - 18px)" 
      rx="16" 
      fill="none" 
      stroke="#0284c7" 
      strokeWidth="1" 
      strokeDasharray="5 3" 
      opacity="0.35"
    />

    {/* TOP-RIGHT: Cyber Circuit Board Traces & Nodes */}
    <g transform="translate(100%, 0)">
      <g transform="translate(0, 0)">
        {/* Primary Circuit Path */}
        <path d="M -12,12 L -42,12 L -62,32 L -62,65" stroke="#0284c7" strokeWidth="1.8" fill="none" opacity="0.8" />
        <circle cx="-12" cy="12" r="2.5" fill="#38bdf8" />
        <circle cx="-62" cy="65" r="2.5" fill="#0284c7" />

        {/* Secondary Parallel Path */}
        <path d="M -12,20 L -34,20 L -48,34 L -48,50" stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.75" />
        <circle cx="-48" cy="50" r="2" fill="#38bdf8" />

        {/* Tertiary Branch */}
        <path d="M -12,28 L -24,28 L -34,38 L -34,80" stroke="#0284c7" strokeWidth="1" fill="none" opacity="0.6" />
        <circle cx="-34" cy="80" r="2" fill="#0284c7" />

        {/* Small Node Array */}
        <circle cx="-20" cy="45" r="1.8" fill="#38bdf8" opacity="0.8" />
        <circle cx="-14" cy="55" r="1.8" fill="#38bdf8" opacity="0.8" />
      </g>
    </g>

    {/* BOTTOM-RIGHT: 3D Microchip / Processor IC */}
    <g transform="translate(100%, 100%)" filter="url(#cyber-3d-shadow)">
      <g transform="translate(-32, -32)">
        {/* Traces leading to chip */}
        <path d="M -18,2 L -45,2 L -58,-11 L -75,-11" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle cx="-75" cy="-11" r="2.2" fill="#38bdf8" />

        <path d="M -18,-6 L -38,-6 L -50,-18 L -64,-18" stroke="#0284c7" strokeWidth="1.2" fill="none" opacity="0.6" />
        <circle cx="-64" cy="-18" r="1.8" fill="#0284c7" />

        {/* Microchip Body */}
        <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
        
        {/* Glowing Die Center */}
        <rect x="-9" y="-9" width="18" height="18" rx="3" fill="url(#chip-die-cyan)" stroke="#38bdf8" strokeWidth="1" />
        <rect x="-5" y="-5" width="10" height="10" rx="1.5" fill="#38bdf8" opacity="0.6" />

        {/* Metallic Pins (8 pins total) */}
        {/* Top Pins */}
        <rect x="-8" y="-20" width="4" height="5" rx="1" fill="#0284c7" />
        <rect x="4" y="-20" width="4" height="5" rx="1" fill="#0284c7" />
        {/* Bottom Pins */}
        <rect x="-8" y="15" width="4" height="5" rx="1" fill="#0284c7" />
        <rect x="4" y="15" width="4" height="5" rx="1" fill="#0284c7" />
        {/* Left Pins */}
        <rect x="-20" y="-8" width="5" height="4" rx="1" fill="#0284c7" />
        <rect x="-20" y="4" width="5" height="4" rx="1" fill="#0284c7" />
        {/* Right Pins */}
        <rect x="15" y="-8" width="5" height="4" rx="1" fill="#0284c7" />
        <rect x="15" y="4" width="5" height="4" rx="1" fill="#0284c7" />
      </g>
    </g>

    {/* BOTTOM-LEFT: Waving 3D Cute White & Blue Robot */}
    <g transform="translate(0, 100%)" filter="url(#cyber-3d-shadow)">
      <g transform="translate(28, -26)">
        {/* Feet */}
        <ellipse cx="-7" cy="18" rx="5" ry="3" fill="url(#robot-blue-armor)" />
        <ellipse cx="7" cy="18" rx="5" ry="3" fill="url(#robot-blue-armor)" />

        {/* Main Body */}
        <ellipse cx="0" cy="8" rx="14" ry="12" fill="url(#robot-white-body)" stroke="#cbd5e1" strokeWidth="1" />
        {/* Chest Plate / Belly Accent */}
        <ellipse cx="0" cy="10" rx="7" ry="5" fill="url(#robot-blue-armor)" />

        {/* Head */}
        <rect x="-13" y="-18" width="26" height="19" rx="9" fill="url(#robot-white-body)" stroke="#cbd5e1" strokeWidth="1" />
        
        {/* Visor / Shield */}
        <rect x="-9" y="-15" width="18" height="12" rx="6" fill="url(#robot-visor-grad)" />
        
        {/* Glowing Cyan Eyes */}
        <ellipse cx="-4" cy="-9" rx="2.5" ry="3" fill="#38bdf8" />
        <ellipse cx="4" cy="-9" rx="2.5" ry="3" fill="#38bdf8" />
        <ellipse cx="-3.5" cy="-9.5" rx="1" ry="1.2" fill="#ffffff" />
        <ellipse cx="4.5" cy="-9.5" rx="1" ry="1.2" fill="#ffffff" />

        {/* Cute Smile Line */}
        <path d="M -3,-5 Q 0,-3 3,-5" stroke="#38bdf8" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Antenna */}
        <line x1="0" y1="-18" x2="0" y2="-23" stroke="#0284c7" strokeWidth="2" />
        <circle cx="0" cy="-24" r="2.5" fill="#38bdf8" />

        {/* Blue Ear Caps */}
        <rect x="-15" y="-14" width="3.5" height="8" rx="1.5" fill="url(#robot-blue-armor)" />
        <rect x="11.5" y="-14" width="3.5" height="8" rx="1.5" fill="url(#robot-blue-armor)" />

        {/* Left Arm (resting) */}
        <ellipse cx="-13" cy="8" rx="3.5" ry="5.5" fill="url(#robot-blue-armor)" transform="rotate(15 -13 8)" />

        {/* Right Arm (Waving friendly salute!) */}
        <path d="M 12,6 Q 20,2 22,-8" stroke="#0284c7" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="-9" r="4.5" fill="url(#robot-blue-armor)" />
        <circle cx="19" cy="-11" r="2" fill="url(#robot-blue-armor)" />
      </g>
    </g>

  </svg>
);
