import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, initDb } from './src/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ghost-town-secret-key-123';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  await initDb();

  // Middleware to authenticate JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/register', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const { username, password } = req.body;
    
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        [username, passwordHash]
      );
      res.status(201).json({ message: 'User registered' });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const { username, password } = req.body;

    try {
      const [users]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      const user = users[0];

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, username: user.username });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // API Routes
  app.get('/api/links', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    try {
      const [rows] = await pool.query(`
        SELECT l.*, u.username as addedBy 
        FROM ghost_links l 
        LEFT JOIN users u ON l.userId = u.id 
        ORDER BY l.addedAt DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch links' });
    }
  });

  app.post('/api/links', authenticateToken, async (req: any, res: any) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const { id, url, title, description, addedAt, lastAccessed } = req.body;
    const userId = req.user.id;

    try {
      await pool.query(
        'INSERT INTO ghost_links (id, url, title, description, addedAt, lastAccessed, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, url, title, description, addedAt, lastAccessed, userId]
      );
      res.status(201).json({ message: 'Link added' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add link' });
    }
  });

  app.delete('/api/links/:id', authenticateToken, async (req: any, res: any) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    
    const admins = ['asan', 'alish'];
    if (!admins.includes(req.user.username.toLowerCase())) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    try {
      await pool.query('DELETE FROM ghost_links WHERE id = ?', [req.params.id]);
      res.json({ message: 'Link deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  app.patch('/api/links/:id/revive', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const lastAccessed = Date.now();
    try {
      await pool.query('UPDATE ghost_links SET lastAccessed = ? WHERE id = ?', [lastAccessed, req.params.id]);
      res.json({ lastAccessed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to revive link' });
    }
  });

  app.get('/api/links/random', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    try {
      const [rows]: any = await pool.query('SELECT id FROM ghost_links ORDER BY RAND() LIMIT 1');
      if (rows.length === 0) return res.status(404).json({ error: 'No links found' });
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch random link' });
    }
  });

  // Comment Routes
  app.get('/api/links/:id/comments', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    try {
      const [rows] = await pool.query(`
        SELECT c.*, u.username 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.link_id = ? 
        ORDER BY c.created_at ASC
      `, [req.params.id]);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.post('/api/comments', authenticateToken, async (req: any, res: any) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const { linkId, content } = req.body;
    const userId = req.user.id;

    try {
      const [result]: any = await pool.query(
        'INSERT INTO comments (link_id, user_id, content) VALUES (?, ?, ?)',
        [linkId, userId, content]
      );
      res.status(201).json({ 
        id: result.insertId, 
        link_id: linkId, 
        user_id: userId, 
        content, 
        username: req.user.username, 
        created_at: new Date() 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  // Global Chat Routes
  app.get('/api/chat/global', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    try {
      const [rows] = await pool.query(`
        SELECT m.*, u.username 
        FROM global_messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at DESC 
        LIMIT 50
      `);
      res.json((rows as any[]).reverse());
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/global', authenticateToken, async (req: any, res: any) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const { message } = req.body;
    const userId = req.user.id;

    try {
      const [result]: any = await pool.query(
        'INSERT INTO global_messages (user_id, message) VALUES (?, ?)',
        [userId, message]
      );
      res.status(201).json({ 
        id: result.insertId, 
        user_id: userId, 
        message, 
        username: req.user.username, 
        created_at: new Date() 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
