"use client"

import { useState, useEffect, useRef } from "react"
import {
  ImageIcon,
  Type,
  Square,
  CircleIcon,
  MousePointerClick,
  Heading1,
  Heading2,
  ListOrdered,
  Table,
  QrCode,
  FilePenLineIcon as Signature,
  BarChart4,
  FileImage,
  Paperclip,
  ChevronDown,
  Settings,
  Save,
  Download,
  Share2,
  Move,
  GripHorizontal,
  Tag,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDrag, useDrop, DragSourceMonitor, DropTargetMonitor, ConnectDragSource, ConnectDropTarget } from 'react-dnd'
import DraggableCanvasItem from './DraggableCanvasItem'
import { useDrag as useDndDrag } from 'react-dnd'
import ColorPickerWithHex from "@/components/ui/ColorPickerWithHex"
import type { CanvasItem, GridCell } from '@/types/CanvasItem'
import SignaturePad from "./SignaturePad";
import React from "react";
import TemplatesPage from "@/components/TemplatesPage";
import html2canvas from "html2canvas";

const DRAG_TYPE = 'TEXT_BLOCK'
const CANVAS_ITEM_TYPE = 'CANVAS_ITEM'
const GRID_CELL_SIZE = 20 // Size of each grid cell in pixels
const CANVAS_WIDTH = 600 // A4 width approximation
const CANVAS_HEIGHT = 840 // A4 height approximation
const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_CELL_SIZE)
const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_CELL_SIZE)

// Font weight mapping
const fontWeightMap: Record<string, number> = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Helper to calculate table height
function calculateTableHeight(rowHeaderHeight: number, rowHeight: number, numRows: number) {
  return rowHeaderHeight + (Math.max(numRows - 1, 0) * rowHeight);
}

