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
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Request body:', req.body);
    next();
});

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

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'JWT secret is not configured' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Login route - moved to top of routes
app.post('/login', (req, res) => {
    console.log('Login attempt:', req.body);
    
    // Get username and password from either form data or JSON body
    const username = req.body.username;
    const password = req.body.password;
    
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'JWT secret is not configured' });
    }

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check credentials against environment variables
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Routes
// Get all posts
app.get('/posts', async (req, res) => {
    try {
        console.log('Attempting to fetch posts...');
        console.log('Database config:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database
        });
        
        const [rows] = await pool.query('SELECT * FROM posts');
        console.log('Posts fetched successfully:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Detailed error in GET /posts:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            error: 'Error fetching posts',
            details: error.message 
        });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 