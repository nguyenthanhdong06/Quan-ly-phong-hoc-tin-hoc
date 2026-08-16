import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface VietnameseDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (newDate: string) => void;
  label?: string;
  className?: string;
}

export const VietnameseDatePicker: React.FC<VietnameseDatePickerProps> = ({
  value,
  onChange,
  label,
  className = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format YYYY-MM-DD -> DD/MM/YYYY
  const displayFormattedDate = React.useMemo(() => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return value;
  }, [value]);

  const handleClick = () => {
    if (inputRef.current) {
      if ('showPicker' in inputRef.current && typeof (inputRef.current as any).showPicker === 'function') {
        try {
          (inputRef.current as any).showPicker();
          return;
        } catch (e) {}
      }
      inputRef.current.focus();
      inputRef.current.click();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center gap-2 bg-white/90 border border-[#cbb89d] px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer hover:bg-white hover:border-emerald-600 transition-all relative select-none shadow-2xs ${className}`}
    >
      {label && <span className="text-slate-700 whitespace-nowrap font-bold">{label}</span>}
      
      <span className="font-black text-slate-900 font-mono tracking-wide text-xs flex items-center gap-1.5 bg-amber-100/80 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
        <span>{displayFormattedDate || 'DD/MM/YYYY'}</span>
        <Calendar className="w-3.5 h-3.5 text-amber-800 shrink-0" />
      </span>

      {/* Hidden Native Input Date to open browser native calendar picker */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
      />
    </div>
  );
};
