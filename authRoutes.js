const express = require('express');
const router = express.Router();
const { 
    register, 
    verifyEmail, 
    login, 
    forgotPassword, 
    resetPassword,
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, registerValidation, loginValidation } = require('../middleware/validation');

// Public routes
router.post('/register', validate(registerValidation), register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', validate(loginValidation), login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

module.exports = router;