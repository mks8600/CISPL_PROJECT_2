import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export default pool;
