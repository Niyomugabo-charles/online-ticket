const { body, validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        
        res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    };
};

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim()
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

const eventValidation = [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('venue_name').notEmpty().trim(),
    body('venue_address').optional().trim(),
    body('event_date').isDate(),
    body('event_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('category_id').isInt({ min: 1 })
];

module.exports = { validate, registerValidation, loginValidation, eventValidation };