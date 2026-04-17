const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware');

// Add message to thread
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, threadId } = req.body;
    const thread = await prisma.thread.findUnique({ where: { id: parseInt(threadId) } });
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // Membership check
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: thread.projectId
        }
      }
    });

    if (!member && !req.user.isAdmin) return res.status(403).json({ error: 'Not a project member' });

    const message = await prisma.message.create({
      data: {
        content,
        threadId: parseInt(threadId),
        authorId: req.user.id
      },
      include: { author: true }
    });
    res.status(201).json(message);
  } catch (err) {
    console.error('Create message error:', err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Edit/Delete message
router.put('/:id', authenticate, async (req, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.authorId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(req.params.id) },
      data: { content: req.body.content },
      include: { author: true }
    });
    res.json(updatedMessage);
  } catch (err) {
    console.error('Update message error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.authorId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.message.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
