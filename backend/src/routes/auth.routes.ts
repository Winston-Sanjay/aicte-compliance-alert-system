import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { authenticateToken, AuthRequest, generateToken } from '../middleware/auth';

const router = Router();

// Demo Login
router.post('/demo-login', async (req, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { institution: true },
  });

  if (!user) {
    res.status(401).json({ message: 'Invalid credentials. User not found.' });
    return;
  }

  // Support demo123 plaintext or bcrypt hash
  const isValidPassword =
    password === 'demo123' || (await bcrypt.compare(password, user.passwordHash).catch(() => false));

  if (!isValidPassword) {
    res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
      institution: user.institution,
    },
  });
});

// Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { institution: true },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
      institution: user.institution,
    },
  });
});

export default router;
