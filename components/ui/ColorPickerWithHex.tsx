import React, { useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerWithHexProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export const ColorPickerWithHex: React.FC<ColorPickerWithHexProps> = ({ value, onChange, label }) => {
  const [showPicker, setShowPicker] = useState(false);
  const swatchRef = useRef<HTMLDivElement>(null);
  const safeHex = /^#([0-9A-Fa-f]{6})$/.test(value) ? value : '#000000';

  // Close popover on outside click
  React.useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (swatchRef.current && !swatchRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', width: 220 }}>
      <div
        ref={swatchRef}
        onClick={() => setShowPicker(v => !v)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: safeHex,
          border: '1.5px solid #ccc',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, ''))}
        maxLength={7}
        style={{
          width: '100%',
          fontSize: 20,
          padding: '6px 12px',
          border: '1.5px solid #e0e0e0',
          borderRadius: 10,
          outline: 'none',
        }}
        placeholder="#000000"
      />
      {showPicker && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 48,
            zIndex: 100,
            background: '#fff',
            border: '1.5px solid #e0e0e0',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            padding: 12,
          }}
        >
          <HexColorPicker color={safeHex} onChange={onChange} style={{ width: 180, height: 120 }} />
        </div>
      )}
    </div>
  );
};

export default ColorPickerWithHex; 