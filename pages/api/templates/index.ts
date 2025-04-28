import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    // Fetch all templates
    try {
      const templates = await Template.find({}).sort({ createdAt: -1 });
      res.status(200).json({ success: true, templates });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
  } else if (req.method === 'POST') {
    // Save a new template
    try {
      const { name, data, previewUrl } = req.body;
      if (!name || !data) {
        return res.status(400).json({ success: false, error: 'Missing name or data' });
      }
      const template = await Template.create({ name, data, previewUrl });
      res.status(201).json({ success: true, template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to save template' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 