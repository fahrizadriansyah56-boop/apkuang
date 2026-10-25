import 'dotenv/config';
import cors from 'cors';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pg from 'pg';
import { INITIAL_COMMITTEE_FEES, INITIAL_COMMITTEE_INFO, INITIAL_DIVISIONS, INITIAL_REMINDERS, INITIAL_SPONSORSHIPS, INITIAL_TRANSACTIONS } from '../src/data/mockData.js';

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
const app = express();
const port = Number(process.env.PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://localhost')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

if (!databaseUrl) throw new Error('DATABASE_URL must be set.');
if (!adminEmail || !adminPassword || adminPassword.length < 12) {
  throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters.');
}

const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
const roles = ['admin', 'treasurer', 'editor', 'viewer'] as const;
type Role = (typeof roles)[number];
let dummyPasswordHash = '';
interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      sessionTokenHash?: string;
    }
  }
}

const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password: string, stored: string) => {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const createSession = async (user: AuthUser) => {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
    [tokenHash, user.id]
  );
  return { token, user };
};

const initializeDatabase = async () => {
  dummyPasswordHash = await hashPassword(randomBytes(32).toString('hex'));
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'treasurer', 'editor', 'viewer')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
    CREATE TABLE IF NOT EXISTS finance_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload JSONB NOT NULL,
      version BIGINT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
    UPDATE users SET full_name = split_part(email, '@', 1) WHERE full_name IS NULL;
    ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
  `);
  await pool.query(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'treasurer', 'editor', 'viewer'));
  `);

  const admin = await pool.query<{ id: string; email: string; role: Role }>(
    'SELECT id, email, role FROM users WHERE role = $1 LIMIT 1',
    ['admin']
  );
  if (admin.rowCount === 0) {
    const passwordHash = await hashPassword(adminPassword as string);
    await pool.query(
      'INSERT INTO users (id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [randomUUID(), 'Admin', adminEmail, passwordHash, 'admin']
    );
    const verifyAdmin = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND role = $2', [adminEmail, 'admin']);
    if (verifyAdmin.rowCount === 0) throw new Error('Could not create the initial admin account. Check whether ADMIN_EMAIL is already registered.');
  }

  const initialData = {
    committeeInfo: INITIAL_COMMITTEE_INFO,
    divisions: INITIAL_DIVISIONS,
    transactions: INITIAL_TRANSACTIONS,
    committeeFees: INITIAL_COMMITTEE_FEES,
    sponsorships: INITIAL_SPONSORSHIPS,
    reminders: INITIAL_REMINDERS,
  };
  await pool.query('INSERT INTO finance_state (id, payload) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [JSON.stringify(initialData)]);
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
};

