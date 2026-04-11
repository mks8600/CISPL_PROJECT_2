import jwt from 'jsonwebtoken';

// Verify JWT token from Authorization header
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Restrict access to specific portal types
export function requirePortal(...portals) {
  return (req, res, next) => {
    if (!req.user || !portals.includes(req.user.portalType)) {
      return res.status(403).json({ error: 'Access denied for this portal type' });
    }
    next();
  };
}
