import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in apps/api/.env first.');
  const rl = createInterface({ input, output });
  try {
    const email = z.string().email().parse((await rl.question('Admin email: ')).trim());
    const password = await rl.question('Admin password (12+ characters): ');
    z.string().min(12).max(128).parse(password);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
    try { await pool.query('INSERT INTO admins (email,password_hash) VALUES ($1,$2) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash', [email,bcrypt.hashSync(password,12)]); console.log(`Admin account ready for ${email}.`); }
    finally { await pool.end(); }
  } finally { rl.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
