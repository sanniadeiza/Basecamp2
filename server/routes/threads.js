const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, isProjectMember, isAdmin } = require('../middleware');

// Only admin can create/edit/delete threads
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, content, projectId } = req.body;
    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        projectId: parseInt(projectId),
        creatorId: req.user.id
      }
    });
    res.status(201).json(thread);
  } catch (err) {
    console.error('Create thread error:', err);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const thread = await prisma.thread.update({
      where: { id: parseInt(req.params.id) },
      data: { title, content }
    });
    res.json(thread);
  } catch (err) {
    console.error('Update thread error:', err);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await prisma.thread.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    console.error('Delete thread error:', err);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// Get thread with messages (Project members only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const thread = await prisma.thread.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        creator: true,
        messages: {
          include: { author: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    
    // Verify project membership
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: thread.projectId
        }
      }
    });
    
    if (!member && !req.user.isAdmin) return res.status(403).json({ error: 'Not a project member' });
    
    res.json(thread);
  } catch (err) {
    console.error('Get thread error:', err);
    res.status(500).json({ error: 'Failed to fetch thread details' });
  }
});

module.exports = router;
