const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { config } = require('./config');
const { Vendor, Driver } = require('./models');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password || '').digest('hex');
}

function ensureJwtConfig() {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not set. Configure backend/.env.');
  }
}

function signToken(payload) {
  ensureJwtConfig();
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyToken(token) {
  ensureJwtConfig();
  return jwt.verify(token, config.jwtSecret);
}

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Missing Bearer token' });
    }

    const token = header.slice('Bearer '.length);
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role || !allowed.has(role)) {
      return res.status(403).json({ ok: false, message: 'Forbidden for this role' });
    }
    return next();
  };
}

function canAccessVendor(req, res, next) {
  const vendorId = req.params.vendorId || req.query.vendorId;
  if (!vendorId) {
    return res.status(400).json({ ok: false, message: 'vendorId is required' });
  }

  if (req.user.role === 'platform') {
    return next();
  }

  if (req.user.role === 'admin' && req.user.vendorId === vendorId) {
    return next();
  }

  if (req.user.role === 'driver' && req.user.vendorId === vendorId) {
    return next();
  }

  return res.status(403).json({ ok: false, message: 'Vendor access denied' });
}

function canAccessDriver(req, res, next) {
  const driverId = req.params.driverId || req.query.driverId;
  if (!driverId) {
    return res.status(400).json({ ok: false, message: 'driverId is required' });
  }

  if (req.user.role === 'platform') {
    return next();
  }

  if (req.user.role === 'driver' && req.user.driverId === driverId) {
    return next();
  }

  return res.status(403).json({ ok: false, message: 'Driver access denied' });
}

async function login(req, res) {
  try {
    const { role, phone, password } = req.body || {};

    if (!role) {
      return res.status(400).json({ ok: false, message: 'role is required' });
    }

    const passwordHash = hashPassword(password || '');

    if (role === 'platform') {
      if (!password) {
        return res.status(400).json({ ok: false, message: 'password is required for platform login' });
      }
      if (!config.platformPasswordHash) {
        return res.status(503).json({ ok: false, message: 'Platform login is not configured on server.' });
      }
      if (passwordHash !== config.platformPasswordHash) {
        return res.status(401).json({ ok: false, message: 'Invalid platform credentials' });
      }

      const token = signToken({ role: 'platform' });
      return res.json({ ok: true, token, role: 'platform' });
    }

    if (role === 'admin') {
      if (!phone) {
        return res.status(400).json({ ok: false, message: 'phone is required for admin login' });
      }
      if (!password) {
        return res.status(400).json({ ok: false, message: 'password is required for admin login' });
      }

      const vendor = await Vendor.findOne({ phone }).lean();
      if (!vendor || !vendor.adminPasswordHash) {
        return res.status(401).json({ ok: false, message: 'Invalid admin credentials' });
      }

      if (vendor.adminPasswordHash !== passwordHash) {
        return res.status(401).json({ ok: false, message: 'Invalid admin credentials' });
      }

      const token = signToken({ role: 'admin', vendorId: vendor.id, vendorName: vendor.companyName });
      return res.json({
        ok: true,
        token,
        role: 'admin',
        vendor: {
          id: vendor.id,
          companyName: vendor.companyName,
          ownerName: vendor.ownerName,
          phone: vendor.phone
        }
      });
    }

    if (role === 'driver') {
      if (!phone) {
        return res.status(400).json({ ok: false, message: 'phone is required for driver login' });
      }

      const driver = await Driver.findOne({ phone }).lean();
      if (!driver) {
        return res.status(401).json({ ok: false, message: 'Invalid driver credentials' });
      }

      const token = signToken({ role: 'driver', driverId: driver.id, vendorId: driver.vendorId, driverName: driver.name });
      return res.json({
        ok: true,
        token,
        role: 'driver',
        driver: {
          id: driver.id,
          vendorId: driver.vendorId,
          name: driver.name,
          phone: driver.phone
        }
      });
    }

    return res.status(400).json({ ok: false, message: 'Unsupported role. Use platform, admin, or driver.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error instanceof Error ? error.message : 'Login failed' });
  }
}

module.exports = {
  hashPassword,
  authRequired,
  requireRole,
  canAccessVendor,
  canAccessDriver,
  login
};
