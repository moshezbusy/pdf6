export type GridCell = {
  row: number;
  col: number;
};

export type CanvasItem = {
  type: 'text' | 'heading1' | 'heading2' | 'image' | 'rectangle' | 'circle' | 'button' | 'list' | 'table' | 'qrcode' | 'signature' | 'chart' | 'logo' | 'attachment' | 'variableField';
  gridPosition: GridCell;
  colSpan: number;
  rowSpan: number;
  id: string;
  // Style properties
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  // Image-specific properties
  src?: string;
  // Rectangle-specific properties
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fillOpacity?: number;
  borderOpacity?: number;
  boxShadow?: string;
  // Layout properties
  margin?: { top: number; right: number; bottom: number; left: number };
  padding?: { top: number; right: number; bottom: number; left: number };
  width?: number | 'auto';
  height?: number | 'auto';
  // Logo-specific properties
  backgroundOpacity?: number; // For logo background opacity
  // Advanced properties
  zIndex?: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  // Button-specific properties
  buttonColor?: string;
  buttonText?: string;
  textColor?: string;
  textSize?: number;
  iconColor?: string;
  iconSize?: number;
  iconType?: string;
  iconOpacity?: number;
  url?: string;
  buttonWidth?: number;
  buttonHeight?: number;
  iconPosition?: 'left' | 'right';
  textOpacity?: number;
  buttonOpacity?: number;
  // List-specific properties
  items?: string[];
  listStyle?: 'bulleted' | 'numbered';
  listFontSize?: number;
  listFontColor?: string;
  listFontFamily?: string;
  listFontWeight?: string;
  listOpacity?: number;
  // Table-specific properties
  tableRows?: number;
  tableCols?: number;
  tableBorder?: number;
  tableCellPadding?: number;
  tableHeader?: boolean;
  tableData?: string[][];
  rowHeight?: number;
  rowHeaderHeight?: number;
  headerRowColor?: string;
  // New table font settings
  headerFontSize?: number;
  headerFontWeight?: string;
  headerFontColor?: string;
  bodyFontSize?: number;
  bodyFontWeight?: string;
  bodyFontFamily?: string;
  bodyFontColor?: string;
  // QR code-specific properties
  qrValue?: string;
  qrLabel?: string;
  qrColor?: string;
  qrSize?: number;
  // Signature-specific properties
  signatureData?: string; // SVG path or base64 image
  signatureColor?: string;
  signatureSize?: number;
  // Chart-specific properties
  chartTemplate?: string; // e.g., 'bar', 'line', 'pie'
  chartColors?: {
    bar?: string;
    background?: string;
    [key: string]: string | undefined;
  };
  // Variable field properties (for text elements)
  variableName?: string;
  variableType?: string;
  variableId?: string;
}; 