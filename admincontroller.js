const { pool } = require('../config/database');

const getDashboardStats = async (req, res) => {
    try {
        const [userStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'organiser' THEN 1 ELSE 0 END) as total_organisers,
                SUM(CASE WHEN role = 'attendee' THEN 1 ELSE 0 END) as total_attendees,
                SUM(CASE WHEN is_suspended = 1 THEN 1 ELSE 0 END) as suspended_users
             FROM users`
        );
        
        const [eventStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_events,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_events,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_events
             FROM events`
        );
        
        const [orderStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders
             FROM orders`
        );
        
        const [monthlyRevenue] = await pool.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(total_amount) as revenue
             FROM orders
             WHERE status = 'confirmed' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC`
        );
        
        const [categoryDistribution] = await pool.query(
            `SELECT 
                c.name as category,
                COUNT(e.id) as count
             FROM categories c
             LEFT JOIN events e ON e.category_id = c.id
             WHERE e.status = 'published'
             GROUP BY c.id`
        );
        
        res.json({
            users: userStats[0],
            events: eventStats[0],
            orders: orderStats[0],
            monthly_revenue: monthlyRevenue,
            category_distribution: categoryDistribution
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

const getUsers = async (req, res) => {
    const { search, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = 'SELECT id, email, first_name, last_name, role, is_verified, is_suspended, created_at FROM users WHERE 1=1';
        const params = [];
        
        if (search) {
            query += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (role && role !== 'all') {
            query += ' AND role = ?';
            params.push(role);
        }
        
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM (${query}) as t`, params);
        const total = countResult[0].total;
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [users] = await pool.query(query, params);
        
        res.json({
            users,
            total,
            page: parseInt(page),
            total_pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const suspendUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [id]);
        res.json({ message: 'User suspended successfully' });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ error: 'Failed to suspend user' });
    }
};

const activateUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query('UPDATE users SET is_suspended = FALSE WHERE id = ?', [id]);
        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Anonymize user data instead of hard delete
        await pool.query(
            `UPDATE users SET 
                email = CONCAT('deleted_', id, '@deleted.com'),
                first_name = 'Deleted',
                last_name = 'User',
                password_hash = 'deleted'
             WHERE id = ?`,
            [id]
        );
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

const getOrganiserApplications = async (req, res) => {
    try {
        const [applications] = await pool.query(
            `SELECT op.*, u.email, u.first_name, u.last_name, u.created_at as submitted_at
             FROM organiser_profiles op
             JOIN users u ON op.user_id = u.id
             WHERE op.status = 'pending'
             ORDER BY op.created_at DESC`
        );
        
        res.json({ applications });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

const approveOrganiser = async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query(
            'UPDATE organiser_profiles SET status = "approved", reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
            [req.user.id, id]
        );
        
        res.json({ message: 'Organiser approved successfully' });
    } catch (error) {
        console.error('Approve organiser error:', error);
        res.status(500).json({ error: 'Failed to approve organiser' });
    }
};

const rejectOrganiser = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    try {
        await pool.query(
            'UPDATE organiser_profiles SET status = "rejected", rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
            [reason, req.user.id, id]
        );
        
        res.json({ message: 'Organiser rejected' });
    } catch (error) {
        console.error('Reject organiser error:', error);
        res.status(500).json({ error: 'Failed to reject organiser' });
    }
};

const getEvents = async (req, res) => {
    const { search, status, category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT e.*, u.email as organiser_email, op.organisation_name,
                   (SELECT COUNT(*) FROM orders o WHERE o.event_id = e.id AND o.status = 'confirmed') as tickets_sold,
                   (SELECT SUM(o.total_amount) FROM orders o WHERE o.event_id = e.id AND o.status = 'confirmed') as revenue
            FROM events e
            JOIN organiser_profiles op ON e.organiser_id = op.id
            JOIN users u ON op.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ' AND (e.title LIKE ? OR e.venue_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (status && status !== 'all') {
            query += ' AND e.status = ?';
            params.push(status);
        }
        
        if (category && category !== 'all') {
            query += ' AND e.category_id = ?';
            params.push(category);
        }
        
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM (${query}) as t`, params);
        const total = countResult[0].total;
        
        query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [events] = await pool.query(query, params);
        
        res.json({
            events,
            total,
            page: parseInt(page),
            total_pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

const deleteEvent = async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

const getRecentActivities = async (req, res) => {
    try {
        const [activities] = await pool.query(
            `SELECT * FROM audit_logs 
             ORDER BY created_at DESC 
             LIMIT 20`
        );
        
        res.json({ activities });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

const getSystemSettings = async (req, res) => {
    try {
        const [settings] = await pool.query(
            `SELECT * FROM system_settings LIMIT 1`
        );
        
        res.json({ settings: settings[0] || {} });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

const updateSystemSettings = async (req, res) => {
    const { service_fee_percentage, reservation_timeout, max_tickets_per_order } = req.body;
    
    try {
        await pool.query(
            `INSERT INTO system_settings (service_fee_percentage, reservation_timeout, max_tickets_per_order) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             service_fee_percentage = ?, reservation_timeout = ?, max_tickets_per_order = ?`,
            [service_fee_percentage, reservation_timeout, max_tickets_per_order,
             service_fee_percentage, reservation_timeout, max_tickets_per_order]
        );
        
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    getUserById,
    suspendUser,
    activateUser,
    deleteUser,
    getOrganisers,
    getOrganiserById,
    approveOrganiser,
    rejectOrganiser,
    getEvents,
    getEventById,
    deleteEvent,
    getOrganiserApplications,
    getRecentActivities,
    getSystemSettings,
    updateSystemSettings,
    getSalesReport
};