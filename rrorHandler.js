const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Duplicate entry', field: err.sqlMessage });
    }
    
    if (err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ error: 'Invalid reference' });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Default error
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorHandler;