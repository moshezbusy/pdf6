import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // TODO: Use password hashing (bcrypt) in production
  if (user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // TODO: Implement real session management (JWT/cookie)
  // For now, just return success
  return res.status(200).json({ message: 'Login successful', user: { email: user.email, name: user.name } });
} 