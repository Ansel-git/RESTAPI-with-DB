const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// RATE LIMITER
app.use(rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 100
}));

// DATABASE SETUP
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'blog_db'
});

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Authentication token required' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT secret is not configured' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'JWT secret is not configured' });
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET);
        res.json({ 
            message: 'Login successful',
            token 
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// GET ALL POSTS
app.get('/posts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, title, content, author FROM posts');
        res.json({
            message: 'Posts retrieved successfully',
            data: rows
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// GET POST BY ID
app.get('/posts/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, title, content, author FROM posts WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
        res.json({
            message: 'Post retrieved successfully',
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching post' });
    }
});

// CREATE POST
app.post('/posts', authenticateToken, async (req, res) => {
    const { title, content, author } = req.body;
    
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)',
            [title, content, author]
        );
        res.status(201).json({
            message: 'Post created successfully',
            data: { id: result.insertId, title, content, author }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating post' });
    }
});

// UPDATE POST
app.put('/posts/:id', authenticateToken, async (req, res) => {
    const { title, content, author } = req.body;
    
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?',
            [title, content, author, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Post not found' });
        res.json({
            message: 'Post updated successfully',
            data: { id: req.params.id, title, content, author }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating post' });
    }
});

// DELETE POST
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Post not found' });
        res.json({
            message: 'Post deleted successfully',
            data: { id: req.params.id }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting post' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 