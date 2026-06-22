import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './db/pool.js';

import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import vendorsRoutes from './routes/vendors.js';
import sheetsRoutes from './routes/sheets.js';
import assignmentsRoutes from './routes/assignments.js';
import vendorOrdersRoutes from './routes/vendorOrders.js';
import jobsRoutes from './routes/jobs.js';
import filmSizesRoutes from './routes/filmSizes.js';
import vendorFilmSizesRoutes from './routes/vendorFilmSizes.js';
import billingRoutes from './routes/billing.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

// Run database schema migrations
(async () => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);');
    await pool.query('ALTER TABLE vendors ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);');
    console.log('✅ Database schema migrations applied successfully.');
  } catch (err) {
    console.error('❌ Failed to run database schema migrations:', err);
  }
})();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (() => {
    const origins = (process.env.FRONTEND_URL || '').split(',').map(u => u.trim()).filter(Boolean);
    return origins.length > 0 ? origins : 'http://localhost:5173';
  })(),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// General rate limiting (increased to 1000 requests per minute)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limit for login (increased to 100 attempts per minute)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/login', loginLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/vendor-orders', vendorOrdersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/film-sizes', filmSizesRoutes);
app.use('/api/vendor-film-sizes', vendorFilmSizesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CISPL API running on port ${PORT}`);
});
