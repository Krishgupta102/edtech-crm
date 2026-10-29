import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { z } from 'zod';
import { categories, inquirySchema, loginSchema, statuses, userTypes } from './validation';

const required = ['DATABASE_URL', 'JWT_SECRET', 'WEB_ORIGIN'] as const;
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
if (process.env.JWT_SECRET!.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined, max: 10, idleTimeoutMillis: 30_000 });
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const inquiryLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const, path: '/', maxAge: 8 * 60 * 60 * 1000 });
type AdminRequest = Request & { adminId?: string };
function authenticate(req: AdminRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try { const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload; if (typeof payload.sub !== 'string') throw new Error('Invalid token'); req.adminId = payload.sub; next(); }
  catch { res.clearCookie('admin_token', cookieOptions()); return res.status(401).json({ error: 'Your session has expired. Please sign in again.' }); }
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); } catch { res.status(503).json({ status: 'unavailable' }); }
});

app.post('/api/inquiries', inquiryLimit, async (req, res, next) => {
  try {
    const parsed = inquirySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please check the form fields.', fields: parsed.error.flatten().fieldErrors });
    const { name, email, phone, userType, category, message } = parsed.data;
    await pool.query('INSERT INTO inquiries (name,email,phone,user_type,category,message) VALUES ($1,$2,$3,$4,$5,$6)', [name, email, phone, userType, category, message]);
    res.status(201).json({ message: 'Thanks for reaching out. Our team will be in touch soon.' });
  } catch (error) { next(error); }
});

app.post('/api/admin/login', authLimit, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });
    const { email, password } = parsed.data;
    const result = await pool.query('SELECT id,email,password_hash FROM admins WHERE lower(email)=lower($1)', [email]);
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET!, { expiresIn: '8h', issuer: 'edtech-crm' });
    res.cookie('admin_token', token, cookieOptions()).json({ admin: { email: admin.email } });
  } catch (error) { next(error); }
});

app.post('/api/admin/logout', (_req, res) => { res.clearCookie('admin_token', cookieOptions()).json({ message: 'Signed out.' }); });
app.get('/api/admin/me', authenticate, async (req: AdminRequest, res, next) => {
  try { const result = await pool.query('SELECT email FROM admins WHERE id=$1', [req.adminId]); if (!result.rowCount) return res.status(401).json({ error: 'Admin account not found.' }); res.json({ admin: result.rows[0] }); }
  catch (error) { next(error); }
});

app.get('/api/admin/inquiries', authenticate, async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' && categories.includes(req.query.category as typeof categories[number]) ? req.query.category : null;
    const userType = typeof req.query.userType === 'string' && userTypes.includes(req.query.userType as typeof userTypes[number]) ? req.query.userType : null;
    const status = typeof req.query.status === 'string' && statuses.includes(req.query.status as typeof statuses[number]) ? req.query.status : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
    const result = await pool.query(`SELECT id,name,email,phone,user_type AS "userType",category,message,status,created_at AS "createdAt" FROM inquiries WHERE ($1::text IS NULL OR category=$1) AND ($2::text IS NULL OR user_type=$2) AND ($3::text IS NULL OR status=$3) AND ($4='' OR name ILIKE '%'||$4||'%' OR phone ILIKE '%'||$4||'%') ORDER BY created_at DESC LIMIT 300`, [category,userType,status,search]);
    res.json({ inquiries: result.rows });
  } catch (error) { next(error); }
});

app.patch('/api/admin/inquiries/:id/status', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id); const status = z.enum(statuses).safeParse(req.body?.status);
    if (!id.success || !status.success) return res.status(400).json({ error: 'Invalid inquiry or status.' });
    const result = await pool.query('UPDATE inquiries SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,status', [status.data,id.data]);
    if (!result.rowCount) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json({ inquiry: result.rows[0] });
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Request failed:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.API_PORT ?? 4000);
const server = app.listen(port, () => console.log(`EdTech CRM API listening on ${port}`));
async function shutdown() { server.close(); await pool.end(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
