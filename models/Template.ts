/// <reference types="mongoose" />
import mongoose, { Schema, models, model } from 'mongoose';

const TemplateSchema = new Schema({
  name: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true }, // Store editor/canvas data
  previewUrl: { type: String }, // URL or base64 of preview image
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default models.Template || model('Template', TemplateSchema); 