import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  color: string;
  size: number;
  onSave: (svgPath: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ color, size, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  // Responsive width
  const [canvasWidth, setCanvasWidth] = useState(220);
  const [canvasHeight, setCanvasHeight] = useState(80);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      setCanvasWidth(width);
    }
  }, []);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const { x, y } = getCanvasPos(e);
    setPoints([{ x, y }]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const { x, y } = getCanvasPos(e);
    setPoints((pts) => [...pts, { x, y }]);
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const last = points[points.length - 1];
      if (last) ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clear = () => {
    setPoints([]);
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  // Convert points to SVG path
  const getSvgPath = () => {
    if (points.length === 0) return '';
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L${points[i].x},${points[i].y}`;
    }
    return d;
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 220 }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ width: '100%', height: 80, border: '1px solid #ccc', borderRadius: 8, background: '#fff', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 24, justifyContent: 'center', width: '100%' }}>
        <button type="button" onClick={clear} style={{ padding: '4px 12px' }}>Clear</button>
        <button type="button" onClick={() => onSave(getSvgPath())} style={{ padding: '4px 12px' }}>Save</button>
      </div>
    </div>
  );
};

export default SignaturePad; 