import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.grdlsieksrtdbzhmfelr:HackWithHyd2026!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function runSql() {
  const sql = fs.readFileSync('supabase_schema.sql', 'utf-8');
  console.log('Connecting to PostgreSQL database to execute schema...');

  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully!');
    await client.query(sql);
    console.log('✅ Successfully executed full supabase_schema.sql including profiles table and RLS policies!');
    client.release();
  } catch (err) {
    console.log('PostgreSQL direct connection result:', (err as Error).message);
  } finally {
    await pool.end();
  }
}

runSql();
