import mongoose, { Schema, models, model } from 'mongoose';

const ApiKeySchema = new Schema({
  key: { type: String, required: true }, // Consider hashing for extra security
  label: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date },
  revoked: { type: Boolean, default: false }
});

const UserSchema = new Schema({
  // Add other user fields as needed (e.g., email, password, name)
  email: { type: String, required: true, unique: true },
  password: { type: String }, // If using password auth
  name: { type: String },
  apiKeys: [ApiKeySchema]
});

export default models.User || model('User', UserSchema); 