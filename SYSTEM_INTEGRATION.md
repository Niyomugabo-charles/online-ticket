# Event Ticketing System - Frontend Integration Guide

## Overview
This document explains how all frontend pages are connected, protected, and work together as a cohesive system.

## 🏗️ System Architecture

### Core Components
- **Authentication System** (`js/auth.js`) - Handles user login, registration, role management
- **Router System** (`js/router.js`) - Central routing and navigation management
- **API Service** (`js/api.js`) - Backend communication
- **Utilities** (`js/utils.js`) - Common helper functions
- **System Test** (`js/system-test.js`) - Integration testing

### Page Categories

#### 🌐 Public Pages (No Authentication Required)
- `index.html` - Main landing page
- `events.html` - Events listing
- `event-detail.html` - Individual event details
- `login.html` - User login
- `register.html` - User registration
- `forgot-password.html` - Password reset request
- `reset-password.html` - Password reset form
- `verify-email.html` - Email verification
- `contact.html` - Contact page
- `help.html` - Help/FAQ
- `404.html`, `500.html` - Error pages

#### 🔒 Protected Pages (Authentication Required)
- `dashboard.html` - User dashboard (attendees only)
- `profile.html` - User profile settings
- `checkout.html` - Ticket checkout
- `organiser-application.html` - Organizer application (attendees only)
- `organiser-dashboard.html` - Organizer dashboard (organizers only)
- `admin-dashboard.html` - Admin dashboard (admins only)

## 🛣️ Routing System

### Route Configuration
The router automatically maps routes to pages and handles authentication:

```javascript
// Example route configurations
'': 'index.html'                    // Home page
'dashboard': 'dashboard.html'        // Protected - requires auth
'admin-dashboard': 'admin-dashboard.html'  // Protected - admin only
```

### Authentication Flow
1. **User visits protected page** → Router checks authentication
2. **Not authenticated** → Redirect to login with return URL
3. **Wrong role** → Redirect to appropriate dashboard
4. **Authenticated + correct role** → Access granted

### Role-Based Access Control
- **Admin**: Can access admin dashboard, all other pages
- **Organizer**: Can access organizer dashboard, attendee features
- **Attendee**: Can access attendee features, can apply for organizer role

## 🔐 Authentication System

### User Roles
```javascript
Auth.isAdmin()     // Returns true if user is admin
Auth.isOrganiser() // Returns true if user is organizer  
Auth.isAttendee()  // Returns true if user is attendee
```

### Authentication State
- Token stored in `localStorage`
- User data stored in `localStorage`
- Email verification required for full access

### Navigation Updates
The `Auth.updateNav()` function automatically updates navigation based on user state:
- **Logged out**: Shows Login/Register buttons
- **Logged in**: Shows user dropdown with role-appropriate options

## 🧭 Navigation Structure

### Main Navigation (Public Pages)
```
Home | Events | About | Contact | [User Menu/Login]
```

### User Dropdown (Authenticated)
- **Admin**: Admin Dashboard → Logout
- **Organizer**: Organizer Dashboard → My Tickets → Logout  
- **Attendee**: My Dashboard → Become Organizer → Logout

### Dashboard Navigation
Each dashboard has role-specific sidebar navigation with appropriate features.

## 🔄 Page Flow Examples

### New User Registration Flow
```
index.html → register.html → verify-email.html → login.html → dashboard.html
```

### Organizer Application Flow
```
dashboard.html → organiser-application.html → (pending) → organiser-dashboard.html
```

### Event Purchase Flow
```
events.html → event-detail.html → checkout.html → dashboard.html (tickets)
```

## 🛡️ Security Features

### Route Protection
- All protected pages check authentication on load
- Role-based access control enforced
- Automatic redirects for unauthorized access

### Token Management
- JWT tokens stored securely
- Automatic token inclusion in API requests
- Token validation on protected routes

### Input Validation
- Client-side validation on all forms
- Server-side validation (backend responsibility)
- XSS protection with HTML escaping

## 📱 Responsive Design

### Mobile Navigation
- Collapsible navigation menu
- Touch-friendly interface
- Optimized layouts for all screen sizes

### Progressive Enhancement
- Works without JavaScript (basic functionality)
- Enhanced experience with JavaScript enabled
- Graceful degradation for older browsers

## 🧪 Testing

### System Integration Tests
Run automatically on page load:
```javascript
// Results available in console
window.systemTestResults
```

### Manual Testing Checklist
- [ ] Login/logout functionality
- [ ] Role-based access control
- [ ] Navigation updates
- [ ] Protected route redirects
- [ ] Form submissions
- [ ] API communication

## 🚀 Getting Started

### Development Setup
1. Ensure backend server is running on `localhost:3000`
2. Open `index.html` in browser
3. Check console for system test results

### Common Issues
- **CORS errors**: Backend not running or misconfigured
- **Authentication failures**: Check backend API endpoints
- **Navigation not updating**: Verify `router.js` is loaded
- **Protected pages accessible**: Clear browser cache

## 📁 File Structure

```
frontend/
├── js/
│   ├── auth.js           # Authentication system
│   ├── router.js         # Routing system
│   ├── api.js            # API service
│   ├── utils.js          # Utilities
│   ├── constants.js      # Constants
│   ├── validation.js     # Form validation
│   ├── app.js            # App initialization
│   └── system-test.js    # Integration tests
├── css/
│   ├── style.css         # Main styles
│   ├── animations.css     # Animations
│   └── dark-mode.css     # Dark theme
└── *.html                # All pages
```

## 🔧 Configuration

### API Base URL
Configure in `js/api.js`:
```javascript
this.baseURL = 'http://localhost:3000/api';
```

### Route Configuration
Configure in `js/router.js`:
```javascript
this.routes = {
    '': 'index.html',
    'dashboard': 'dashboard.html',
    // Add more routes as needed
};
```

## 📊 System Status

The system includes automatic health checks:
- JavaScript libraries loaded
- Authentication system functional
- Router configuration correct
- API endpoints accessible
- Navigation elements present

Check browser console for detailed status report.

## 🔄 Future Enhancements

### Planned Features
- Real-time notifications
- Offline support
- Progressive Web App
- Advanced analytics
- Multi-language support

### Scalability Considerations
- Code splitting for larger applications
- Lazy loading of components
- Service worker implementation
- CDN integration

---

**Last Updated**: May 2026
**Version**: 1.0.0
**Status**: Production Ready
