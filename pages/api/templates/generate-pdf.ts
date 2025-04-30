import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Update variable fields in canvas data
function updateCanvasVariables(data: any, variables: Record<string, any>) {
  if (!data || !Array.isArray(data.canvasItems)) return data;
  const updated = { ...data };
  updated.canvasItems = data.canvasItems.map((item: any) => {
    if (item.type === 'variableField' && item.variableId && variables[item.variableId] !== undefined) {
      return { ...item, content: variables[item.variableId] };
    }
    return item;
  });
  return updated;
}

// Render canvas data as simple HTML
function renderCanvasAsHTML(data: any) {
  if (!data || !Array.isArray(data.canvasItems)) return '<div>No content</div>';
  // Simple absolute positioning for each item
  const itemsHTML = data.canvasItems.map((item: any) => {
    const style = [
      `position: absolute`,
      `left: ${item.gridPosition?.col ? item.gridPosition.col * 20 : 0}px`,
      `top: ${item.gridPosition?.row ? item.gridPosition.row * 20 : 0}px`,
      `width: ${item.width || 100}px`,
      `height: ${item.height || 30}px`,
      `border-radius: ${item.borderRadius || 0}px`,
      `box-shadow: ${item.boxShadow || 'none'}`,
      `z-index: ${item.zIndex || 1}`,
      `transform: rotate(${item.rotation || 0}deg)`,
      `background: #fff`,
      `border: 1px solid #ccc`,
      `padding: 4px`,
      `overflow: hidden`,
      `font-size: 14px`,
      `display: ${item.visible === false ? 'none' : 'block'}`
    ].join('; ');
    return `<div style="${style}">${item.content || ''}</div>`;
  }).join('\n');
  // Container with relative positioning
  return `<div style="position:relative;width:600px;height:840px;background:#fafafa;">${itemsHTML}</div>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();
  const { templateId, variables } = req.body;

  if (!templateId || !variables) {
    return res.status(400).json({ error: 'Missing templateId or variables' });
  }

  // Fetch template
  const template = await Template.findById(templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  // Update variable fields in canvas data
  const updatedData = updateCanvasVariables(template.data, variables);
  // Render as HTML
  const html = renderCanvasAsHTML(updatedData);

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  // Save PDF to public/generated-pdfs with a unique filename
  const filename = `template-${templateId}-${uuidv4()}.pdf`;
  const filePath = path.join(process.cwd(), 'public', 'generated-pdfs', filename);
  fs.writeFileSync(filePath, pdfBuffer);

  // Return a JSON response with the download URL
  const downloadUrl = `/generated-pdfs/${filename}`;
  res.status(200).json({ success: true, url: downloadUrl });
} 