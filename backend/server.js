import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import vendorsRoutes from './routes/vendors.js';
import sheetsRoutes from './routes/sheets.js';
import assignmentsRoutes from './routes/assignments.js';
import vendorOrdersRoutes from './routes/vendorOrders.js';
import jobsRoutes from './routes/jobs.js';
import filmSizesRoutes from './routes/filmSizes.js';
import billingRoutes from './routes/billing.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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
