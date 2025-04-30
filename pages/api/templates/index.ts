import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Template from '@/models/Template';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    const { id, includePreview } = req.query;
    try {
      if (id) {
        // Try to find by custom id field first
        let template = await Template.findOne({ id }).lean();
        // If not found, try to find by MongoDB _id
        if (!template) {
          try {
            template = await Template.findById(id).lean();
          } catch (e) {
            // ignore invalid ObjectId errors
          }
        }
        if (!template) {
          return res.status(404).json({ success: false, error: 'Template not found' });
        }
        // Omit previewUrl unless includePreview=true
        if ((!includePreview || includePreview === 'false') && template && !Array.isArray(template)) {
          delete (template as any).previewUrl;
        }
        return res.status(200).json({ success: true, template });
      }
      const templates = await Template.find({}).sort({ createdAt: -1 }).lean();
      // Omit previewUrl from all templates unless includePreview=true
      const result = Array.isArray(templates)
        ? templates.map(t => {
            if (!includePreview || includePreview === 'false') {
              const { previewUrl, ...rest } = t as any;
              return rest;
            }
            return t;
          })
        : [];
      res.status(200).json({ success: true, templates: result });
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
      const template = await Template.create({ id: uuidv4(), name, data, previewUrl });
      res.status(201).json({ success: true, template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to save template' });
    }
  } else if (req.method === 'DELETE') {
    // Delete a template by ID
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing template ID' });
    }
    try {
      const deleted = await Template.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 