const authenticationRequired = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Silakan login kembali.' });

  const tokenHash = hashToken(token);
  try {
    const result = await pool.query<AuthUser & { token_hash: string }>(
      `SELECT u.id, u.full_name AS "fullName", u.email, u.role, s.token_hash
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash]
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'Sesi tidak berlaku atau sudah kedaluwarsa.' });
    const { token_hash: _tokenHash, ...user } = result.rows[0];
    req.authUser = user;
    req.sessionTokenHash = tokenHash;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireRole = (...allowedRoles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.authUser || !allowedRoles.includes(req.authUser.role)) {
    return res.status(403).json({ error: 'Akun Anda tidak memiliki izin untuk tindakan ini.' });
  }
  return next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' },
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(resolve(process.cwd(), 'dist')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!fullName || fullName.length > 120) {
      return res.status(400).json({ error: 'Nama lengkap wajib diisi (maksimal 120 karakter).' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Masukkan alamat email yang valid.' });
    }
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'Password harus terdiri dari 12 sampai 128 karakter.' });
    }

    const passwordHash = await hashPassword(password);
    const created = await pool.query<AuthUser>(
      `INSERT INTO users (id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'editor')
       ON CONFLICT DO NOTHING
       RETURNING id, full_name AS "fullName", email, role`,
      [randomUUID(), fullName, email, passwordHash]
    );
    if (!created.rows[0]) return res.status(409).json({ error: 'Email sudah terdaftar.' });
    return res.status(201).json(await createSession(created.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length > 128) return res.status(401).json({ error: 'Email atau password tidak cocok.' });
    const result = await pool.query<AuthUser & { password_hash: string }>(
      'SELECT id, full_name AS "fullName", email, role, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    const candidate = result.rows[0];
    const valid = await verifyPassword(password, candidate?.password_hash || dummyPasswordHash);
    if (!candidate || !valid) return res.status(401).json({ error: 'Email atau password tidak cocok.' });
    const { password_hash: _passwordHash, ...user } = candidate;
    return res.json(await createSession(user));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', authenticationRequired, (req, res) => res.json({ user: req.authUser }));

app.post('/api/auth/logout', authenticationRequired, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [req.sessionTokenHash]);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.get('/api/data', authenticationRequired, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT payload, version FROM finance_state WHERE id = 1');
    return res.json({ data: result.rows[0].payload, version: Number(result.rows[0].version) });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/data', authenticationRequired, requireRole('admin', 'treasurer', 'editor'), async (req, res, next) => {
  try {
    const { data, version } = req.body ?? {};
    const expectedKeys = ['committeeInfo', 'divisions', 'transactions', 'committeeFees', 'sponsorships', 'reminders'];
    if (
      !data || typeof data !== 'object' ||
      !data.committeeInfo || typeof data.committeeInfo !== 'object' ||
      expectedKeys.slice(1).some(key => !Array.isArray(data[key])) ||
      !Number.isSafeInteger(version)
    ) {
      return res.status(400).json({ error: 'Data keuangan atau versi tidak valid.' });
    }

    const result = await pool.query(
      `UPDATE finance_state
       SET payload = $1, version = version + 1, updated_at = NOW()
       WHERE id = 1 AND version = $2
       RETURNING version`,
      [JSON.stringify(data), version]
    );
    if (!result.rows[0]) return res.status(409).json({ error: 'Data baru saja diubah pengguna lain. Muat ulang untuk melihat perubahan terbaru.' });
    return res.json({ version: Number(result.rows[0].version) });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/users', authenticationRequired, requireRole('admin'), async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name AS "fullName", email, role, created_at AS "createdAt"
       FROM users ORDER BY created_at ASC`
    );
    return res.json({ users: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/users/:id/role', authenticationRequired, requireRole('admin'), async (req, res, next) => {
  const role = req.body?.role as Role;
  const userId = req.params.id;
  if (!roles.includes(role)) return res.status(400).json({ error: 'Peran tidak valid.' });
  if (userId === req.authUser?.id) return res.status(400).json({ error: 'Peran akun yang sedang digunakan tidak dapat diubah.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (role !== 'admin') {
      const target = await client.query<{ role: Role }>('SELECT role FROM users WHERE id = $1 FOR UPDATE', [userId]);
      if (target.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      }
      if (target.rows[0].role === 'admin') {
        const admins = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users WHERE role = $1', ['admin']);
        if (Number(admins.rows[0].count) <= 1) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Aplikasi harus memiliki minimal satu admin.' });
        }
      }
    }

    const updated = await client.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name AS "fullName", email, role',
      [role, userId]
    );
    if (updated.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    await client.query('COMMIT');
    return res.json({ user: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || !req.accepts('html')) return next();
  return res.sendFile(resolve(process.cwd(), 'dist', 'index.html'));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API request failed:', error);
  if (res.headersSent) return;
  return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

const start = async () => {
  await initializeDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.log(`KasPanitia API listening on port ${port}`);
  });
};

start().catch(error => {
  console.error('Failed to start KasPanitia API:', error);
  process.exitCode = 1;
});
