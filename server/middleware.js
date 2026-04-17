const jwt = require('jsonwebtoken');
const prisma = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'basecamp_secret';

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const isProjectMember = async (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.projectId);
  if (!projectId) return res.status(400).json({ error: 'Project ID required' });

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: req.user.id,
        projectId: projectId,
      },
    },
  });

  if (!member && !req.user.isAdmin) {
    // Admins can see everything, or only if explicitly added? Basecamp usually allows admins to see all.
    // But for this project, let's say only members or admins.
    return res.status(403).json({ error: 'Not a project member' });
  }
  next();
};

module.exports = { authenticate, isAdmin, isProjectMember, JWT_SECRET };
