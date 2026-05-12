const express = require('express');
const router = express.Router();
const {
    applyForOrganiser,
    getApplicationStatus,
    getMyEvents,
    getEventSalesReport,
    addTicketCategory,
    updateTicketCategory,
    getEventAttendees,
    cancelEvent,
    getRevenueSummary
} = require('../controllers/organiserController');
const { authenticate, authorize } = require('../middleware/auth');

// All organiser routes require authentication
router.use(authenticate);

// Public (for authenticated users)
router.post('/apply', applyForOrganiser);
router.get('/application/status', getApplicationStatus);

// Organiser-only routes
router.use(authorize('organiser'));
router.get('/events', getMyEvents);
router.get('/sales/:eventId', getEventSalesReport);
router.get('/revenue', getRevenueSummary);
router.post('/ticket-category', addTicketCategory);
router.put('/ticket-category/:id', updateTicketCategory);
router.get('/event/:eventId/attendees', getEventAttendees);
router.post('/event/:eventId/cancel', cancelEvent);

module.exports = router;