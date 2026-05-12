const express = require('express');
const router = express.Router();
const { 
    getEvents, 
    getEventById, 
    createEvent, 
    updateEvent, 
    publishEvent, 
    deleteEvent,
    getCategories,
    getEventStats,
    uploadEventImage,
    getMyEvents
} = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, eventValidation } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/events/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed'));
    }
});

// Public routes (no authentication required)
router.get('/', getEvents);
router.get('/categories', getCategories);
router.get('/stats', getEventStats);
router.get('/:id', getEventById);

// Organiser routes (require organiser role)
router.post('/', authenticate, authorize('organiser'), validate(eventValidation), createEvent);
router.put('/:id', authenticate, authorize('organiser'), updateEvent);
router.post('/:id/publish', authenticate, authorize('organiser'), publishEvent);
router.delete('/:id', authenticate, authorize('organiser'), deleteEvent);
router.post('/:id/upload-image', authenticate, authorize('organiser'), upload.single('image'), uploadEventImage);
router.get('/my/events', authenticate, authorize('organiser'), getMyEvents);

module.exports = router;