export default function PDFBuilderClient({ template }: { template: any }) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>("text")
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([])
  const [isOverCanvas, setIsOverCanvas] = useState(false)
  const [gridOccupancy, setGridOccupancy] = useState<boolean[][]>(
    Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false))
  )
  const [dragPreview, setDragPreview] = useState<GridCell | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isDraggingCanvasItem, setIsDraggingCanvasItem] = useState(false)
  const [activeTab, setActiveTab] = useState("editor");
  const [saveStatus, setSaveStatus] = useState('idle');
  const [templateName, setTemplateName] = useState("");
  const [settingsTab, setSettingsTab] = useState('style');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Initialize state from template prop
  useEffect(() => {
    if (template) {
      setTemplateName(template.name || "Untitled Template");
      setCanvasItems(template.data?.canvasItems || []);
    }
  }, [template]);

  // Get the selected item from canvasItems
  const selectedItem = selectedItemId ? canvasItems.find(item => item.id === selectedItemId) : null;

  // Element dimensions in grid cells
  const elementSizes = {
    text: { colSpan: 6, rowSpan: 2 },
    heading1: { colSpan: 8, rowSpan: 2 },
    heading2: { colSpan: 7, rowSpan: 2 },
    image: { colSpan: 8, rowSpan: 6 },
    list: { colSpan: 8, rowSpan: 4 },
    table: { colSpan: 2, rowSpan: 3 },
    signature: { colSpan: 4, rowSpan: 2 },
    chart: { colSpan: 4, rowSpan: 3 },
    logo: { colSpan: 4, rowSpan: 3 }, // Add logo size
  }

  const blocks = [
    { id: "text", name: "Text", icon: Type },
    { id: "variableField", name: "Variable Field", icon: Tag },
    { id: "heading1", name: "Heading 1", icon: Heading1 },
    { id: "heading2", name: "Heading 2", icon: Heading2 },
    { id: "image", name: "Image", icon: ImageIcon },
    { id: "rectangle", name: "Rectangle", icon: Square },
    { id: "circle", name: "Circle", icon: CircleIcon },
    { id: "button", name: "Button", icon: MousePointerClick },
    { id: "list", name: "List", icon: ListOrdered },
    { id: "table", name: "Table", icon: Table },
    { id: "qrcode", name: "QR Code", icon: QrCode },
    { id: "signature", name: "Signature", icon: Signature },
    { id: "chart", name: "Chart", icon: BarChart4 },
    { id: "logo", name: "Logo", icon: FileImage },
    { id: "attachment", name: "Attachment", icon: Paperclip },
  ]

  // Update grid occupancy whenever canvas items change
  useEffect(() => {
    // Reset grid
    const newGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false))
    
    // Mark occupied cells
    canvasItems.forEach(item => {
      const { row, col } = item.gridPosition
      
      for (let r = 0; r < item.rowSpan; r++) {
        for (let c = 0; c < item.colSpan; c++) {
          if (row + r < GRID_ROWS && col + c < GRID_COLS) {
            newGrid[row + r][col + c] = true
          }
        }
      }
    })
    
    setGridOccupancy(newGrid)
  }, [canvasItems])

  // Convert pixel coordinates to grid cell position
  const pixelToGrid = (x: number, y: number): GridCell => {
    return {
      col: Math.floor(x / GRID_CELL_SIZE),
      row: Math.floor(y / GRID_CELL_SIZE)
    }
  }

  // Check if a grid area is available
  const isAreaAvailable = (row: number, col: number, rowSpan: number, colSpan: number, excludeItemId?: string): boolean => {
    // Check boundaries
    if (row < 0 || col < 0 || row + rowSpan > GRID_ROWS || col + colSpan > GRID_COLS) {
      return false
    }
    
    // If we're moving an existing item, we need to exclude its current position from the occupancy check
    if (excludeItemId) {
      // Create a temporary grid that doesn't include the item being moved
      const tempGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false))
      
      canvasItems.forEach(item => {
        if (item.id !== excludeItemId) {
          const { row, col } = item.gridPosition
          
          for (let r = 0; r < item.rowSpan; r++) {
            for (let c = 0; c < item.colSpan; c++) {
              if (row + r < GRID_ROWS && col + c < GRID_COLS) {
                tempGrid[row + r][col + c] = true
              }
            }
          }
        }
      })
      
      // Check if any cell in the area is occupied
      for (let r = 0; r < rowSpan; r++) {
        for (let c = 0; c < colSpan; c++) {
          if (tempGrid[row + r][col + c]) {
            return false
          }
        }
      }
      
      return true
    }
    
    // Normal check if not moving an existing item
    for (let r = 0; r < rowSpan; r++) {
      for (let c = 0; c < colSpan; c++) {
        if (gridOccupancy[row + r][col + c]) {
          return false
        }
      }
    }
    
    return true
  }

  // Find the next available position for an element
  const findAvailablePosition = (colSpan: number, rowSpan: number): GridCell | null => {
    // Try each cell as a potential top-left corner
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (isAreaAvailable(row, col, rowSpan, colSpan)) {
          return { row, col }
        }
      }
    }
    
    return null; // No space available
  }

  // Find the nearest available position to the given position
  const findNearestAvailablePosition = (
    startRow: number, 
    startCol: number, 
    rowSpan: number, 
    colSpan: number,
    excludeItemId?: string
  ): GridCell => {
    // First check if the exact position is available
    if (isAreaAvailable(startRow, startCol, rowSpan, colSpan, excludeItemId)) {
      return { row: startRow, col: startCol }
    }
    
    // If not, search in expanding squares around the target position
    const maxDistance = Math.max(GRID_ROWS, GRID_COLS)
    
    for (let distance = 1; distance < maxDistance; distance++) {
      // Check cells at 'distance' away from start position
      for (let offset = -distance; offset <= distance; offset++) {
        // Check top and bottom rows of the square
        const locations = [
          // Top row
          { row: startRow - distance, col: startCol + offset },
          // Bottom row
          { row: startRow + distance, col: startCol + offset },
          // Left column (excluding corners already checked)
          { row: startRow + offset, col: startCol - distance },
          // Right column (excluding corners already checked)
          { row: startRow + offset, col: startCol + distance }
        ]
        
        for (const { row, col } of locations) {
          if (isAreaAvailable(row, col, rowSpan, colSpan, excludeItemId)) {
            return { row, col }
          }
        }
      }
    }
    
    // Fallback - find any available position
    const fallbackPosition = findAvailablePosition(colSpan, rowSpan)
    return fallbackPosition || { row: 0, col: 0 }
  }
  
  // Handle selecting a canvas item
  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
  };

  // Update a property of the selected canvas item
  const updateSelectedItem = (updates: Partial<CanvasItem>) => {
    if (!selectedItemId) return;
    
    setCanvasItems(items => 
      items.map(item => 
        item.id === selectedItemId ? { ...item, ...updates } : item
      )
    );
  };

  // Update the position of a canvas item
  const updateItemPosition = (id: string, newPosition: GridCell) => {
    setCanvasItems(items => 
      items.map(item => 
        item.id === id ? { ...item, gridPosition: newPosition } : item
      )
    );
  };

  // Add handler to update colSpan and rowSpan
  const handleResizeItem = (id: string, newColSpan: number, newRowSpan: number) => {
    setCanvasItems(items =>
      items.map(item =>
        item.id === id ? { ...item, colSpan: newColSpan, rowSpan: newRowSpan } : item
      )
    );
  };

  // Add this function inside PDFBuilderClient
  const handleResizeImage = (id: string, newWidth: number, newHeight: number) => {
    setCanvasItems(items =>
      items.map(item =>
        item.id === id ? { ...item, width: newWidth, height: newHeight } : item
      )
    );
  };

  // Drop target for canvas
  const [{ isOver }, drop] = useDrop({
    accept: ['text', 'heading1', 'heading2', 'image', 'rectangle', 'circle', 'button', 'list', 'table', 'qrcode', 'signature', 'chart', 'logo', 'attachment', 'variableField', CANVAS_ITEM_TYPE],
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item: any, monitor) => {
      setIsOverCanvas(true)
      const offset = monitor.getClientOffset()
      const canvasRect = document.getElementById('pdf-canvas')?.getBoundingClientRect()
      if (offset && canvasRect) {
        const x = offset.x - canvasRect.left
        const y = offset.y - canvasRect.top
        // Update drag preview position
        const gridPos = pixelToGrid(x, y)
        setDragPreview(gridPos)
      }
    },
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset()
      const canvasRect = document.getElementById('pdf-canvas')?.getBoundingClientRect()
      if (!offset || !canvasRect) return
      // Calculate drop position relative to canvas
      const x = offset.x - canvasRect.left
      const y = offset.y - canvasRect.top
      // Convert to grid position
      const gridPos = pixelToGrid(x, y)
      if (item.type === CANVAS_ITEM_TYPE) {
        // We're moving an existing item
        const canvasItem = canvasItems.find(ci => ci.id === item.id)
        if (canvasItem) {
          const position = findNearestAvailablePosition(
            gridPos.row,
            gridPos.col,
            canvasItem.rowSpan,
            canvasItem.colSpan,
            canvasItem.id
          )
          updateItemPosition(canvasItem.id, position)
        }
      } else if (['text', 'heading1', 'heading2', 'image', 'rectangle', 'circle', 'button', 'list', 'table', 'qrcode', 'signature', 'chart', 'logo', 'attachment', 'variableField'].includes(item.type)) {
        // We're adding a new item from the sidebar
        const { colSpan, rowSpan } = elementSizes[item.type as keyof typeof elementSizes] || elementSizes.text;
        const position = findNearestAvailablePosition(
          gridPos.row, 
          gridPos.col, 
          rowSpan, 
          colSpan
        );
        const id = `item-${Date.now()}`;
        let newItem: CanvasItem;
        if (item.type === 'heading1') {
          newItem = {
            type: 'heading1',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            content: 'Heading 1',
            fontFamily: 'inter',
            fontSize: 32,
            fontWeight: 'bold',
            color: '#000000',
            isBold: true,
            isItalic: false,
            isUnderline: false,
            textAlign: 'left',
          };
        } else if (item.type === 'heading2') {
          newItem = {
            type: 'heading2',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            content: 'Heading 2',
            fontFamily: 'inter',
            fontSize: 24,
            fontWeight: 'semibold',
            color: '#000000',
            isBold: true,
            isItalic: false,
            isUnderline: false,
            textAlign: 'left',
          };
        } else if (item.type === 'image') {
          newItem = {
            type: 'image',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            src: undefined,
            borderRadius: 12,
            opacity: 0.8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            width: undefined,
            height: undefined,
            zIndex: 1,
            rotation: 0,
            visible: true,
            locked: false,
          };
        } else if (item.type === 'rectangle') {
          newItem = {
            type: 'rectangle',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            fillColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 2,
            borderRadius: 8,
            fillOpacity: 1,
            borderOpacity: 1,
            boxShadow: '',
            width: 120,
            height: 80,
            zIndex: 1,
            rotation: 0,
            visible: true,
            locked: false,
          };
        } else if (item.type === 'circle') {
          newItem = {
            type: 'circle',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            fillColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 2,
            borderRadius: 9999,
            fillOpacity: 1,
            borderOpacity: 1,
            boxShadow: '',
            width: 120,
            height: 120,
            zIndex: 1,
            rotation: 0,
            visible: true,
            locked: false,
          };
        } else if (item.type === 'button') {
          newItem = {
            type: 'button',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            buttonColor: '#2563eb', // blue-600
            buttonText: 'Click Me',
            textColor: '#ffffff',
            textSize: 16,
            iconColor: '#ffffff',
            iconSize: 20,
            iconType: 'MousePointerClick',
            borderRadius: 8,
            padding: { top: 12, right: 24, bottom: 12, left: 24 },
            url: '',
            buttonWidth: 140,
            buttonHeight: 44,
            iconPosition: 'left',
            boxShadow: '0 2px 8px rgba(37,99,235,0.15)',
            visible: true,
            locked: false,
          };
        } else if (item.type === 'list') {
          newItem = {
            type: 'list',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            items: ['List item 1', 'List item 2', 'List item 3'],
            listStyle: 'bulleted' as const,
            listFontSize: 16,
            listFontColor: '#222',
            listFontFamily: 'inter',
            listFontWeight: 'regular',
            listOpacity: 1,
          };
        } else if (item.type === 'table') {
          newItem = {
            type: 'table',
            gridPosition: position,
            colSpan: 2,
            rowSpan: 3,
            id,
            width: 240,
            height: 120,
            tableRows: 3,
            tableCols: 2,
            tableBorder: 1,
            tableCellPadding: 4,
            tableHeader: true,
            tableData: [
              ['Header 1', 'Header 2'],
              ['Cell 1', 'Cell 2'],
              ['Cell 3', 'Cell 4'],
            ],
          };
        } else if (item.type === 'qrcode') {
          newItem = {
            type: 'qrcode',
            gridPosition: position,
            colSpan: 3,
            rowSpan: 4,
            id,
            width: 120,
            height: 120,
            qrValue: 'https://example.com',
          };
        } else if (item.type === 'signature') {
          newItem = {
            type: 'signature',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            width: 180,
            height: 100,
          };
        } else if (item.type === 'chart') {
          newItem = {
            type: 'chart',
            gridPosition: position,
            colSpan: 4,
            rowSpan: 3,
            id,
            width: 240,
            height: 160,
            // Add more chart-specific defaults as needed
          };
        } else if (item.type === 'logo') {
          newItem = {
            type: 'logo',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            width: 120,
            height: 90,
            borderRadius: 12,
            opacity: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 1,
            rotation: 0,
            visible: true,
            locked: false,
          };
        } else if (item.type === 'attachment') {
          newItem = {
            type: 'attachment',
            gridPosition: position,
            colSpan: 4,
            rowSpan: 3,
            id,
            width: 120,
            height: 90,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 1,
            rotation: 0,
            visible: true,
            locked: false,
            content: 'Attachment',
          };
        } else if (item.type === 'variableField') {
          newItem = {
            type: 'variableField',
            gridPosition: position,
            colSpan: 4,
            rowSpan: 2,
            id,
            width: 120,
            height: 60,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 1,
            rotation: 0,
            visible: true,
            locked: false,
            content: 'Variable Field',
          };
        } else {
          newItem = {
            type: 'text',
            gridPosition: position,
            colSpan,
            rowSpan,
            id,
            content: 'Sample text content',
            fontFamily: 'inter',
            fontSize: 16,
            fontWeight: 'regular',
            color: '#000000',
            isBold: false,
            isItalic: false,
            isUnderline: false,
            textAlign: 'left',
          };
        }
        setCanvasItems((items) => [
          ...items, 
          newItem
        ]);
        setSelectedItemId(id);
      }
      setDragPreview(null);
      setIsOverCanvas(false);
      setIsDraggingCanvasItem(false);
    }
  }) as [{ isOver: boolean }, ConnectDropTarget]

  // Calculate pixel position from grid position
  const gridToPixel = (gridPos: GridCell) => {
    return {
      x: gridPos.col * GRID_CELL_SIZE,
      y: gridPos.row * GRID_CELL_SIZE
    }
  }

  // Get CSS styles for a canvas item
  const getItemStyles = (item: CanvasItem) => {
    return {
      fontFamily: item.fontFamily,
      fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
      fontWeight: item.isBold ? 'bold' : (item.fontWeight ? fontWeightMap[item.fontWeight] : 400),
      fontStyle: item.isItalic ? 'italic' : 'normal',
      textDecoration: item.isUnderline ? 'underline' : 'none',
      color: item.color,
      textAlign: item.textAlign || 'left',
    };
  };

  // Save handler
  const handleSaveTemplate = async () => {
    setSaveStatus('saving');
    try {
      // 1. Get the canvas DOM node
      const canvasNode = document.getElementById("pdf-canvas");
      let previewUrl = "";
      if (canvasNode) {
        const canvas = await html2canvas(canvasNode as HTMLElement, { backgroundColor: null });
        previewUrl = canvas.toDataURL("image/png");
      }
      // 2. Prepare template data
      const name = templateName.trim() || "Untitled Template";
      const data = { canvasItems };
      let res;
      if (template && template.id) {
        // Update existing template
        res = await fetch(`/api/templates?id=${encodeURIComponent(template.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data, previewUrl }),
        });
      } else {
        // Create new template
        res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data, previewUrl }),
        });
      }
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // Add useEffect to update settingsTab when selectedItemId or canvasItems changes:
  useEffect(() => {
    const item = selectedItemId ? canvasItems.find(i => i.id === selectedItemId) : null;
    if (item && item.type === 'variableField') {
      setSettingsTab('variable');
    } else if (item) {
      setSettingsTab('style');
    }
  }, [selectedItemId, canvasItems]);

  useEffect(() => {
    if (!template) {
      setTemplateName("");
      setCanvasItems([]);
      setFetchError(null);
      return;
    }
    setLoadingTemplate(true);
    setFetchError(null);
    fetch(`/api/templates?id=${encodeURIComponent(template.id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch template");
        const data = await res.json();
        if (data?.template) {
          setTemplateName(data.template.name || "Untitled Template");
          setCanvasItems(Array.isArray(data.template.data?.canvasItems) ? data.template.data.canvasItems : []);
        } else {
          setTemplateName("");
          setCanvasItems([]);
          setFetchError("Template not found");
        }
      })
      .catch((err) => {
        setTemplateName("");
        setCanvasItems([]);
        setFetchError(err.message || "Error fetching template");
      })
      .finally(() => setLoadingTemplate(false));
  }, [template]);

  // Handler to delete selected text element
  const handleDeleteSelectedText = () => {
    if (!selectedItemId) return;
    setCanvasItems(items => items.filter(item => item.id !== selectedItemId));
    setSelectedItemId(null);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background z-10 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">PDF Builder</h1>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Draft</span>
          {/* Template name input */}
          <Input
            className="ml-4 w-56 h-8 text-base font-medium bg-transparent border-none focus:ring-0 focus:outline-none"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Template Name"
            aria-label="Template Name"
            spellCheck={false}
            maxLength={64}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant={saveStatus === 'saved' ? 'default' : saveStatus === 'error' ? 'destructive' : 'outline'}
            size="sm"
            onClick={handleSaveTemplate}
            disabled={saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </header>
      {activeTab === "editor" ? (
        <div className="flex w-full h-full pt-14">
          {/* Left Sidebar - Block Selection */}
          <div className="w-64 border-r bg-background h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-medium text-sm">Elements</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 grid grid-cols-2 gap-2">
                {blocks.map((block) => {
                  // Only text, heading1, heading2, image, rectangle, circle, and button are draggable
                  const isDraggable = ['text', 'heading1', 'heading2', 'image', 'rectangle', 'circle', 'button', 'list', 'table', 'qrcode', 'signature', 'chart', 'logo', 'attachment', 'variableField'].includes(block.id);
                  let dragRef = undefined;
                  if (isDraggable) {
                    // Use a separate drag source for each block type
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const [{ isDragging }, drag] = useDndDrag({
                      type: block.id,
                      item: { type: block.id },
                      collect: (monitor) => ({
                        isDragging: monitor.isDragging(),
                      }),
                    });
                    dragRef = drag;
                  }
                  if (isDraggable) {
                    return (
                      <div
                        key={block.id}
                        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
                        style={{
                          opacity: selectedBlock === block.id ? 0.5 : 1,
                          cursor: 'grab',
                          width: '100%',
                          touchAction: 'none',
                        }}
                        className="h-20"
                      >
                        <Button
                          variant={selectedBlock === block.id ? "secondary" : "outline"}
                          size="sm"
                          className="h-full w-full flex flex-col justify-center items-center gap-2 text-xs"
                          onClick={() => setSelectedBlock(block.id)}
                        >
                          <block.icon className="h-6 w-6" />
                          {block.name}
                        </Button>
                      </div>
                    );
                  } else {
                    return (
                      <Button
                        key={block.id}
                        variant={selectedBlock === block.id ? "secondary" : "outline"}
                        size="sm"
                        className="h-20 w-full flex flex-col justify-center items-center gap-2 text-xs"
                        onClick={() => setSelectedBlock(block.id)}
                      >
                        <block.icon className="h-6 w-6" />
                        {block.name}
                      </Button>
                    );
                  }
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <Button className="w-full">Add Custom Element</Button>
            </div>
          </div>

          {/* Middle Section - Block Settings */}
          <div className="w-80 border-r bg-background h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-medium text-sm">Properties</h2>
              {/* Dropdown menu removed */}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <Tabs value={settingsTab} onValueChange={setSettingsTab}>
                  <TabsList className={`grid w-full ${selectedItem && selectedItem.type === 'variableField' ? 'grid-cols-3' : 'grid-cols-3'}`}>
                    {selectedItem && selectedItem.type === 'variableField' ? (
                      <>
                        <TabsTrigger value="variable">Variable</TabsTrigger>
                        <TabsTrigger value="layout">Layout</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </>
                    ) : (
                      <>
                        <TabsTrigger value="style">Style</TabsTrigger>
                        <TabsTrigger value="layout">Layout</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </>
                    )}
                  </TabsList>
                  {selectedItem && selectedItem.type === 'variableField' ? null : (
                    <TabsContent value="style" className="space-y-4 pt-4">
                      {selectedItem && selectedItem.type === "image" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Image</Label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    updateSelectedItem({ src: ev.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {selectedItem.src && (
                              <img src={selectedItem.src} alt="Preview" className="mt-2 rounded" style={{ maxWidth: 120, maxHeight: 120 }} />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Size</Label>
                            <Slider
                              value={[typeof selectedItem.width === "number" && typeof selectedItem.height === "number" && selectedItem.width === selectedItem.height ? selectedItem.width : 120]}
                              min={20}
                              max={600}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ width: value[0], height: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.width === "number" && typeof selectedItem.height === "number" && selectedItem.width === selectedItem.height ? selectedItem.width : 120}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Input
                              type="number"
                              min={20}
                              max={600}
                              value={typeof selectedItem.width === 'number' ? selectedItem.width : ''}
                              onChange={e => updateSelectedItem({ width: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Width (px)"
                            />
                            <Slider
                              value={[typeof selectedItem.width === 'number' ? selectedItem.width : 240]}
                              min={20}
                              max={600}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ width: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.width === 'number' ? selectedItem.width : 240}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input
                              type="number"
                              min={20}
                              max={600}
                              value={typeof selectedItem.height === 'number' ? selectedItem.height : ''}
                              onChange={e => updateSelectedItem({ height: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Height (px)"
                            />
                            <Slider
                              value={[typeof selectedItem.height === 'number' ? selectedItem.height : 120]}
                              min={20}
                              max={600}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ height: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.height === 'number' ? selectedItem.height : 120}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <Slider
                              value={[selectedItem.borderRadius ?? 12]}
                              max={64}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ borderRadius: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.borderRadius ?? 12}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Opacity</Label>
                            <Slider
                              value={[Math.round((selectedItem.opacity ?? 0.8) * 100)]}
                              max={100}
                              min={0}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ opacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{Math.round((selectedItem.opacity ?? 0.8) * 100)}%</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Box Shadow</Label>
                            <Input
                              value={selectedItem.boxShadow ?? ''}
                              onChange={e => updateSelectedItem({ boxShadow: e.target.value })}
                              placeholder="e.g. 0 2px 8px rgba(0,0,0,0.12)"
                            />
                          </div>
                        </>
                      ) : selectedItem && (selectedItem.type === "text" || selectedItem.type === "heading1" || selectedItem.type === "heading2") ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="text-content">Text Content</Label>
                            <Input 
                              id="text-content" 
                              placeholder="Enter text..." 
                              value={selectedItem.content ?? ''}
                              onChange={(e) => updateSelectedItem({ content: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Font Family</Label>
                            <Select 
                              value={selectedItem.fontFamily ?? 'inter'}
                              onValueChange={(value) => updateSelectedItem({ fontFamily: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="opensans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Size</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                value={[selectedItem.fontSize ?? 16]} 
                                max={72} 
                                step={1} 
                                className="flex-1"
                                onValueChange={(value) => updateSelectedItem({ fontSize: value[0] })}
                              />
                              <span className="text-sm w-8 text-center">{selectedItem.fontSize ?? 16}px</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Weight</Label>
                            <Select 
                              value={selectedItem.fontWeight ?? 'regular'}
                              onValueChange={(value) => updateSelectedItem({ fontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="semibold">Semibold</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex gap-2">
                              <div 
                                className="w-8 h-8 rounded-md border" 
                                style={{ backgroundColor: selectedItem.color }}
                              ></div>
                              <Input 
                                value={selectedItem.color ?? '#000000'} 
                                className="flex-1"
                                onChange={(e) => updateSelectedItem({ color: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Text Style</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={selectedItem.isBold ? 'default' : 'outline'}
                                size="icon"
                                aria-label="Bold"
                                onClick={() => {
                                  if (selectedItem.isBold) {
                                    updateSelectedItem({ isBold: false, isItalic: false, isUnderline: false });
                                  } else {
                                    updateSelectedItem({ isBold: true, isItalic: false, isUnderline: false });
                                  }
                                }}
                              >
                                <span style={{ fontWeight: 'bold', fontSize: 20, fontFamily: 'inherit' }}>B</span>
                              </Button>
                              <Button
                                variant={selectedItem.isItalic ? 'default' : 'outline'}
                                size="icon"
                                aria-label="Italic"
                                onClick={() => {
                                  if (selectedItem.isItalic) {
                                    updateSelectedItem({ isBold: false, isItalic: false, isUnderline: false });
                                  } else {
                                    updateSelectedItem({ isBold: false, isItalic: true, isUnderline: false });
                                  }
                                }}
                              >
                                <span style={{ fontStyle: 'italic', fontSize: 20, fontFamily: 'inherit' }}>I</span>
                              </Button>
                              <Button
                                variant={selectedItem.isUnderline ? 'default' : 'outline'}
                                size="icon"
                                aria-label="Underline"
                                onClick={() => {
                                  if (selectedItem.isUnderline) {
                                    updateSelectedItem({ isBold: false, isItalic: false, isUnderline: false });
                                  } else {
                                    updateSelectedItem({ isBold: false, isItalic: false, isUnderline: true });
                                  }
                                }}
                              >
                                <span style={{ textDecoration: 'underline', fontSize: 20, fontFamily: 'inherit' }}>U</span>
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Alignment</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={selectedItem.textAlign === 'left' ? 'default' : 'outline'}
                                size="icon"
                                aria-label="Align Left"
                                onClick={() => updateSelectedItem({ textAlign: selectedItem.textAlign === 'left' ? undefined : 'left' })}
                              >
                                <AlignLeft className="h-6 w-6" />
                              </Button>
                              <Button
                                variant={selectedItem.textAlign === 'center' ? 'default' : 'outline'}
                                size="icon"
                                aria-label="Align Center"
                                onClick={() => updateSelectedItem({ textAlign: selectedItem.textAlign === 'center' ? undefined : 'center' })}
                              >
                                <AlignCenter className="h-6 w-6" />
                              </Button>
                              <Button
                                variant={selectedItem.textAlign === 'right' ? 'default' : 'outline'}
                                size="icon"
                                aria-label="Align Right"
                                onClick={() => updateSelectedItem({ textAlign: selectedItem.textAlign === 'right' ? undefined : 'right' })}
                              >
                                <AlignRight className="h-6 w-6" />
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : selectedItem && (selectedItem.type === "rectangle" || selectedItem.type === "circle") ? (
                        <>
                          <div className="space-y-2">
                            <Label>Fill Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.fillColor ?? '#ffffff'}
                              onChange={hex => updateSelectedItem({ fillColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fill Opacity</Label>
                            <Slider
                              value={[Math.round((selectedItem.fillOpacity ?? 1) * 100)]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ fillOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{Math.round((selectedItem.fillOpacity ?? 1) * 100)}%</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Border Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.borderColor ?? '#000000'}
                              onChange={hex => updateSelectedItem({ borderColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Border Opacity</Label>
                            <Slider
                              value={[Math.round((selectedItem.borderOpacity ?? 1) * 100)]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ borderOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{Math.round((selectedItem.borderOpacity ?? 1) * 100)}%</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Border Width</Label>
                            <Slider
                              value={[selectedItem.borderWidth ?? 2]}
                              min={0}
                              max={20}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ borderWidth: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.borderWidth ?? 2}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <Slider
                              value={[selectedItem.borderRadius ?? 8]}
                              min={0}
                              max={64}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ borderRadius: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.borderRadius ?? 8}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Box Shadow</Label>
                            <Input
                              value={selectedItem.boxShadow ?? ''}
                              onChange={e => updateSelectedItem({ boxShadow: e.target.value })}
                              placeholder="e.g. 0 2px 8px rgba(0,0,0,0.12)"
                            />
                          </div>
                        </>
                      ) : selectedItem && selectedItem.type === "table" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Table Controls</Label>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                type="button"
                                onClick={() => {
                                  // Add Row
                                  const currentData = selectedItem.tableData ? [...selectedItem.tableData] : [];
                                  const cols = selectedItem.tableCols || (currentData[0] ? currentData[0].length : 1);
                                  const newRow = Array(cols).fill("");
                                  const newData = [...currentData, newRow];
                                  const rowHeaderHeight = selectedItem.rowHeaderHeight ?? 40;
                                  const rowHeight = selectedItem.rowHeight ?? 40;
                                  updateSelectedItem({
                                    tableData: newData,
                                    tableRows: (selectedItem.tableRows || currentData.length) + 1,
                                    rowSpan: (selectedItem.rowSpan || currentData.length) + 1,
                                    height: calculateTableHeight(rowHeaderHeight, rowHeight, newData.length)
                                  });
                                }}
                              >
                                Add Row
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  // Remove Row
                                  const currentData = selectedItem.tableData ? [...selectedItem.tableData] : [];
                                  if (currentData.length > 1) {
                                    const newData = currentData.slice(0, -1);
                                    const rowHeaderHeight = selectedItem.rowHeaderHeight ?? 40;
                                    const rowHeight = selectedItem.rowHeight ?? 40;
                                    updateSelectedItem({
                                      tableData: newData,
                                      tableRows: (selectedItem.tableRows || currentData.length) - 1,
                                      rowSpan: (selectedItem.rowSpan || currentData.length) - 1,
                                      height: calculateTableHeight(rowHeaderHeight, rowHeight, newData.length)
                                    });
                                  }
                                }}
                                disabled={selectedItem.tableData && selectedItem.tableData.length <= 1}
                              >
                                Remove Row
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  // Add Column
                                  const currentData = selectedItem.tableData ? [...selectedItem.tableData] : [];
                                  const rows = selectedItem.tableRows || currentData.length || 1;
                                  let newData;
                                  if (currentData.length === 0) {
                                    // If no data, initialize with 1x1
                                    newData = [[""]];
                                  } else {
                                    newData = currentData.map(row => [...row, ""]);
                                  }
                                  updateSelectedItem({
                                    tableData: newData,
                                    tableCols: (selectedItem.tableCols || (currentData[0] ? currentData[0].length : 0)) + 1,
                                    colSpan: (selectedItem.colSpan || (currentData[0] ? currentData[0].length : 0)) + 1,
                                  });
                                }}
                              >
                                Add Column
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  // Remove Column
                                  const currentData = selectedItem.tableData ? [...selectedItem.tableData] : [];
                                  if (currentData.length > 0 && currentData[0].length > 1) {
                                    const newData = currentData.map(row => row.slice(0, -1));
                                    updateSelectedItem({
                                      tableData: newData,
                                      tableCols: (selectedItem.tableCols || currentData[0].length) - 1,
                                      colSpan: (selectedItem.colSpan || currentData[0].length) - 1,
                                    });
                                  }
                                }}
                                disabled={selectedItem.tableData && selectedItem.tableData[0] && selectedItem.tableData[0].length <= 1}
                              >
                                Remove Column
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Row Header Height (px)</Label>
                            <Input
                              type="number"
                              min={10}
                              max={200}
                              value={selectedItem.rowHeaderHeight ?? 40}
                              onChange={e => {
                                const newRowHeaderHeight = e.target.value === '' ? 40 : Number(e.target.value);
                                const rowHeight = selectedItem.rowHeight ?? 40;
                                const numRows = selectedItem.tableData ? selectedItem.tableData.length : 3;
                                updateSelectedItem({
                                  rowHeaderHeight: newRowHeaderHeight,
                                  height: calculateTableHeight(newRowHeaderHeight, rowHeight, numRows)
                                });
                              }}
                              placeholder="Row Header Height (px)"
                            />
                            <Slider
                              value={[selectedItem.rowHeaderHeight ?? 40]}
                              min={10}
                              max={200}
                              step={1}
                              className="flex-1"
                              onValueChange={value => {
                                const newRowHeaderHeight = value[0];
                                const rowHeight = selectedItem.rowHeight ?? 40;
                                const numRows = selectedItem.tableData ? selectedItem.tableData.length : 3;
                                updateSelectedItem({
                                  rowHeaderHeight: newRowHeaderHeight,
                                  height: calculateTableHeight(newRowHeaderHeight, rowHeight, numRows)
                                });
                              }}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.rowHeaderHeight ?? 40}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Row Height (px)</Label>
                            <Input
                              type="number"
                              min={10}
                              max={200}
                              value={selectedItem.rowHeight ?? 40}
                              onChange={e => {
                                const newRowHeight = e.target.value === '' ? 40 : Number(e.target.value);
                                const rowHeaderHeight = selectedItem.rowHeaderHeight ?? 40;
                                const numRows = selectedItem.tableData ? selectedItem.tableData.length : 3;
                                updateSelectedItem({
                                  rowHeight: newRowHeight,
                                  height: calculateTableHeight(rowHeaderHeight, newRowHeight, numRows)
                                });
                              }}
                              placeholder="Row Height (px)"
                            />
                            <Slider
                              value={[selectedItem.rowHeight ?? 40]}
                              min={10}
                              max={200}
                              step={1}
                              className="flex-1"
                              onValueChange={value => {
                                const newRowHeight = value[0];
                                const rowHeaderHeight = selectedItem.rowHeaderHeight ?? 40;
                                const numRows = selectedItem.tableData ? selectedItem.tableData.length : 3;
                                updateSelectedItem({
                                  rowHeight: newRowHeight,
                                  height: calculateTableHeight(rowHeaderHeight, newRowHeight, numRows)
                                });
                              }}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.rowHeight ?? 40}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Width (px)</Label>
                            <Input
                              type="number"
                              min={40}
                              max={1200}
                              value={selectedItem.width ?? 240}
                              onChange={e => updateSelectedItem({ width: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Width (px)"
                            />
                            <Slider
                              value={[typeof selectedItem.width === 'number' ? selectedItem.width : 240]}
                              min={40}
                              max={1200}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ width: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.width === 'number' ? selectedItem.width : 240}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Corner Radius</Label>
                            <Slider
                              value={[selectedItem.borderRadius ?? 8]}
                              min={0}
                              max={64}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ borderRadius: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.borderRadius ?? 8}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Header Row Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.headerRowColor ?? '#f3f4f6'}
                              onChange={hex => updateSelectedItem({ headerRowColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Header Row Font Size</Label>
                            <Slider
                              value={[selectedItem.headerFontSize ?? 16]}
                              min={10}
                              max={48}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ headerFontSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.headerFontSize ?? 16}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Header Row Font Weight</Label>
                            <Select
                              value={selectedItem.headerFontWeight as 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | undefined ?? 'bold'}
                              onValueChange={value => updateSelectedItem({ headerFontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="semibold">Semibold</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Header Row Font Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.headerFontColor ?? '#000000'}
                              onChange={hex => updateSelectedItem({ headerFontColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Body Row Font Size</Label>
                            <Slider
                              value={[selectedItem.bodyFontSize ?? 16]}
                              min={10}
                              max={48}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ bodyFontSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.bodyFontSize ?? 16}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Body Row Font Weight</Label>
                            <Select
                              value={selectedItem.bodyFontWeight as 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | undefined ?? 'regular'}
                              onValueChange={value => updateSelectedItem({ bodyFontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="semibold">Semibold</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Body Row Font Family</Label>
                            <Select
                              value={selectedItem.bodyFontFamily as 'inter' | 'roboto' | 'poppins' | 'opensans' | undefined ?? 'inter'}
                              onValueChange={value => updateSelectedItem({ bodyFontFamily: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="opensans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Body Row Font Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.bodyFontColor ?? '#000000'}
                              onChange={hex => updateSelectedItem({ bodyFontColor: hex })}
                            />
                          </div>
                        </>
                      ) : selectedItem && selectedItem.type === "button" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                { name: 'MousePointerClick', Icon: MousePointerClick },
                                { name: 'Square', Icon: Square },
                                { name: 'CircleIcon', Icon: CircleIcon },
                                { name: 'Type', Icon: Type },
                                { name: 'Heading1', Icon: Heading1 },
                                { name: 'Heading2', Icon: Heading2 },
                                { name: 'ListOrdered', Icon: ListOrdered },
                                { name: 'Table', Icon: Table },
                                { name: 'QrCode', Icon: QrCode },
                                { name: 'Signature', Icon: Signature },
                                { name: 'BarChart4', Icon: BarChart4 },
                                { name: 'FileImage', Icon: FileImage },
                                { name: 'Paperclip', Icon: Paperclip },
                                { name: 'Download', Icon: Download },
                                { name: 'Share2', Icon: Share2 },
                                { name: 'Move', Icon: Move },
                              ].map(({ name, Icon }) => (
                                <button
                                  key={name}
                                  type="button"
                                  className={`border rounded p-1 flex items-center justify-center ${selectedItem.iconType === name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                  onClick={() => updateSelectedItem({ iconType: name })}
                                >
                                  <Icon style={{ width: 20, height: 20, color: '#000', opacity: 1 }} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.iconColor ?? '#2563eb'}
                              onChange={hex => updateSelectedItem({ iconColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Size</Label>
                            <Slider
                              value={[selectedItem.iconSize ?? 20]}
                              min={12}
                              max={64}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ iconSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.iconSize ?? 20}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Opacity</Label>
                            <Slider
                              value={[typeof selectedItem.iconOpacity === 'number' ? Math.round(selectedItem.iconOpacity * 100) : 100]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ iconOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.iconOpacity === 'number' ? Math.round(selectedItem.iconOpacity * 100) : 100}%</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input
                              value={selectedItem.buttonText ?? ''}
                              onChange={e => updateSelectedItem({ buttonText: e.target.value })}
                              placeholder="Button label"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Text Size</Label>
                            <Slider
                              value={[selectedItem.textSize ?? 16]}
                              min={10}
                              max={48}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ textSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.textSize ?? 16}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.textColor ?? '#fff'}
                              onChange={hex => updateSelectedItem({ textColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Font Family</Label>
                            <Select
                              value={selectedItem.fontFamily ?? 'inter'}
                              onValueChange={value => updateSelectedItem({ fontFamily: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="opensans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Weight</Label>
                            <Select
                              value={selectedItem.fontWeight ?? 'regular'}
                              onValueChange={value => updateSelectedItem({ fontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="semibold">Semibold</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Text Opacity</Label>
                            <Slider
                              value={[typeof selectedItem.textOpacity === 'number' ? Math.round(selectedItem.textOpacity * 100) : 100]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ textOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.textOpacity === 'number' ? Math.round(selectedItem.textOpacity * 100) : 100}%</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Button Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.buttonColor ?? '#2563eb'}
                              onChange={hex => updateSelectedItem({ buttonColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Button Width</Label>
                            <Input
                              type="number"
                              min={40}
                              max={600}
                              value={selectedItem.buttonWidth ?? 140}
                              onChange={e => updateSelectedItem({ buttonWidth: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Width (px)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Button Height</Label>
                            <Input
                              type="number"
                              min={20}
                              max={200}
                              value={selectedItem.buttonHeight ?? 44}
                              onChange={e => updateSelectedItem({ buttonHeight: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Height (px)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Button Opacity</Label>
                            <Slider
                              value={[typeof selectedItem.buttonOpacity === 'number' ? Math.round(selectedItem.buttonOpacity * 100) : 100]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ buttonOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.buttonOpacity === 'number' ? Math.round(selectedItem.buttonOpacity * 100) : 100}%</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Button Radius</Label>
                            <Slider
                              value={[selectedItem.borderRadius ?? 8]}
                              min={0}
                              max={64}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ borderRadius: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.borderRadius ?? 8}px</span>
                          </div>
                        </>
                      ) : selectedItem && selectedItem.type === 'list' ? (
                        <>
                          <div className="space-y-2">
                            <Label>List Items</Label>
                            <textarea
                              className="w-full border rounded p-2 text-sm"
                              rows={4}
                              value={selectedItem.items?.join('\n') ?? ''}
                              onChange={e => updateSelectedItem({ items: e.target.value.split('\n') })}
                              placeholder="One item per line"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>List Style</Label>
                            <Select
                              value={selectedItem.listStyle as 'bulleted' | 'numbered' | undefined ?? 'bulleted'}
                              onValueChange={value => updateSelectedItem({ listStyle: value as 'bulleted' | 'numbered' })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bulleted">Bulleted</SelectItem>
                                <SelectItem value="numbered">Numbered</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Size</Label>
                            <Slider
                              value={[selectedItem.listFontSize ?? 16]}
                              min={10}
                              max={48}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ listFontSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.listFontSize ?? 16}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.listFontColor ?? '#222'}
                              onChange={hex => updateSelectedItem({ listFontColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Font Family</Label>
                            <Select
                              value={selectedItem.listFontFamily ?? 'inter'}
                              onValueChange={value => updateSelectedItem({ listFontFamily: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="opensans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Weight</Label>
                            <Select
                              value={selectedItem.listFontWeight ?? 'regular'}
                              onValueChange={value => updateSelectedItem({ listFontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="semibold">Semibold</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Opacity</Label>
                            <Slider
                              value={[typeof selectedItem.listOpacity === 'number' ? Math.round(selectedItem.listOpacity * 100) : 100]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ listOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.listOpacity === 'number' ? Math.round(selectedItem.listOpacity * 100) : 100}%</span>
                          </div>
                        </>
                      ) : (selectedBlock === "text") && (
                        // Show default text properties when no element is selected
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="text-content">Text Content</Label>
                            <Input id="text-content" placeholder="Enter text..." defaultValue="Sample text content" disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>Font Family</Label>
                            <Select defaultValue="inter" disabled>
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="opensans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Other disabled controls... */}
                        </>
                      )}

                      {selectedBlock === "image" && (
                        <>
                          <div className="space-y-2">
                            <Label>Image Source</Label>
                            <div className="border-2 border-dashed rounded-md p-6 text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Drag and drop an image or click to browse
                              </p>
                              <Button variant="outline" size="sm" className="mt-2">
                                Upload Image
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <div className="flex items-center gap-2">
                              <Slider defaultValue={[0]} max={50} step={1} className="flex-1" />
                              <span className="text-sm w-8 text-center">0px</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Opacity</Label>
                            <div className="flex items-center gap-2">
                              <Slider defaultValue={[100]} max={100} step={1} className="flex-1" />
                              <span className="text-sm w-8 text-center">100%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="image-shadow">Drop Shadow</Label>
                            <Switch id="image-shadow" />
                          </div>
                        </>
                      )}
                      {selectedItem && selectedItem.type === "qrcode" ? (
                        <>
                          <div className="space-y-2">
                            <Label>QR Code URL</Label>
                            <Input
                              value={selectedItem.qrValue ?? ''}
                              onChange={e => updateSelectedItem({ qrValue: e.target.value })}
                              placeholder="Enter URL or text to encode"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>QR Code Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.qrColor ?? '#222222'}
                              onChange={hex => updateSelectedItem({ qrColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>QR Code Size</Label>
                            <Slider
                              value={[selectedItem.qrSize ?? 48]}
                              min={24}
                              max={240}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ qrSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.qrSize ?? 48}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Bottom Text</Label>
                            <Input
                              value={selectedItem.qrLabel ?? 'QR Code'}
                              onChange={e => updateSelectedItem({ qrLabel: e.target.value })}
                              placeholder="Label below QR code"
                            />
                          </div>
                        </>
                      ) : null}
                      {selectedItem && selectedItem.type === "signature" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Signature Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.signatureColor ?? "#222222"}
                              onChange={hex => updateSelectedItem({ signatureColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Signature Size</Label>
                            <Slider
                              value={[typeof selectedItem.width === 'number' ? selectedItem.width : 180]}
                              min={60}
                              max={600}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ width: value[0], height: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.width === 'number' ? selectedItem.width : 180}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Stroke Thickness</Label>
                            <Slider
                              value={[selectedItem.signatureSize ?? 1.8]}
                              min={0.5}
                              max={10}
                              step={0.1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ signatureSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.signatureSize ?? 1.8}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Draw Signature</Label>
                            <SignaturePad
                              color={selectedItem.signatureColor ?? "#222222"}
                              size={selectedItem.signatureSize ?? 1.8}
                              onSave={svgPath => updateSelectedItem({ signatureData: svgPath })}
                            />
                          </div>
                        </>
                      ) : null}

                      {/* Chart settings panel */}
                      {selectedItem && selectedItem.type === "chart" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Chart Template</Label>
                            <Select
                              value={selectedItem.chartTemplate ?? 'bar'}
                              onValueChange={value => updateSelectedItem({ chartTemplate: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bar">Bar</SelectItem>
                                <SelectItem value="line">Line</SelectItem>
                                <SelectItem value="pie">Pie</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Slider
                              value={[typeof selectedItem.width === 'number' ? selectedItem.width : 240]}
                              min={80}
                              max={600}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ width: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.width === 'number' ? selectedItem.width : 240}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Slider
                              value={[typeof selectedItem.height === 'number' ? selectedItem.height : 160]}
                              min={40}
                              max={600}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ height: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.height === 'number' ? selectedItem.height : 160}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Bar Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.chartColors?.bar ?? '#2563eb'}
                              onChange={hex => updateSelectedItem({ chartColors: { ...selectedItem.chartColors, bar: hex } })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Background Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.chartColors?.background ?? '#fff'}
                              onChange={hex => updateSelectedItem({ chartColors: { ...selectedItem.chartColors, background: hex } })}
                            />
                          </div>
                        </>
                      ) : null}
                      {selectedItem && selectedItem.type === "logo" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Upload Logo Image</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    updateSelectedItem({ src: ev.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {selectedItem.src && (
                              <img
                                src={selectedItem.src}
                                alt="Logo Preview"
                                style={{
                                  maxWidth: 120,
                                  maxHeight: 90,
                                  borderRadius: 8,
                                  marginTop: 8,
                                  background: '#fff',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                }}
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Logo Size</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[typeof selectedItem.width === 'number' ? selectedItem.width : 120]}
                                min={40}
                                max={600}
                                step={1}
                                className="flex-1"
                                onValueChange={value => updateSelectedItem({ width: value[0], height: value[0] })}
                              />
                              <span className="text-sm w-8 text-center">{typeof selectedItem.width === 'number' ? selectedItem.width : 120}px</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Background Opacity</Label>
                            <Slider
                              value={[typeof selectedItem.backgroundOpacity === 'number' ? Math.round(selectedItem.backgroundOpacity * 100) : 100]}
                              min={0}
                              max={100}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ backgroundOpacity: value[0] / 100 })}
                            />
                            <span className="text-sm w-8 text-center">{typeof selectedItem.backgroundOpacity === 'number' ? Math.round(selectedItem.backgroundOpacity * 100) : 100}%</span>
                          </div>
                        </>
                      ) : null}
                      {selectedItem && selectedItem.type === "attachment" ? (
                        <>
                          <div className="space-y-2">
                            <Label>Attachment Icon</Label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                { name: 'Paperclip', Icon: Paperclip },
                                { name: 'FileImage', Icon: FileImage },
                                { name: 'Download', Icon: Download },
                                { name: 'Share2', Icon: Share2 },
                                { name: 'Move', Icon: Move },
                                { name: 'GripHorizontal', Icon: GripHorizontal },
                              ].map(({ name, Icon }) => (
                                <button
                                  key={name}
                                  type="button"
                                  className={`border rounded p-1 flex items-center justify-center ${selectedItem.iconType === name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                  onClick={() => updateSelectedItem({ iconType: name })}
                                >
                                  <Icon style={{ width: 24, height: 24, color: selectedItem.iconColor || '#222' }} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Attachment URL</Label>
                            <Input
                              value={selectedItem.url ?? ''}
                              onChange={e => updateSelectedItem({ url: e.target.value })}
                              placeholder="https://example.com/file.pdf"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Size</Label>
                            <Slider
                              value={[selectedItem.iconSize ?? 32]}
                              min={16}
                              max={64}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ iconSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.iconSize ?? 32}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.iconColor ?? '#222'}
                              onChange={hex => updateSelectedItem({ iconColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Attachment Text</Label>
                            <Input
                              value={selectedItem.content ?? ''}
                              onChange={e => updateSelectedItem({ content: e.target.value })}
                              placeholder="Attachment label"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <ColorPickerWithHex
                              value={selectedItem.textColor ?? '#222'}
                              onChange={hex => updateSelectedItem({ textColor: hex })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Text Size</Label>
                            <Slider
                              value={[selectedItem.textSize ?? 18]}
                              min={10}
                              max={48}
                              step={1}
                              className="flex-1"
                              onValueChange={value => updateSelectedItem({ textSize: value[0] })}
                            />
                            <span className="text-sm w-8 text-center">{selectedItem.textSize ?? 18}px</span>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Family</Label>
                            <Select
                              value={selectedItem.fontFamily ?? 'inter'}
                              onValueChange={value => updateSelectedItem({ fontFamily: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="opensans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Weight</Label>
                            <Select
                              value={selectedItem.fontWeight ?? 'regular'}
                              onValueChange={value => updateSelectedItem({ fontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="semibold">Semibold</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : null}
                    </TabsContent>
                  )}
                  <TabsContent value="layout" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">X</Label>
                          <Input type="number" value={selectedItem?.gridPosition.col ?? 0} onChange={e => updateSelectedItem({ gridPosition: { ...selectedItem!.gridPosition, col: Number(e.target.value) } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Y</Label>
                          <Input type="number" value={selectedItem?.gridPosition.row ?? 0} onChange={e => updateSelectedItem({ gridPosition: { ...selectedItem!.gridPosition, row: Number(e.target.value) } })} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Width</Label>
                          <Input value={selectedItem?.width ?? ''} onChange={e => updateSelectedItem({ width: e.target.value === '' ? undefined : (e.target.value === 'auto' ? 'auto' : Number(e.target.value)) })} placeholder="auto" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Height</Label>
                          <Input value={selectedItem?.height ?? ''} onChange={e => updateSelectedItem({ height: e.target.value === '' ? undefined : (e.target.value === 'auto' ? 'auto' : Number(e.target.value)) })} placeholder="auto" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Margin</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Top</Label>
                          <Input type="number" value={selectedItem?.margin?.top ?? 0} onChange={e => updateSelectedItem({ margin: { ...selectedItem?.margin, top: Number(e.target.value), right: selectedItem?.margin?.right ?? 0, bottom: selectedItem?.margin?.bottom ?? 0, left: selectedItem?.margin?.left ?? 0 } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Right</Label>
                          <Input type="number" value={selectedItem?.margin?.right ?? 0} onChange={e => updateSelectedItem({ margin: { ...selectedItem?.margin, right: Number(e.target.value), top: selectedItem?.margin?.top ?? 0, bottom: selectedItem?.margin?.bottom ?? 0, left: selectedItem?.margin?.left ?? 0 } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Bottom</Label>
                          <Input type="number" value={selectedItem?.margin?.bottom ?? 0} onChange={e => updateSelectedItem({ margin: { ...selectedItem?.margin, bottom: Number(e.target.value), top: selectedItem?.margin?.top ?? 0, right: selectedItem?.margin?.right ?? 0, left: selectedItem?.margin?.left ?? 0 } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Left</Label>
                          <Input type="number" value={selectedItem?.margin?.left ?? 0} onChange={e => updateSelectedItem({ margin: { ...selectedItem?.margin, left: Number(e.target.value), top: selectedItem?.margin?.top ?? 0, right: selectedItem?.margin?.right ?? 0, bottom: selectedItem?.margin?.bottom ?? 0 } })} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Padding</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Top</Label>
                          <Input type="number" value={selectedItem?.padding?.top ?? 0} onChange={e => updateSelectedItem({ padding: { ...selectedItem?.padding, top: Number(e.target.value), right: selectedItem?.padding?.right ?? 0, bottom: selectedItem?.padding?.bottom ?? 0, left: selectedItem?.padding?.left ?? 0 } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Right</Label>
                          <Input type="number" value={selectedItem?.padding?.right ?? 0} onChange={e => updateSelectedItem({ padding: { ...selectedItem?.padding, right: Number(e.target.value), top: selectedItem?.padding?.top ?? 0, bottom: selectedItem?.padding?.bottom ?? 0, left: selectedItem?.padding?.left ?? 0 } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Bottom</Label>
                          <Input type="number" value={selectedItem?.padding?.bottom ?? 0} onChange={e => updateSelectedItem({ padding: { ...selectedItem?.padding, bottom: Number(e.target.value), top: selectedItem?.padding?.top ?? 0, right: selectedItem?.padding?.right ?? 0, left: selectedItem?.padding?.left ?? 0 } })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Left</Label>
                          <Input type="number" value={selectedItem?.padding?.left ?? 0} onChange={e => updateSelectedItem({ padding: { ...selectedItem?.padding, left: Number(e.target.value), top: selectedItem?.padding?.top ?? 0, right: selectedItem?.padding?.right ?? 0, bottom: selectedItem?.padding?.bottom ?? 0 } })} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="advanced" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Z-Index</Label>
                      <Input type="number" value={selectedItem?.zIndex ?? 0} onChange={e => updateSelectedItem({ zIndex: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Rotation</Label>
                      <div className="flex items-center gap-2">
                        <Slider value={[selectedItem?.rotation ?? 0]} max={360} step={1} className="flex-1" onValueChange={value => updateSelectedItem({ rotation: value[0] })} />
                        <span className="text-sm w-8 text-center">{selectedItem?.rotation ?? 0}°</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="element-visible">Visible</Label>
                      <Switch id="element-visible" checked={selectedItem?.visible ?? true} onCheckedChange={checked => updateSelectedItem({ visible: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="element-lock">Lock Position</Label>
                      <Switch id="element-lock" checked={selectedItem?.locked ?? false} onCheckedChange={checked => updateSelectedItem({ locked: checked })} />
                    </div>
                  </TabsContent>
                  {selectedItem && selectedItem.type === 'variableField' ? (
                    <TabsContent value="variable" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Variable ID</Label>
                        <Input
                          value={selectedItem.variableId ?? ''}
                          onChange={e => updateSelectedItem({ variableId: e.target.value })}
                          placeholder="e.g. customer_id"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Variable Name</Label>
                        <Input
                          value={selectedItem.variableName ?? ''}
                          onChange={e => updateSelectedItem({ variableName: e.target.value })}
                          placeholder="e.g. customer_name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Variable Type</Label>
                        <Select
                          value={selectedItem.variableType ?? 'text'}
                          onValueChange={value => updateSelectedItem({ variableType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  ) : null}
                </Tabs>
                {/* Trash button always at the very bottom for any selected element */}
                {selectedItem && (
                  <div className="flex justify-center pt-8">
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label="Delete Element"
                      onClick={handleDeleteSelectedText}
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Section - PDF Preview Canvas */}
          <div className="flex-1 bg-muted h-full flex flex-col">
            <div className="p-4 border-b bg-background flex justify-between items-center">
              <h2 className="font-medium text-sm">Preview</h2>
              <div className="flex items-center gap-2">
                <Select defaultValue="100">
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Zoom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="125">125%</SelectItem>
                    <SelectItem value="150">150%</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <MousePointerClick className="h-4 w-4 mr-2" />
                  Select
                </Button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-auto flex justify-center items-start">
              <div 
                id="pdf-canvas"
                ref={drop as unknown as React.Ref<HTMLDivElement>}
                className="bg-white shadow-lg relative"
                style={{
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  outline: isOver ? '2px solid #3b82f6' : 'none',
                  boxShadow: isOver ? '0 0 0 4px rgba(59,130,246,0.2)' : undefined,
                  transition: 'outline 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
                    <div 
                      key={`col-${i}`} 
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: `${i * GRID_CELL_SIZE}px` }}
                    />
                  ))}
                  {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
                    <div 
                      key={`row-${i}`} 
                      className="absolute left-0 right-0 border-b border-gray-100"
                      style={{ top: `${i * GRID_CELL_SIZE}px` }}
                    />
                  ))}
                </div>
                {/* Placement preview */}
                {isOver && dragPreview && (
                  <div
                    className="absolute border-2 border-blue-400 bg-blue-100/30 pointer-events-none"
                    style={{
                      left: gridToPixel(dragPreview).x,
                      top: gridToPixel(dragPreview).y,
                      width: (elementSizes[(selectedBlock && elementSizes[selectedBlock as keyof typeof elementSizes] ? selectedBlock : 'text') as keyof typeof elementSizes].colSpan) * GRID_CELL_SIZE,
                      height: (elementSizes[(selectedBlock && elementSizes[selectedBlock as keyof typeof elementSizes] ? selectedBlock : 'text') as keyof typeof elementSizes].rowSpan) * GRID_CELL_SIZE,
                      zIndex: 10
                    }}
                  />
                )}
                {/* Render canvas items */}
                {canvasItems.map((item) => (
                  <DraggableCanvasItem
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedItemId}
                    onSelect={handleSelectItem}
                    gridToPixel={gridToPixel}
                    getItemStyles={getItemStyles}
                    GRID_CELL_SIZE={GRID_CELL_SIZE}
                    onResize={handleResizeItem}
                    onResizeImage={handleResizeImage}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "templates" ? (
        <div className="flex-1 flex items-center justify-center pt-14">
          <TemplatesPage />
        </div>
      ) : null}
    </div>
  );
}