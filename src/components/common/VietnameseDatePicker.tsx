import React, { useRef, useState, useEffect } from 'react';
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

  // Convert YYYY-MM-DD -> DD/MM/YYYY for text display/input
  const formatYMDtoDMY = (ymd: string): string => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return ymd;
  };

  // Convert DD/MM/YYYY or D/M/YYYY -> YYYY-MM-DD
  const parseDMYtoYMD = (dmy: string): string | null => {
    if (!dmy) return null;
    const cleanStr = dmy.trim().replace(/[-.]/g, '/');
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      const rawDay = parts[0];
      const rawMonth = parts[1];
      const year = parts[2];
      
      // Strict check: year must be 4 digits, day & month must be valid numbers
      if (year.length === 4 && rawDay.length >= 1 && rawMonth.length >= 1) {
        const dNum = Number(rawDay);
        const mNum = Number(rawMonth);
        const yNum = Number(year);

        if (!isNaN(dNum) && !isNaN(mNum) && !isNaN(yNum)) {
          if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31 && yNum >= 1900 && yNum <= 2100) {
            const formattedDay = String(dNum).padStart(2, '0');
            const formattedMonth = String(mNum).padStart(2, '0');
            return `${year}-${formattedMonth}-${formattedDay}`;
          }
        }
      }
    }
    return null;
  };

  // Local text input state for typing directly
  const [inputText, setInputText] = useState(() => formatYMDtoDMY(value));
  const [isFocused, setIsFocused] = useState(false);

  // Keep inputText in sync when value prop changes, BUT ONLY when not actively focused by user
  useEffect(() => {
    if (!isFocused) {
      setInputText(formatYMDtoDMY(value));
    }
  }, [value, isFocused]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Try parsing as user types complete date
    const parsedYMD = parseDMYtoYMD(val);
    if (parsedYMD && parsedYMD !== value) {
      onChange(parsedYMD);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleTextBlur = () => {
    setIsFocused(false);
    // If text is valid on blur, apply and format
    const parsedYMD = parseDMYtoYMD(inputText);
    if (parsedYMD) {
      onChange(parsedYMD);
      setInputText(formatYMDtoDMY(parsedYMD));
    } else {
      // Revert back to current valid value if text left incomplete or invalid
      setInputText(formatYMDtoDMY(value));
    }
  };

  const handleOpenCalendarPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) {
      if ('showPicker' in inputRef.current && typeof (inputRef.current as any).showPicker === 'function') {
        try {
          (inputRef.current as any).showPicker();
          return;
        } catch (err) {}
      }
      inputRef.current.focus();
      inputRef.current.click();
    }
  };

  return (
    <div className={`flex items-center gap-2 bg-white/90 border border-[#cbb89d] px-3 py-1.5 rounded-xl text-xs font-semibold select-none shadow-2xs hover:border-emerald-600 transition-all ${className}`}>
      {label && <span className="text-slate-700 whitespace-nowrap font-bold">{label}</span>}
      
      <div className="flex items-center bg-amber-100/80 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs focus-within:ring-2 focus-within:ring-amber-400 focus-within:bg-white transition-all">
        {/* Feature 1: Editable text input for typing DD/MM/YYYY directly */}
        <input
          type="text"
          value={inputText}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleTextBlur}
          placeholder="DD/MM/YYYY"
          maxLength={10}
          className="w-24 bg-transparent border-none text-slate-900 font-extrabold font-mono tracking-wide text-xs focus:outline-none focus:ring-0 text-center"
          title="Nhập trực tiếp ngày tháng theo định dạng DD/MM/YYYY (ví dụ: 16/08/2026)"
        />

        {/* Feature 2: Calendar icon button to pop up native date picker */}
        <button
          type="button"
          onClick={handleOpenCalendarPicker}
          className="p-1 hover:bg-amber-200/80 active:scale-95 rounded-md transition-all cursor-pointer text-amber-800 hover:text-amber-950 flex items-center justify-center relative"
          title="Nhấp chuột vào biểu tượng lịch để chọn ngày tháng từ bộ lịch"
        >
          <Calendar className="w-4 h-4 shrink-0" />

          {/* Hidden Native Input Date positioned under button */}
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => {
              if (e.target.value) {
                onChange(e.target.value);
              }
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
          />
        </button>
      </div>
    </div>
  );
};
