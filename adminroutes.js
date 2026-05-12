const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/activities', getRecentActivities);
router.get('/sales-report', getSalesReport);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);

// Organiser management
router.get('/organisers', getOrganisers);
router.get('/organisers/:id', getOrganiserById);
router.put('/organisers/:id/approve', approveOrganiser);
router.put('/organisers/:id/reject', rejectOrganiser);

// Event management
router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.delete('/events/:id', deleteEvent);

// Applications
router.get('/applications', getOrganiserApplications);

// System settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

module.exports = router;