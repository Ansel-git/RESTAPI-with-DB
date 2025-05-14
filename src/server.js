const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiter configuration
const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'blog_db'
};

// Create database pool
const pool = mysql.createPool(dbConfig);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes
// Get all posts
app.get('/posts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM posts');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Get single post
app.get('/posts/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching post' });
    }
});

// Create post
app.post('/posts', authenticateToken, async (req, res) => {
    const { title, content, author } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)',
            [title, content, author]
        );
        res.status(201).json({ id: result.insertId, title, content, author });
    } catch (error) {
        res.status(500).json({ error: 'Error creating post' });
    }
});

// Update post
app.put('/posts/:id', authenticateToken, async (req, res) => {
    const { title, content, author } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?',
            [title, content, author, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ id: req.params.id, title, content, author });
    } catch (error) {
        res.status(500).json({ error: 'Error updating post' });
    }
});

// Delete post
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting post' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // In a real application, you would validate against a database
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, 'your_jwt_secret_key', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 