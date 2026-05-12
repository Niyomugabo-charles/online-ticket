-- Create Database
CREATE DATABASE IF NOT EXISTS event_ticketing;
USE event_ticketing;

-- Users Table (Single table with role discrimination)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('attendee', 'organiser', 'admin') DEFAULT 'attendee',
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_expires DATETIME,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Organiser Profile (Extended organiser information)
CREATE TABLE organiser_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    organisation_name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    contact_phone VARCHAR(50),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_status (status)
);

-- Event Categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_class VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organiser_id INT NOT NULL,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    banner_image VARCHAR(255),
    status ENUM('draft', 'published', 'cancelled', 'ended') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organiser_id) REFERENCES organiser_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_status_date (status, event_date),
    INDEX idx_organiser (organiser_id),
    INDEX idx_category (category_id)
);

-- Ticket Categories
CREATE TABLE ticket_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_quantity INT NOT NULL,
    sold_quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    max_per_order INT DEFAULT 10,
    refund_allowed BOOLEAN DEFAULT TRUE,
    refund_hours_before INT DEFAULT 48,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CHECK (sold_quantity + reserved_quantity <= total_quantity),
    CHECK (price >= 0),
    INDEX idx_event (event_id)
);

-- Orders Table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    attendee_id INT NOT NULL,
    event_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    service_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    reservation_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    FOREIGN KEY (attendee_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    INDEX idx_attendee (attendee_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);

-- Order Items
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    ticket_category_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    booking_reference VARCHAR(50) UNIQUE,
    qr_code TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id),
    INDEX idx_order (order_id),
    INDEX idx_booking_ref (booking_reference)
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_admin (admin_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

-- Insert Default Categories
INSERT INTO categories (name, description, icon_class) VALUES
('Music', 'Concerts, festivals, and live music performances', '🎵'),
('Sports', 'Football, basketball, tennis and other sports events', '⚽'),
('Theatre', 'Plays, musicals, and performing arts', '🎭'),
('Comedy', 'Stand-up comedy and comedy shows', '😂'),
('Conference', 'Business conferences and seminars', '💼'),
('Workshop', 'Educational workshops and training', '📚'),
('Community', 'Local community gatherings and events', '🏘️');

-- Insert Default Admin User (password: Admin123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('admin@eventticketing.com', '$2b$10$YourBcryptHashHere', 'System', 'Administrator', 'admin', TRUE);

-- Insert Sample Organiser
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('organiser@example.com', '$2b$10$YourBcryptHashHere', 'Event', 'Organiser', 'organiser', TRUE);

INSERT INTO organiser_profiles (user_id, organisation_name, description, status) VALUES
(2, 'Premium Events Co.', 'Leading event management company', 'approved');

-- Insert Sample Events
INSERT INTO events (organiser_id, category_id, title, description, venue_name, venue_address, event_date, event_time, status) VALUES
(1, 1, 'Summer Music Festival 2025', 'The biggest music festival of the summer featuring top artists', 'Central Park', 'New York, NY 10001', '2025-07-15', '14:00:00', 'published'),
(1, 2, 'Championship Final', 'Exciting football championship final match', 'National Stadium', 'London, UK', '2025-08-20', '19:30:00', 'published');

-- Insert Ticket Categories
INSERT INTO ticket_categories (event_id, name, price, total_quantity, max_per_order) VALUES
(1, 'General Admission', 49.99, 1000, 8),
(1, 'VIP', 149.99, 100, 4),
(1, 'Student', 29.99, 200, 4),
(2, 'Standard', 89.99, 500, 6),
(2, 'Premium', 199.99, 100, 4);