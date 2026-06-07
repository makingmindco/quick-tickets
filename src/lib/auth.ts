import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_quicktickets_key_change_me';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  is_admin: boolean;
  cargo?: string;
}

export function generateToken(payload: AuthUser) {
  // Matches Express token signature logic
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req: Request): AuthUser | null {
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader) {
    token = authHeader.split(' ')[1]; // Expects "Bearer <token>"
  } else {
    try {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
    } catch (e) {}
  }

  if (!token) return null;

  return verifyToken(token);
}
