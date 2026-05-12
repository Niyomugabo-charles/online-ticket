const express = require('express');
const router = express.Router();
const { 
    reserveTickets, 
    confirmOrder, 
    getMyOrders, 
    getOrderDetails,
    cancelOrder,
    requestRefund,
    downloadTicket,
    getReservationStatus
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// All order routes require authentication and attendee role
router.use(authenticate);
router.use(authorize('attendee'));

// Order management
router.post('/reserve', reserveTickets);
router.post('/confirm', confirmOrder);
router.get('/reservation/:reservationId', getReservationStatus);
router.get('/', getMyOrders);
router.get('/:id', getOrderDetails);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/refund', requestRefund);
router.get('/:id/download', downloadTicket);

module.exports = router;