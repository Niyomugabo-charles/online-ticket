const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const getEvents = async (req, res) => {
    try {
        const { category, search, sort, status = 'published' } = req.query;
        
        let query = `
            SELECT e.*, c.name as category_name, 
                   (SELECT MIN(price) FROM ticket_categories WHERE event_id = e.id) as starting_price,
                   (SELECT COUNT(DISTINCT o.id) FROM orders o WHERE o.event_id = e.id AND o.status = 'confirmed') as tickets_sold
            FROM events e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.status = ?
        `;
        const params = [status];
        
        if (category) {
            query += ' AND e.category_id = ?';
            params.push(category);
        }
        
        if (search) {
            query += ' AND (e.title LIKE ? OR e.venue_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (sort === 'date') {
            query += ' ORDER BY e.event_date ASC';
        } else if (sort === 'price') {
            query += ' ORDER BY starting_price ASC';
        } else {
            query += ' ORDER BY e.created_at DESC';
        }
        
        const [events] = await pool.query(query, params);
        
        res.json({ events });
        
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

const getEventById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [events] = await pool.query(
            `SELECT e.*, c.name as category_name, u.first_name, u.last_name, op.organisation_name
             FROM events e
             LEFT JOIN categories c ON e.category_id = c.id
             LEFT JOIN organiser_profiles op ON e.organiser_id = op.id
             LEFT JOIN users u ON op.user_id = u.id
             WHERE e.id = ?`,
            [id]
        );
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        const event = events[0];
        
        // Get ticket categories
        const [ticketCategories] = await pool.query(
            `SELECT * FROM ticket_categories WHERE event_id = ?`,
            [id]
        );
        
        // Get organiser's other events
        const [otherEvents] = await pool.query(
            `SELECT id, title, event_date, banner_image 
             FROM events 
             WHERE organiser_id = ? AND id != ? AND status = 'published'
             LIMIT 5`,
            [event.organiser_id, id]
        );
        
        res.json({
            ...event,
            ticket_categories: ticketCategories,
            other_events: otherEvents
        });
        
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

const createEvent = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            title, description, venue_name, venue_address, 
            event_date, event_time, category_id 
        } = req.body;
        
        // Get organiser profile ID
        const [profiles] = await connection.query(
            'SELECT id FROM organiser_profiles WHERE user_id = ? AND status = "approved"',
            [req.user.id]
        );
        
        if (profiles.length === 0) {
            return res.status(403).json({ error: 'No approved organiser profile found' });
        }
        
        const [result] = await connection.query(
            `INSERT INTO events (organiser_id, category_id, title, description, 
                                 venue_name, venue_address, event_date, event_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [profiles[0].id, category_id, title, description, 
             venue_name, venue_address, event_date, event_time]
        );
        
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Event created successfully',
            event_id: result.insertId 
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    } finally {
        connection.release();
    }
};

const updateEvent = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    try {
        // Check if event exists and user owns it
        const [events] = await pool.query(
            `SELECT e.*, op.user_id 
             FROM events e
             JOIN organiser_profiles op ON e.organiser_id = op.id
             WHERE e.id = ? AND op.user_id = ?`,
            [id, req.user.id]
        );
        
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
        
        const event = events[0];
        
        // Can't edit published events fully
        if (event.status === 'published') {
            // Only allow specific fields
            const allowedUpdates = ['description', 'banner_image'];
            const filteredUpdates = {};
            
            for (const key of allowedUpdates) {
                if (updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            }
            
            if (Object.keys(filteredUpdates).length === 0) {
                return res.status(400).json({ error: 'No editable fields provided for published event' });
            }
            
            await pool.query('UPDATE events SET ? WHERE id = ?', [filteredUpdates, id]);
        } else {
            // Draft events can be fully edited
            await pool.query('UPDATE events SET ? WHERE id = ?', [updates, id]);
        }
        
        res.json({ message: 'Event updated successfully' });
        
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

const publishEvent = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await pool.query(
            `UPDATE events e
             SET e.status = 'published'
             WHERE e.id = ? AND EXISTS (
                 SELECT 1 FROM organiser_profiles op 
                 WHERE op.id = e.organiser_id AND op.user_id = ?
             )`,
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
        
        res.json({ message: 'Event published successfully' });
        
    } catch (error) {
        console.error('Publish event error:', error);
        res.status(500).json({ error: 'Failed to publish event' });
    }
};

const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories');
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    publishEvent,
    getCategories,
    upload
};
const getMyEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [events] = await pool.query(
            `SELECT e.*, 
                    (SELECT COUNT(*) FROM ticket_categories tc WHERE tc.event_id = e.id) as ticket_categories_count,
                    (SELECT SUM(oi.quantity) FROM orders o 
                     JOIN order_items oi ON oi.order_id = o.id 
                     WHERE o.event_id = e.id AND o.status = 'confirmed') as tickets_sold,
                    (SELECT SUM(o.total_amount) FROM orders o 
                     WHERE o.event_id = e.id AND o.status = 'confirmed') as revenue
             FROM events e
             JOIN organiser_profiles op ON e.organiser_id = op.id
             WHERE op.user_id = ?
             ORDER BY e.created_at DESC`,
            [userId]
        );
        
        res.json({ events });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

const uploadEventImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/events/${req.file.filename}`;
    res.json({ image_url: imageUrl });
};

const deleteEvent = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await pool.query(
            `DELETE FROM events WHERE id = ? AND status = 'draft'`,
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found or cannot be deleted' });
        }
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

const getEventStats = async (req, res) => {
    try {
        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_events,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_events,
                SUM(CASE WHEN event_date > NOW() THEN 1 ELSE 0 END) as upcoming_events
             FROM events`
        );
        
        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Get event stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};