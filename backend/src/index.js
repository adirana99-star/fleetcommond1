const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const { config } = require('./config');
const { connectDatabase } = require('./db');
const { applySyncQueue } = require('./syncService');
const { authRequired, canAccessDriver, canAccessVendor, login, requireRole } = require('./auth');
const { driverData, driverSummary, listVendorData, listVendors, vendorExpenses, vendorSummary } = require('./reports');

const app = express();

// Trust the platform/load-balancer proxy (Render, Railway, Nginx) so client IPs
// and rate limiting work correctly behind HTTPS termination.
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header) and same-origin requests.
      if (!origin) {
        return callback(null, true);
      }
      if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many login attempts. Try again after 15 minutes.' }
});

const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Sync rate limit reached. Please wait before retrying.' }
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'fleetcommand-backend',
    mongoState: mongoose.connection.readyState
  });
});

app.post('/auth/login', loginLimiter, login);

app.get('/fleet/vendors', authRequired, requireRole('platform'), listVendors);
app.get('/fleet/vendors/:vendorId/data', authRequired, canAccessVendor, listVendorData);
app.get('/fleet/vendors/:vendorId/summary', authRequired, canAccessVendor, vendorSummary);
app.get('/fleet/vendors/:vendorId/expenses', authRequired, canAccessVendor, vendorExpenses);
app.get('/fleet/drivers/:driverId/data', authRequired, canAccessDriver, driverData);
app.get('/fleet/drivers/:driverId/summary', authRequired, canAccessDriver, driverSummary);

if (config.requireAuthForSync) {
  app.post('/fleet/sync', syncLimiter, authRequired, async (req, res) => {
    const { changes } = req.body || {};

    if (!Array.isArray(changes)) {
      return res.status(400).json({
        ok: false,
        message: 'changes must be an array'
      });
    }

    const results = await applySyncQueue(changes);
    const failed = results.filter((item) => !item.ok);

    return res.status(failed.length ? 207 : 200).json({
      ok: failed.length === 0,
      received: changes.length,
      applied: results.length - failed.length,
      failed: failed.length,
      results
    });
  });
} else {
  app.post('/fleet/sync', syncLimiter, async (req, res) => {
    const { changes } = req.body || {};

    if (!Array.isArray(changes)) {
      return res.status(400).json({
        ok: false,
        message: 'changes must be an array'
      });
    }

    const results = await applySyncQueue(changes);
    const failed = results.filter((item) => !item.ok);

    return res.status(failed.length ? 207 : 200).json({
      ok: failed.length === 0,
      received: changes.length,
      applied: results.length - failed.length,
      failed: failed.length,
      results
    });
  });
}

async function start() {
  try {
    if (!config.jwtSecret || config.jwtSecret.length < 16) {
      throw new Error('JWT_SECRET is missing or too short. Set a strong JWT_SECRET (>= 16 chars) before starting in production.');
    }
    if (config.corsOrigins.includes('*')) {
      console.warn('[security] CORS_ORIGIN is "*" (any origin). Set it to your web app domain(s) in production.');
    }
    await connectDatabase();
    app.listen(config.port, () => {
      console.log(`Backend listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

start();
