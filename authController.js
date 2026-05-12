const { pool } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const { sendEmail } = require('../config/email');
const crypto = require('crypto');

const register = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { email, password, first_name, last_name } = req.body;
        
        // Check if user exists
        const [existing] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Create user (auto-verified for now to avoid email issues)
        const [result] = await connection.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
             VALUES (?, ?, ?, ?, TRUE)`,
            [email, hashedPassword, first_name, last_name]
        );
        
        // Send verification email (optional - don't fail if email doesn't work)
        try {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
            const emailSent = await sendEmail(
                email,
                'Verify Your Email',
                `<h1>Welcome to Event Ticketing!</h1>
                 <p>Please click the link below to verify your email:</p>
                 <a href="${verificationUrl}">${verificationUrl}</a>
                 <p>This link expires in 24 hours.</p>`
            );
            
            if (!emailSent) {
                console.log('Email failed but registration continues');
            }
        } catch (emailError) {
            console.log('Email error:', emailError.message);
            // Continue with registration even if email fails
        }
        
        res.status(201).json({ 
            message: 'Registration successful! You can now login.',
            userId: result.insertId
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    } finally {
        connection.release();
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;
    
    try {
        const [users] = await pool.query(
            'UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE email_verification_token = ?',
            [token]
        );
        
        if (users.affectedRows === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        
        res.json({ message: 'Email verified successfully! You can now login.' });
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Get user
        const [users] = await pool.query(
            `SELECT id, email, password_hash, role, email_verified
             FROM users WHERE email = ?`,
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Check if account is locked (simplified for now)
        // Note: Account locking functionality can be added later
        
        // Verify password
        const validPassword = await comparePassword(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Email verification check removed since users are auto-verified
        
        // Failed attempts tracking removed
        
        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        const [users] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length > 0) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            
            await pool.query(
                'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
                [resetToken, resetExpires, users[0].id]
            );
            
            // Send email (optional - don't fail if email doesn't work)
            try {
                const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
                const emailSent = await sendEmail(
                    email,
                    'Password Reset Request',
                    `<h1>Reset Your Password</h1>
                     <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
                     <a href="${resetUrl}">${resetUrl}</a>
                     <p>If you didn't request this, please ignore this email.</p>`
                );
                
                if (!emailSent) {
                    console.log('Password reset email failed but request continues');
                }
            } catch (emailError) {
                console.log('Password reset email error:', emailError.message);
                // Continue even if email fails
            }
        }
        
        // Always return success to prevent email enumeration
        res.json({ message: 'If your email is registered, you will receive a reset link.' });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    
    try {
        const [users] = await pool.query(
            'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
            [token]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        
        const hashedPassword = await hashPassword(password);
        
        await pool.query(
            'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [hashedPassword, users[0].id]
        );
        
        res.json({ message: 'Password reset successful! You can now login.' });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
};

module.exports = {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword
};
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query(
            `SELECT id, email, first_name, last_name, role, email_verified, created_at 
             FROM users WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name } = req.body;
        
        await pool.query(
            'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
            [first_name, last_name, userId]
        );
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const changePassword = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;
        
        const [users] = await connection.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );
        
        const validPassword = await comparePassword(current_password, users[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        const hashedPassword = await hashPassword(new_password);
        await connection.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    } finally {
        connection.release();
    }
};