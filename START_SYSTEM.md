# Event Ticketing System - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
1. **Node.js** (v16 or higher)
2. **MySQL** (v8 or higher)
3. **Git** (for version control)

### Step 1: Database Setup

1. **Install MySQL** if not already installed
2. **Create database** (optional - server will create it automatically):
   ```sql
   CREATE DATABASE event_ticketing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. **Update database credentials** in `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=event_ticketing
   ```

### Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** in `.env`:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # Database (update with your credentials)
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=event_ticketing

   # JWT Secret (change this in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h

   # Email (use Mailtrap for development)
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-user
   SMTP_PASS=your-mailtrap-password
   EMAIL_FROM=noreply@eventticketing.com

   # Admin Account
   ADMIN_EMAIL=admin@eventticketing.com
   ADMIN_PASSWORD=Admin123!

   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads

   # Service Fee (%)
   SERVICE_FEE_PERCENTAGE=5
   ```

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

   The server will:
   - Connect to MySQL database
   - Initialize all tables automatically
   - Create default admin user
   - Start listening on port 5000

### Step 3: Frontend Setup

1. **Open frontend directory** in a separate terminal:
   ```bash
   cd frontend
   ```

2. **Start a local server** (any of these options):

   **Option A: Live Server (VS Code)**
   - Install Live Server extension in VS Code
   - Right-click `index.html` → "Open with Live Server"

   **Option B: Python Server**
   ```bash
   python -m http.server 3000
   ```

   **Option C: Node Server**
   ```bash
   npx serve . -p 3000
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Access Points

### Default Admin Account
- **Email**: admin@eventticketing.com
- **Password**: Admin123!

### Main Pages
- **Home**: http://localhost:3000/index.html
- **Events**: http://localhost:3000/events.html
- **Login**: http://localhost:3000/login.html
- **Register**: http://localhost:3000/register.html

### Dashboards
- **User Dashboard**: http://localhost:3000/dashboard.html
- **Organizer Dashboard**: http://localhost:3000/organiser-dashboard.html
- **Admin Dashboard**: http://localhost:3000/admin-dashboard.html

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email/:token` - Email verification
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password/:token` - Reset password

### Events
- `GET /api/events` - Get all events
- `GET /api/events/featured` - Get featured events
- `GET /api/events/:id` - Get event details
- `GET /api/events/categories/list` - Get categories
- `GET /api/events/venues/list` - Get venues

### Orders
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Organizer
- `POST /api/organiser/application` - Submit application
- `GET /api/organiser/dashboard` - Organizer dashboard
- `GET /api/organiser/events` - Get organizer events

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/applications` - Get applications

## 🛡️ Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **CORS Protection** for cross-origin requests
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with HTML escaping
- **File Upload Security** with type and size validation

## 📊 Database Schema

The system automatically creates these tables:
- `users` - User accounts and roles
- `categories` - Event categories
- `venues` - Event venues
- `events` - Event information
- `ticket_categories` - Ticket types and prices
- `orders` - User orders
- `order_items` - Order line items
- `organiser_applications` - Organizer applications

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### System Test
Open the frontend in browser and check console for automatic system test results.

### Manual Testing
1. Register a new user account
2. Verify email (check console for token)
3. Login and access dashboard
4. Create/submit organizer application
5. Admin approves application
6. Test event creation and booking

## 🔍 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists or can be created

**CORS Errors**
- Check backend is running on port 5000
- Verify frontend is on port 3000
- Check CORS configuration in server.js

**Email Not Working**
- Use Mailtrap for development
- Update SMTP credentials in `.env`
- Check email templates in services/emailService.js

**File Upload Issues**
- Ensure `uploads` directories exist
- Check file size limits in `.env`
- Verify file permissions

### Logs
- **Backend Console**: Server startup and API requests
- **Browser Console**: Frontend errors and system tests
- **Network Tab**: API request/response debugging

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-production-secret-key
DB_HOST=your-production-db-host
# ... other production settings
```

### Security Checklist
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Configure production database
- [ ] Set up production email service
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up monitoring

## 📞 Support

If you encounter issues:
1. Check console logs
2. Verify database connection
3. Test API endpoints individually
4. Review this guide
5. Check the system documentation in `frontend/SYSTEM_INTEGRATION.md`

---

**System Status**: ✅ Ready to use
**Last Updated**: May 2026
**Version**: 1.0.0
