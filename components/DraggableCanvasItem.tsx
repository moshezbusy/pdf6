import React from 'react';
import { useDrag } from 'react-dnd';
import { GripHorizontal, Tag, Trash } from 'lucide-react';
import type { CanvasItem, GridCell } from '../types/CanvasItem';
import {
  MousePointerClick,
  Square,
  CircleIcon,
  Type,
  Heading1,
  Heading2,
  ListOrdered,
  Table,
  QrCode,
  FilePenLineIcon as Signature,
  BarChart4,
  FileImage,
  Paperclip,
  Download,
  Share2,
  Move,
} from 'lucide-react';
import { ChartContainer } from './ui/chart';

interface DraggableCanvasItemProps {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  gridToPixel: (gridPos: GridCell) => { x: number; y: number };
  getItemStyles: (item: CanvasItem) => React.CSSProperties;
  GRID_CELL_SIZE: number;
  onResize: (id: string, newColSpan: number, newRowSpan: number) => void;
  onResizeImage?: (id: string, newWidth: number, newHeight: number) => void;
  onEditTableCell?: (row: number, col: number, value: string) => void;
  onDelete?: (id: string) => void;
  onEditText?: (id: string, newText: string) => void;
}

// Helper to convert hex color and opacity to rgba
function hexToRgba(hex: string, opacity: number = 1): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length !== 6) return `rgba(0,0,0,${opacity})`;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

