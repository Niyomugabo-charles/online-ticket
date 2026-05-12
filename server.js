const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { pool, testConnection, initializeDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper function to serve HTML files
const serveHTMLFile = (filename) => {
    return (req, res) => {
        const filePath = path.join(__dirname, '../frontend', filename);
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
        }
    };
};

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const orderRoutes = require('./routes/orderRoutes');
const organiserRoutes = require('./routes/organiserRoutes');
const adminRoutes = require('./routes/adminRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/organiser', organiserRoutes);
app.use('/api/admin', adminRoutes);

// Frontend page routes
app.get('/', serveHTMLFile('index.html'));
app.get('/events', serveHTMLFile('events.html'));
app.get('/events.html', serveHTMLFile('events.html'));
app.get('/event-detail', serveHTMLFile('event-detail.html'));
app.get('/event-detail.html', serveHTMLFile('event-detail.html'));
app.get('/login', serveHTMLFile('login.html'));
app.get('/login.html', serveHTMLFile('login.html'));
app.get('/register', serveHTMLFile('register.html'));
app.get('/register.html', serveHTMLFile('register.html'));
app.get('/forgot-password', serveHTMLFile('forgot-password.html'));
app.get('/forgot-password.html', serveHTMLFile('forgot-password.html'));
app.get('/reset-password', serveHTMLFile('reset-password.html'));
app.get('/reset-password.html', serveHTMLFile('reset-password.html'));
app.get('/verify-email', serveHTMLFile('verify-email.html'));
app.get('/verify-email.html', serveHTMLFile('verify-email.html'));
app.get('/contact', serveHTMLFile('contact.html'));
app.get('/contact.html', serveHTMLFile('contact.html'));
app.get('/help', serveHTMLFile('help.html'));
app.get('/help.html', serveHTMLFile('help.html'));
app.get('/dashboard', serveHTMLFile('dashboard.html'));
app.get('/dashboard.html', serveHTMLFile('dashboard.html'));
app.get('/profile', serveHTMLFile('profile.html'));
app.get('/profile.html', serveHTMLFile('profile.html'));
app.get('/checkout', serveHTMLFile('checkout.html'));
app.get('/checkout.html', serveHTMLFile('checkout.html'));
app.get('/organiser-application', serveHTMLFile('organiser-application.html'));
app.get('/organiser-application.html', serveHTMLFile('organiser-application.html'));
app.get('/organiser-dashboard', serveHTMLFile('organiser-dashboard.html'));
app.get('/organiser-dashboard.html', serveHTMLFile('organiser-dashboard.html'));
app.get('/admin-dashboard', serveHTMLFile('admin-dashboard.html'));
app.get('/admin-dashboard.html', serveHTMLFile('admin-dashboard.html'));
app.get('/about', serveHTMLFile('about.html'));
app.get('/about.html', serveHTMLFile('about.html'));
app.get('/terms', serveHTMLFile('terms.html'));
app.get('/terms.html', serveHTMLFile('terms.html'));
app.get('/privacy', serveHTMLFile('privacy.html'));
app.get('/privacy.html', serveHTMLFile('privacy.html'));
app.get('/faq', serveHTMLFile('faq.html'));
app.get('/faq.html', serveHTMLFile('faq.html'));
app.get('/tickets', serveHTMLFile('tickets.html'));
app.get('/tickets.html', serveHTMLFile('tickets.html'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// 404 handler for frontend pages
app.use('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API route not found' });
    } else {
        res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
    }
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await testConnection();
        await initializeDatabase();
        
        // Create uploads directory if not exists
        const fs = require('fs');
        const uploadDirs = ['uploads', 'uploads/events', 'uploads/tickets', 'uploads/applications'];
        uploadDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📡 CORS enabled for frontend applications`);
            console.log(`🗄️ Database connected and initialized`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();