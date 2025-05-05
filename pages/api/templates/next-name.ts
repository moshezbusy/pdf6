import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
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
    res.status(200).json({ success: true, name: nextName });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to determine next template name' });
  }
} 