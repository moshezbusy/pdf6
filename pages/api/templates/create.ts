import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    // Find all templates with names like 'New Template X'
    const templates = await Template.find({ name: { $regex: /^New Template \d+$/ } }).lean();
    const usedNumbers = templates
      .map(t => {
        const match = t.name.match(/^New Template (\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);
    let nextNumber = 1;
    for (const n of usedNumbers) {
      if (n === nextNumber) {
        nextNumber++;
      } else if (n > nextNumber) {
        break;
      }
    }
    const nextName = `New Template ${nextNumber}`;
    // Create the new template with default data
    const defaultData = { canvasItems: [] };
    const template = await Template.create({ id: uuidv4(), name: nextName, data: defaultData });
    res.status(201).json({ success: true, template: { id: template.id, name: template.name } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
} 