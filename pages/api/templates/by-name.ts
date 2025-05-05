import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { name } = req.query;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing or invalid template name' });
  }

  if (req.method === 'GET') {
    try {
      const template = await Template.findOne({ name }).lean();
      if (!template) {
        return res.status(200).json({ success: true, template: null });
      }
      return res.status(200).json({ success: true, template });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
  } else if (req.method === 'POST') {
    try {
      const { data, previewUrl } = req.body;
      const template = await Template.create({ id: uuidv4(), name, data: data || {}, previewUrl });
      return res.status(201).json({ success: true, template });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to create template' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 