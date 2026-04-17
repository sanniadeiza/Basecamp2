const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, isProjectMember, isAdmin } = require('../middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only png, jpg, pdf, txt are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Projects CRUD
router.get('/', authenticate, async (req, res) => {
  try {
    // If admin, show all projects. If user, show only member projects.
    let projects;
    if (req.user.isAdmin) {
      projects = await prisma.project.findMany({ include: { owner: true } });
    } else {
      projects = await prisma.project.findMany({
        where: { members: { some: { userId: req.user.id } } },
        include: { owner: true }
      });
    }
    res.json(projects);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id }
        }
      }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/:projectId', authenticate, isProjectMember, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.projectId) },
      include: {
        owner: true,
        members: { include: { user: true } },
        attachments: { include: { user: true } },
        threads: { include: { creator: true } }
      }
    });
    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

router.put('/:projectId', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.projectId) },
      data: { name, description }
    });
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:projectId', authenticate, isAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.projectId) } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Attachments
router.post('/:projectId/attachments', authenticate, isProjectMember, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const format = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  // Double check format against allowed list
  if (!['png', 'jpg', 'jpeg', 'pdf', 'txt'].includes(format)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid file format' });
  }

  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.originalname,
      format: format === 'jpeg' ? 'jpg' : format,
      url: `/uploads/${req.file.filename}`,
      projectId: parseInt(req.params.projectId),
      userId: req.user.id
    }
  });
  res.status(201).json(attachment);
});

router.delete('/:projectId/attachments/:id', authenticate, isProjectMember, async (req, res) => {
  try {
    const attachmentId = parseInt(req.params.id);
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    // Only creator or project/system admin can delete
    if (attachment.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this attachment' });
    }

    // Delete from DB first
    await prisma.attachment.delete({ where: { id: attachment.id } });

    // Try to delete from disk (optional, won't crash if it fails)
    try {
      // Remove leading slash if present to join correctly
      const relativePath = attachment.url.startsWith('/') ? attachment.url.substring(1) : attachment.url;
      const filePath = path.join(__dirname, '..', relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.error('File cleanup failed:', fsErr);
      // We don't return error to user if only disk cleanup failed
    }

    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    console.error('Attachment deletion error:', err);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

module.exports = router;
