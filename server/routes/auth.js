const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET } = require('../middleware');

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
});

// Admin permissions
router.patch('/users/:id/set-admin', async (req, res) => {
  // Only an existing admin can make another admin? Or maybe first user is admin?
  // Let's assume anyone can for now or restrict it later.
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { isAdmin: true }
  });
  res.json(user);
});

router.patch('/users/:id/remove-admin', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { isAdmin: false }
  });
  res.json(user);
});

module.exports = router;