const DraggableCanvasItem: React.FC<DraggableCanvasItemProps> = ({
  item,
  isSelected,
  onSelect,
  gridToPixel,
  getItemStyles,
  GRID_CELL_SIZE,
  onResize,
  onResizeImage,
  onEditTableCell,
  onDelete,
  onEditText,
}) => {
  // Use pixelPosition if available, otherwise fall back to grid
  const left = item.pixelPosition?.x ?? gridToPixel(item.gridPosition).x;
  const top = item.pixelPosition?.y ?? gridToPixel(item.gridPosition).y;

  const textRef = React.useRef<HTMLDivElement>(null);
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'CANVAS_ITEM',
    item: () => {
      // No need to calculate offsetX/offsetY; drop handler uses react-dnd's built-in offset
      (window as any).__currentDragItemId = item.id;
      return {
        type: 'CANVAS_ITEM',
        id: item.id,
        initialGridPosition: item.gridPosition,
      };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: () => {
      // Clean up after drag ends
      (window as any).__currentDragItemId = undefined;
    },
  }), [item.id, JSON.stringify(item.gridPosition)]);

  // Measure text size and update colSpan/rowSpan if needed
  React.useEffect(() => {
    if (textRef.current && (item.type === 'text' || item.type === 'heading1' || item.type === 'heading2')) {
      // Cap width at 600px
      const rect = textRef.current.getBoundingClientRect();
      const cappedWidth = Math.min(rect.width, 600);
      const newColSpan = Math.ceil(cappedWidth / GRID_CELL_SIZE);
      const newRowSpan = Math.ceil(rect.height / GRID_CELL_SIZE);
      if (newColSpan !== item.colSpan || newRowSpan !== item.rowSpan) {
        onResize(item.id, newColSpan, newRowSpan);
      }
    } else if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      const newColSpan = Math.ceil(rect.width / GRID_CELL_SIZE);
      const newRowSpan = Math.ceil(rect.height / GRID_CELL_SIZE);
      if (newColSpan !== item.colSpan || newRowSpan !== item.rowSpan) {
        onResize(item.id, newColSpan, newRowSpan);
      }
    }
    // Only run when content, font, or size changes
  }, [item.content, item.fontFamily, item.fontSize, item.fontWeight, item.isBold, item.isItalic, item.isUnderline, GRID_CELL_SIZE]);

  // Determine style and drag behavior based on locked and visible
  const isLocked = item.locked ?? false;
  const isVisible = item.visible ?? true;

  // Compose style
  const style: React.CSSProperties = {
    left,
    top,
    width: item.width === undefined ? item.colSpan * GRID_CELL_SIZE : (item.width === 'auto' ? 'auto' : item.width),
    height: item.height === undefined ? item.rowSpan * GRID_CELL_SIZE : (item.height === 'auto' ? 'auto' : item.height),
    opacity: isDragging ? 0.5 : 1,
    marginTop: item.margin?.top ?? 0,
    marginRight: item.margin?.right ?? 0,
    marginBottom: item.margin?.bottom ?? 0,
    marginLeft: item.margin?.left ?? 0,
    zIndex: item.zIndex ?? 1,
    transform: `rotate(${item.rotation ?? 0}deg)`,
    display: isVisible ? undefined : 'none',
    cursor: isLocked ? 'default' : 'move',
    ...getItemStyles(item),
  };

  // Only attach dragRef if not locked
  const containerRef = isLocked ? undefined : dragRef;

  // Helper for trash icon
  const TrashButton = isSelected && onDelete && !isLocked ? (
    <button
      type="button"
      style={{
        position: 'absolute',
        left: -28,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        background: 'rgba(255,255,255,0.85)',
        border: 'none',
        borderRadius: 4,
        padding: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Delete Element"
      onClick={e => {
        e.stopPropagation();
        onDelete(item.id);
      }}
    >
      <Trash style={{ width: 16, height: 16, color: '#e11d48' }} />
    </button>
  ) : null;

  // Helper for drag handle (mirrors TrashButton, but on the right)
  const DragHandle = isSelected && !isLocked ? (
    <div
      style={{
        position: 'absolute',
        right: -28,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        background: 'rgba(59,130,246,0.10)',
        border: 'none',
        borderRadius: 4,
        padding: 2,
        boxShadow: '0 1px 4px rgba(59,130,246,0.10)',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#2563eb',
      }}
      aria-label="Drag Element"
    >
      <GripHorizontal style={{ width: 16, height: 16 }} />
    </div>
  ) : null;

  // Render the correct tag for the item type
  if (item.type === 'image') {
    // Helper for handle drag
    const [dragging, setDragging] = React.useState<null | { dir: string, startX: number, startY: number, startW: number, startH: number }>(null);
    const handleMouseDown = (dir: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging({
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: typeof item.width === 'number' ? item.width : 120,
        startH: typeof item.height === 'number' ? item.height : 120,
      });
    };
    React.useEffect(() => {
      if (!dragging) return;
      const onMove = (e: MouseEvent) => {
        let newW = dragging.startW;
        let newH = dragging.startH;
        const dx = e.clientX - dragging.startX;
        const dy = e.clientY - dragging.startY;
        if (dragging.dir.includes('e')) newW = Math.max(20, dragging.startW + dx);
        if (dragging.dir.includes('s')) newH = Math.max(20, dragging.startH + dy);
        if (dragging.dir.includes('w')) newW = Math.max(20, dragging.startW - dx);
        if (dragging.dir.includes('n')) newH = Math.max(20, dragging.startH - dy);
        if (typeof onResizeImage === 'function') onResizeImage(item.id, newW, newH);
      };
      const onUp = () => setDragging(null);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    }, [dragging]);
    // Handle positions
    const handleSize = 10;
    const w = typeof item.width === 'number' ? item.width : 120;
    const h = typeof item.height === 'number' ? item.height : 120;
    const handles = [
      { dir: 'nw', style: { left: -handleSize/2, top: -handleSize/2, cursor: 'nwse-resize' } },
      { dir: 'n',  style: { left: w/2-handleSize/2, top: -handleSize/2, cursor: 'ns-resize' } },
      { dir: 'ne', style: { left: w-handleSize/2, top: -handleSize/2, cursor: 'nesw-resize' } },
      { dir: 'e',  style: { left: w-handleSize/2, top: h/2-handleSize/2, cursor: 'ew-resize' } },
      { dir: 'se', style: { left: w-handleSize/2, top: h-handleSize/2, cursor: 'nwse-resize' } },
      { dir: 's',  style: { left: w/2-handleSize/2, top: h-handleSize/2, cursor: 'ns-resize' } },
      { dir: 'sw', style: { left: -handleSize/2, top: h-handleSize/2, cursor: 'nesw-resize' } },
      { dir: 'w',  style: { left: -handleSize/2, top: h/2-handleSize/2, cursor: 'ew-resize' } },
    ];
    return (
      <div
        ref={containerRef as any}
        className={`absolute bg-transparent border rounded flex items-center justify-center ${isLocked ? '' : 'cursor-move'} ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'}`}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        {item.src ? (
          <img
            src={item.src}
            alt="Image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: item.borderRadius ?? 12,
              opacity: item.opacity ?? 0.8,
              boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.12)',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#e5e7eb',
              borderRadius: item.borderRadius ?? 12,
              opacity: item.opacity ?? 0.8,
              boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: 16,
              pointerEvents: 'none',
            }}
          >
            Image
          </div>
        )}
        {isSelected && !isLocked && handles.map(h => (
          <div
            key={h.dir}
            style={{
              position: 'absolute',
              width: handleSize,
              height: handleSize,
              background: '#fff',
              border: '1px solid #3b82f6',
              borderRadius: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              ...h.style,
              zIndex: 10,
            }}
            onMouseDown={e => handleMouseDown(h.dir, e)}
          />
        ))}
      </div>
    );
  }

  if (item.type === 'rectangle') {
    // Helper for handle drag (reuse image logic)
    const [dragging, setDragging] = React.useState<null | { dir: string, startX: number, startY: number, startW: number, startH: number }>(null);
    const handleMouseDown = (dir: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging({
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: typeof item.width === 'number' ? item.width : 120,
        startH: typeof item.height === 'number' ? item.height : 80,
      });
    };
    React.useEffect(() => {
      if (!dragging) return;
      const onMove = (e: MouseEvent) => {
        let newW = dragging.startW;
        let newH = dragging.startH;
        const dx = e.clientX - dragging.startX;
        const dy = e.clientY - dragging.startY;
        if (dragging.dir.includes('e')) newW = Math.max(20, dragging.startW + dx);
        if (dragging.dir.includes('s')) newH = Math.max(20, dragging.startH + dy);
        if (dragging.dir.includes('w')) newW = Math.max(20, dragging.startW - dx);
        if (dragging.dir.includes('n')) newH = Math.max(20, dragging.startH - dy);
        if (typeof onResizeImage === 'function') onResizeImage(item.id, newW, newH);
      };
      const onUp = () => setDragging(null);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    }, [dragging]);
    // Handle positions
    const handleSize = 10;
    const w = typeof item.width === 'number' ? item.width : 120;
    const h = typeof item.height === 'number' ? item.height : 80;
    const handles = [
      { dir: 'nw', style: { left: -handleSize/2, top: -handleSize/2, cursor: 'nwse-resize' } },
      { dir: 'n',  style: { left: w/2-handleSize/2, top: -handleSize/2, cursor: 'ns-resize' } },
      { dir: 'ne', style: { left: w-handleSize/2, top: -handleSize/2, cursor: 'nesw-resize' } },
      { dir: 'e',  style: { left: w-handleSize/2, top: h/2-handleSize/2, cursor: 'ew-resize' } },
      { dir: 'se', style: { left: w-handleSize/2, top: h-handleSize/2, cursor: 'nwse-resize' } },
      { dir: 's',  style: { left: w/2-handleSize/2, top: h-handleSize/2, cursor: 'ns-resize' } },
      { dir: 'sw', style: { left: -handleSize/2, top: h-handleSize/2, cursor: 'nesw-resize' } },
      { dir: 'w',  style: { left: -handleSize/2, top: h/2-handleSize/2, cursor: 'ew-resize' } },
    ];
    return (
      <div
        ref={containerRef as any}
        className={`absolute bg-transparent flex items-center justify-center ${isLocked ? '' : 'cursor-move'} ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'}`}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: hexToRgba(item.fillColor ?? '#fff', item.fillOpacity ?? 1),
            border: `${item.borderWidth ?? 2}px solid ${hexToRgba(item.borderColor ?? '#000', item.borderOpacity ?? 1)}`,
            borderRadius: item.borderRadius ?? 8,
            boxShadow: item.boxShadow ?? '',
            pointerEvents: 'none',
          }}
        />
        {isSelected && !isLocked && handles.map(h => (
          <div
            key={h.dir}
            style={{
              position: 'absolute',
              width: handleSize,
              height: handleSize,
              background: '#fff',
              border: '1px solid #3b82f6',
              borderRadius: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              ...h.style,
              zIndex: 10,
            }}
            onMouseDown={e => handleMouseDown(h.dir, e)}
          />
        ))}
      </div>
    );
  }

  if (item.type === 'circle') {
    // Helper for handle drag (reuse rectangle logic)
    const [dragging, setDragging] = React.useState<null | { dir: string, startX: number, startY: number, startW: number, startH: number }>(null);
    const handleMouseDown = (dir: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging({
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: typeof item.width === 'number' ? item.width : 120,
        startH: typeof item.height === 'number' ? item.height : 120,
      });
    };
    React.useEffect(() => {
      if (!dragging) return;
      const onMove = (e: MouseEvent) => {
        let newW = dragging.startW;
        let newH = dragging.startH;
        const dx = e.clientX - dragging.startX;
        const dy = e.clientY - dragging.startY;
        if (dragging.dir.includes('e')) newW = Math.max(20, dragging.startW + dx);
        if (dragging.dir.includes('s')) newH = Math.max(20, dragging.startH + dy);
        if (dragging.dir.includes('w')) newW = Math.max(20, dragging.startW - dx);
        if (dragging.dir.includes('n')) newH = Math.max(20, dragging.startH - dy);
        if (typeof onResizeImage === 'function') onResizeImage(item.id, newW, newH);
      };
      const onUp = () => setDragging(null);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    }, [dragging]);
    // Handle positions
    const handleSize = 10;
    const w = typeof item.width === 'number' ? item.width : 120;
    const h = typeof item.height === 'number' ? item.height : 120;
    const handles = [
      { dir: 'nw', style: { left: -handleSize/2, top: -handleSize/2, cursor: 'nwse-resize' } },
      { dir: 'n',  style: { left: w/2-handleSize/2, top: -handleSize/2, cursor: 'ns-resize' } },
      { dir: 'ne', style: { left: w-handleSize/2, top: -handleSize/2, cursor: 'nesw-resize' } },
      { dir: 'e',  style: { left: w-handleSize/2, top: h/2-handleSize/2, cursor: 'ew-resize' } },
      { dir: 'se', style: { left: w-handleSize/2, top: h-handleSize/2, cursor: 'nwse-resize' } },
      { dir: 's',  style: { left: w/2-handleSize/2, top: h-handleSize/2, cursor: 'ns-resize' } },
      { dir: 'sw', style: { left: -handleSize/2, top: h-handleSize/2, cursor: 'nesw-resize' } },
      { dir: 'w',  style: { left: -handleSize/2, top: h/2-handleSize/2, cursor: 'ew-resize' } },
    ];
    return (
      <div
        ref={containerRef as any}
        className={`absolute bg-transparent flex items-center justify-center ${isLocked ? '' : 'cursor-move'} ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'}`}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: hexToRgba(item.fillColor ?? '#fff', item.fillOpacity ?? 1),
            border: `${item.borderWidth ?? 2}px solid ${hexToRgba(item.borderColor ?? '#000', item.borderOpacity ?? 1)}`,
            borderRadius: '50%',
            boxShadow: item.boxShadow ?? '',
            pointerEvents: 'none',
          }}
        />
        {isSelected && !isLocked && handles.map(h => (
          <div
            key={h.dir}
            style={{
              position: 'absolute',
              width: handleSize,
              height: handleSize,
              background: '#fff',
              border: '1px solid #3b82f6',
              borderRadius: 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              ...h.style,
              zIndex: 10,
            }}
            onMouseDown={e => handleMouseDown(h.dir, e)}
          />
        ))}
      </div>
    );
  }

  if (item.type === 'button') {
    // Icon map for extensibility
    const iconMap: Record<string, React.ElementType> = {
      MousePointerClick,
      Square,
      CircleIcon,
      Type,
      Heading1,
      Heading2,
      ListOrdered,
      Table,
      QrCode,
      Signature,
      BarChart4,
      FileImage,
      Paperclip,
      Download,
      Share2,
      Move,
    };
    const Icon = iconMap[item.iconType || 'MousePointerClick'] || MousePointerClick;
    const icon = (
      <Icon
        style={{
          color: item.iconColor || '#fff',
          width: item.iconSize || 20,
          height: item.iconSize || 20,
          flexShrink: 0,
          opacity: typeof item.iconOpacity === 'number' ? item.iconOpacity : 1,
        }}
      />
    );
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.url) {
        window.open(item.url, '_blank');
      }
      onSelect(item.id);
    };
    return (
      <div
        ref={containerRef as any}
        className={`absolute flex items-center justify-center ${isLocked ? '' : 'cursor-move'} ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300 border'} bg-transparent`}
        style={{
          ...style,
          width: item.buttonWidth || 140,
          height: item.buttonHeight || 44,
          borderRadius: item.borderRadius ?? 8,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(37,99,235,0.15)',
          padding: 0,
          background: 'transparent',
        }}
        onClick={handleClick}
      >
        {TrashButton}
        {DragHandle}
        <button
          style={{
            width: '100%',
            height: '100%',
            background: item.buttonColor
              ? (typeof item.buttonOpacity === 'number'
                  ? hexToRgba(item.buttonColor, item.buttonOpacity)
                  : item.buttonColor)
              : '#2563eb',
            color: item.textColor || '#fff',
            border: 'none',
            borderRadius: item.borderRadius ?? 8,
            boxShadow: item.boxShadow ?? '0 2px 8px rgba(37,99,235,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: item.textSize || 16,
            fontWeight: item.fontWeight || 500,
            fontFamily: item.fontFamily || 'inter',
            padding: item.padding
              ? `${item.padding.top ?? 12}px ${item.padding.right ?? 24}px ${item.padding.bottom ?? 12}px ${item.padding.left ?? 24}px`
              : '12px 24px',
            cursor: item.url ? 'pointer' : 'default',
          }}
          tabIndex={-1}
          type="button"
          onClick={item.url ? (e) => { e.stopPropagation(); window.open(item.url, '_blank'); } : undefined}
        >
          {item.iconPosition !== 'right' && icon}
          <span 
            style={{ 
              pointerEvents: 'none',
              color: item.textColor || '#fff',
              fontSize: item.textSize || 16,
              fontFamily: item.fontFamily || 'inter',
              fontWeight: item.fontWeight || 500,
              opacity: typeof item.textOpacity === 'number' ? item.textOpacity : 1,
            }}
          >
            {item.buttonText || 'Click Me'}
          </span>
          {item.iconPosition === 'right' && icon}
        </button>
      </div>
    );
  }

  if (item.type === 'list') {
    // Render a bulleted or numbered list based on listStyle
    const isNumbered = item.listStyle === 'numbered';
    const ListTag = isNumbered ? 'ol' : 'ul';
    return (
      <div
        ref={containerRef as any}
        className={`absolute bg-transparent ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'} ${isLocked ? '' : 'cursor-move'}`}
        style={{
          ...style,
          fontFamily: item.listFontFamily || 'inter',
          fontWeight: item.listFontWeight || 'regular',
          fontSize: item.listFontSize || 16,
          color: item.listFontColor || '#222',
          opacity: item.listOpacity ?? 1,
          padding: 8,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 8,
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        <ListTag style={{ margin: 0, paddingLeft: 24, listStyleType: isNumbered ? 'decimal' : 'disc' }}>
          {item.items && item.items.map((li: string, idx: number) => (
            <li key={idx} style={{ marginBottom: 4 }}>{li}</li>
          ))}
        </ListTag>
      </div>
    );
  }

  if (item.type === 'table') {
    const rows = item.tableRows || (item.tableData ? item.tableData.length : 0);
    const cols = item.tableCols || (item.tableData && item.tableData[0] ? item.tableData[0].length : 0);
    const border = item.tableBorder ?? 1;
    const cellPadding = item.tableCellPadding ?? 4;
    const hasHeader = item.tableHeader ?? true;
    return (
      <div
        ref={containerRef as any}
        className={`absolute bg-transparent ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'} ${isLocked ? '' : 'cursor-move'}`}
        style={{
          ...style,
          width: item.width ? item.width : style.width,
          height: item.height ? item.height : 'auto',
          background: 'transparent',
          padding: 0,
          borderRadius: item.borderRadius ?? 8,
          overflow: 'hidden',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        <table 
          style={{ 
            borderCollapse: 'collapse', 
            width: '100%', 
            height: '100%', 
            tableLayout: 'fixed',
            borderRadius: item.borderRadius ?? 8,
            overflow: 'hidden',
          }}
        >
          <tbody style={item.height ? { height: '100%' } : {}}>
            {item.tableData && item.tableData.map((row: string[], rowIdx: number) => (
              <tr
                key={rowIdx}
                style={{ height: (hasHeader && rowIdx === 0 ? (item.rowHeaderHeight ?? 40) : (item.rowHeight ?? 40)) }}
              >
                {row.map((cell: string, colIdx: number) => (
                  hasHeader && rowIdx === 0 ? (
                    <th
                      key={colIdx}
                      style={{
                        border: `${border}px solid #888`,
                        padding: cellPadding,
                        background: item.headerRowColor ?? '#f3f4f6',
                        fontWeight: item.headerFontWeight ?? 600,
                        fontSize: item.headerFontSize ?? 16,
                        color: item.headerFontColor ?? '#000',
                        height: '100%'
                      }}
                    >
                      {isSelected ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => onEditTableCell && onEditTableCell(rowIdx, colIdx, e.currentTarget.textContent || '')}
                          style={{ outline: 'none', minWidth: 40, textAlign: 'center', fontWeight: 600, background: 'transparent', height: '100%' }}
                        >
                          {cell}
                        </div>
                      ) : (
                        cell
                      )}
                    </th>
                  ) : (
                    <td
                      key={colIdx}
                      style={{
                        border: `${border}px solid #888`,
                        padding: cellPadding,
                        background: '#fff',
                        fontWeight: item.bodyFontWeight ?? 400,
                        fontSize: item.bodyFontSize ?? 16,
                        fontFamily: item.bodyFontFamily ?? 'inter',
                        color: item.bodyFontColor ?? '#000',
                        height: '100%'
                      }}
                    >
                      {isSelected ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => onEditTableCell && onEditTableCell(rowIdx, colIdx, e.currentTarget.textContent || '')}
                          style={{ outline: 'none', minWidth: 40, textAlign: 'center', background: 'transparent', height: '100%' }}
                        >
                          {cell}
                        </div>
                      ) : (
                        cell
                      )}
                    </td>
                  )
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (item.type === 'qrcode') {
    const qrColor = item.qrColor ?? '#222';
    const qrSize = item.qrSize ?? 48;
    const qrLabel = item.qrLabel ?? 'QR Code';
    const qrValue = item.qrValue ?? 'https://example.com';
    return (
      <div
        ref={containerRef as any}
        className={`absolute bg-white flex flex-col items-center justify-center border rounded ${isLocked ? '' : 'cursor-move'} ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'}`}
        style={{
          ...style,
          width: item.width || 120,
          height: item.height || 120,
          borderRadius: item.borderRadius ?? 12,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.12)',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
        title={qrValue}
      >
        {TrashButton}
        {DragHandle}
        {/* Simple QR code placeholder SVG */}
        <svg width={qrSize} height={qrSize} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="12" height="12" rx="2" fill={qrColor}/>
          <rect x="32" y="4" width="12" height="12" rx="2" fill={qrColor}/>
          <rect x="4" y="32" width="12" height="12" rx="2" fill={qrColor}/>
          <rect x="20" y="20" width="8" height="8" rx="1" fill={qrColor}/>
          <rect x="36" y="36" width="4" height="4" rx="1" fill={qrColor}/>
          <rect x="28" y="36" width="4" height="4" rx="1" fill={qrColor}/>
          <rect x="36" y="28" width="4" height="4" rx="1" fill={qrColor}/>
        </svg>
        <span style={{ marginTop: 12, fontSize: 16, color: '#222', fontFamily: 'inter' }}>{qrLabel}</span>
      </div>
    );
  }

  if (item.type === 'signature') {
    const color = item.signatureColor || '#222';
    const size = item.signatureSize || 1.8;
    return (
      <div
        ref={containerRef as any}
        className={`absolute flex flex-col items-center justify-center bg-white border rounded shadow ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'} ${isLocked ? '' : 'cursor-move'}`}
        style={{
          ...style,
          width: item.width || 180,
          height: item.height || 100,
          borderRadius: item.borderRadius ?? 12,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.12)',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        <svg
          width="90%"
          height="60%"
          viewBox="0 0 300 100"
          style={{ display: 'block' }}
        >
          {item.signatureData ? (
            <path d={item.signatureData} stroke={color} strokeWidth={size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            // Sample signature path (stylized)
            <path
              d="M10,80 Q52,10 90,80 T170,80 Q210,10 250,80"
              stroke={color}
              strokeWidth={size}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <span className="text-xs text-gray-400 mt-1">Signature</span>
      </div>
    );
  }

  if (item.type === 'chart') {
    // Extract chart properties with defaults
    const chartTemplate = item.chartTemplate || 'bar';
    const chartColors = item.chartColors || { barColor: '#60a5fa', backgroundColor: '#fff' };
    const chartWidth = typeof item.width === 'number' ? item.width : 240;
    const chartHeight = typeof item.height === 'number' ? item.height : 160;
    
    // Helper SVGs for each chart type
    const renderBarChart = () => (
      <svg width={chartWidth * 0.9} height={chartHeight * 0.6} viewBox="0 0 120 60" style={{ background: chartColors.backgroundColor }}>
        <rect x="10" y="30" width="15" height="20" fill={chartColors.barColor} />
        <rect x="35" y="20" width="15" height="30" fill={chartColors.barColor} />
        <rect x="60" y="10" width="15" height="40" fill={chartColors.barColor} />
        <rect x="85" y="25" width="15" height="25" fill={chartColors.barColor} />
      </svg>
    );
    const renderLineChart = () => (
      <svg width={chartWidth * 0.9} height={chartHeight * 0.6} viewBox="0 0 120 60" style={{ background: chartColors.backgroundColor }}>
        <polyline
          fill="none"
          stroke={chartColors.barColor}
          strokeWidth="3"
          points="10,50 35,30 60,40 85,20 110,35"
        />
        <circle cx="10" cy="50" r="3" fill={chartColors.barColor} />
        <circle cx="35" cy="30" r="3" fill={chartColors.barColor} />
        <circle cx="60" cy="40" r="3" fill={chartColors.barColor} />
        <circle cx="85" cy="20" r="3" fill={chartColors.barColor} />
        <circle cx="110" cy="35" r="3" fill={chartColors.barColor} />
      </svg>
    );
    const renderPieChart = () => (
      <svg width={chartWidth * 0.9} height={chartHeight * 0.6} viewBox="0 0 60 60" style={{ background: chartColors.backgroundColor }}>
        <circle cx="30" cy="30" r="28" fill="#e5e7eb" />
        <path d="M30,30 L30,2 A28,28 0 0,1 58,30 Z" fill={chartColors.barColor} />
        <path d="M30,30 L58,30 A28,28 0 0,1 30,58 Z" fill="#3b82f6" />
        <path d="M30,30 L30,58 A28,28 0 0,1 2,30 Z" fill="#2563eb" />
        <path d="M30,30 L2,30 A28,28 0 0,1 30,2 Z" fill="#1e40af" />
      </svg>
    );
    let chartSVG;
    if (chartTemplate === 'bar') chartSVG = renderBarChart();
    else if (chartTemplate === 'line') chartSVG = renderLineChart();
    else if (chartTemplate === 'pie') chartSVG = renderPieChart();
    else chartSVG = renderBarChart(); // fallback

    return (
      <div
        ref={containerRef as any}
        className={`absolute flex items-center justify-center bg-white border rounded shadow ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'} ${isLocked ? '' : 'cursor-move'}`}
        style={{
          ...style,
          width: chartWidth,
          height: chartHeight,
          borderRadius: item.borderRadius ?? 12,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.12)',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {DragHandle}
        {chartSVG}
        <span className="text-xs text-gray-400 mt-1 absolute bottom-2 left-1/2 -translate-x-1/2">Chart</span>
      </div>
    );
  }

  if (item.type === 'logo') {
    const backgroundOpacity = typeof item.backgroundOpacity === 'number' ? item.backgroundOpacity : 1;
    return (
      <div
        ref={containerRef as any}
        className={`absolute flex flex-col items-center justify-center border rounded ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'} ${isLocked ? '' : 'cursor-move'}`}
        style={{
          ...style,
          width: item.width || 120,
          height: item.height || 90,
          borderRadius: item.borderRadius ?? 12,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.08)',
          background: 'transparent',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {/* Background layer with opacity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `rgba(255,255,255,${backgroundOpacity})`,
            borderRadius: item.borderRadius ?? 12,
            zIndex: 0,
          }}
        />
        {/* Logo image or placeholder */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          {item.src ? (
            <img
              src={item.src}
              alt="Logo"
              style={{
                maxWidth: '90%',
                maxHeight: '80%',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          ) : (
            <>
              <FileImage style={{ width: 32, height: 32, color: '#222', marginBottom: 8 }} />
              <span style={{ fontSize: 18, color: '#222', fontFamily: 'inter', fontWeight: 500 }}>Logo</span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (item.type === 'attachment') {
    // Icon map for extensibility
    const iconMap: Record<string, React.ElementType> = {
      Paperclip,
      FileImage,
      Download,
      Share2,
      Move,
      GripHorizontal,
    };
    const Icon = iconMap[item.iconType || 'Paperclip'] || Paperclip;
    const iconColor = item.iconColor || '#222';
    const iconSize = item.iconSize || 32;
    const content = item.content || 'Attachment';
    const textColor = item.textColor || '#222';
    const textSize = item.textSize || 18;
    const fontFamily = item.fontFamily || 'inter';
    const fontWeightMap: Record<string, number> = {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    };
    const fontWeight = fontWeightMap[item.fontWeight || 'regular'] || 400;
    const label = (
      <>
        <Icon style={{ width: iconSize, height: iconSize, color: iconColor, marginBottom: 8 }} />
        <span style={{ fontSize: textSize, color: textColor, fontFamily, fontWeight }}>{content}</span>
      </>
    );
    return (
      <div
        ref={containerRef as any}
        className={`absolute flex flex-col items-center justify-center border rounded ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'} bg-white`}
        style={{
          ...style,
          width: item.width || 120,
          height: item.height || 90,
          borderRadius: item.borderRadius ?? 12,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.08)',
          cursor: isLocked ? 'default' : 'move',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {label}
          </a>
        ) : label}
      </div>
    );
  }

  if (item.type === 'variableField') {
    return (
      <div
        ref={containerRef as any}
        className={`absolute flex flex-col items-center justify-center border rounded ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'}`}
        style={{
          ...style,
          width: item.width || 120,
          height: item.height || 60,
          borderRadius: item.borderRadius ?? 8,
          boxShadow: item.boxShadow ?? '0 2px 8px rgba(0,0,0,0.08)',
          cursor: isLocked ? 'default' : 'move',
          background: 'transparent',
        }}
        onClick={e => {
          e.stopPropagation();
          onSelect(item.id);
        }}
      >
        {TrashButton}
        <span>
          {`{${item.variableName || 'variable'}}`}
        </span>
      </div>
    );
  }

  let ContentTag: React.ElementType = 'div';
  if (item.type === 'heading1') ContentTag = 'h1';
  else if (item.type === 'heading2') ContentTag = 'h2';

  return (
    <div
      ref={containerRef as any}
      className={`absolute bg-transparent border rounded flex items-center justify-center ${isLocked ? '' : 'cursor-move'} ${isSelected ? 'border-blue-500 border-2' : 'border-gray-300'}`}
      style={{
        ...style,
        width: 'fit-content',
        maxWidth: 600,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    >
      {TrashButton}
      {DragHandle}
      <ContentTag
        ref={textRef}
        contentEditable={isSelected && !isLocked}
        suppressContentEditableWarning
        spellCheck={false}
        style={{
          width: 'fit-content',
          height: 'fit-content',
          paddingTop: item.padding?.top ?? 0,
          paddingRight: item.padding?.right ?? 0,
          paddingBottom: item.padding?.bottom ?? 0,
          paddingLeft: item.padding?.left ?? 0,
          whiteSpace: 'pre-line',
          maxWidth: 600,
          outline: 'none',
          cursor: isSelected && !isLocked ? 'text' : 'default',
          pointerEvents: isSelected && !isLocked ? 'auto' : 'none',
        }}
        onBlur={e => {
          if (isSelected && !isLocked && typeof onEditText === 'function') {
            onEditText(item.id, e.currentTarget.innerText || '');
          }
        }}
      >
        {item.content}
      </ContentTag>
    </div>
  );
};

export default DraggableCanvasItem; 