# Event Ticketing System - Page Structure Organization

## 📁 Current Directory Structure

All pages are correctly organized in the main `frontend/` directory. Here's the complete breakdown:

### 🌐 **Public Pages** (No Authentication Required)
```
frontend/
├── index.html              # 🏠 Landing page / Home
├── events.html             # 📅 Events listing
├── event-detail.html       # 🎫 Individual event details
├── login.html              # 🔐 User login
├── register.html           # 📝 User registration
├── forgot-password.html    # 🔑 Password reset request
├── reset-password.html     # 🔒 Password reset form
├── verify-email.html       # ✉️ Email verification
├── contact.html            # 📧 Contact page
├── help.html               # ❓ Help/FAQ
├── 404.html                # 🚫 Not found error
└── 500.html                # ⚠️ Server error
```

### 🔒 **Protected Pages** (Authentication Required)
```
frontend/
├── dashboard.html          # 👤 User dashboard (attendees)
├── profile.html            # ⚙️ User profile settings
├── checkout.html           # 💳 Ticket checkout
├── organiser-application.html # 📋 Organizer application
├── organiser-dashboard.html # 🎪 Organizer dashboard
└── admin-dashboard.html    # 👑 Admin dashboard
```

### 🎨 **Assets & Resources**
```
frontend/
├── style.css               # 🎨 Main styles
├── animations.css          # ✨ Animations
├── dark-mode.css           # 🌙 Dark theme
└── js/                     # 📜 JavaScript files
    ├── api.js              # 🌐 API service
    ├── auth.js             # 🔐 Authentication
    ├── router.js           # 🛣️ Routing system
    ├── utils.js            # 🛠️ Utilities
    ├── app.js              # 🚀 App initialization
    ├── constants.js        # 📊 Constants
    ├── validation.js       # ✅ Form validation
    └── system-test.js      # 🧪 Integration tests
```

## 🔄 **Page Flow & Navigation**

### **Main User Journey**
```
index.html → events.html → event-detail.html → checkout.html → dashboard.html
```

### **Authentication Flow**
```
register.html → verify-email.html → login.html → dashboard.html
```

### **Organizer Flow**
```
dashboard.html → organiser-application.html → organiser-dashboard.html
```

### **Admin Flow**
```
login.html (admin) → admin-dashboard.html
```

## 📍 **Each Page's Purpose & Location**

### **🏠 index.html** - **HOME PAGE**
- **Location**: `frontend/index.html` ✅
- **Purpose**: Main landing page with featured events
- **Access**: Public
- **Navigation**: Central hub for all user journeys

### **📅 events.html** - **EVENTS LISTING**
- **Location**: `frontend/events.html` ✅
- **Purpose**: Browse all events with filtering
- **Access**: Public
- **Navigation**: Linked from home page

### **🎫 event-detail.html** - **EVENT DETAILS**
- **Location**: `frontend/event-detail.html` ✅
- **Purpose**: View individual event information
- **Access**: Public (but shows different options for logged-in users)
- **Navigation**: Linked from events listing

### **🔐 login.html** - **USER LOGIN**
- **Location**: `frontend/login.html` ✅
- **Purpose**: User authentication
- **Access**: Public
- **Navigation**: Entry point for returning users

### **📝 register.html** - **USER REGISTRATION**
- **Location**: `frontend/register.html` ✅
- **Purpose**: New user account creation
- **Access**: Public
- **Navigation**: Entry point for new users

### **✉️ verify-email.html** - **EMAIL VERIFICATION**
- **Location**: `frontend/verify-email.html` ✅
- **Purpose**: Email verification after registration
- **Access**: Public (via email link)
- **Navigation**: Part of registration flow

### **🔑 forgot-password.html** - **FORGOT PASSWORD**
- **Location**: `frontend/forgot-password.html` ✅
- **Purpose**: Password reset request
- **Access**: Public
- **Navigation**: Linked from login page

### **🔒 reset-password.html** - **RESET PASSWORD**
- **Location**: `frontend/reset-password.html` ✅
- **Purpose**: Set new password
- **Access**: Public (via email link)
- **Navigation**: Part of password reset flow

### **👤 dashboard.html** - **USER DASHBOARD**
- **Location**: `frontend/dashboard.html` ✅
- **Purpose**: User's personal dashboard (attendees)
- **Access**: Protected (authenticated users only)
- **Navigation**: Main hub for logged-in users

### **⚙️ profile.html** - **USER PROFILE**
- **Location**: `frontend/profile.html` ✅
- **Purpose**: User profile and settings
- **Access**: Protected (authenticated users only)
- **Navigation**: Linked from dashboard

### **💳 checkout.html** - **TICKET CHECKOUT**
- **Location**: `frontend/checkout.html` ✅
- **Purpose**: Purchase tickets
- **Access**: Protected (authenticated users only)
- **Navigation**: Linked from event details

### **📋 organiser-application.html** - **ORGANIZER APPLICATION**
- **Location**: `frontend/organiser-application.html` ✅
- **Purpose**: Apply to become event organizer
- **Access**: Protected (attendees only)
- **Navigation**: Linked from user dashboard

### **🎪 organiser-dashboard.html** - **ORGANIZER DASHBOARD**
- **Location**: `frontend/organiser-dashboard.html` ✅
- **Purpose**: Event management for organizers
- **Access**: Protected (organizers only)
- **Navigation**: Main hub for organizers

### **👑 admin-dashboard.html** - **ADMIN DASHBOARD**
- **Location**: `frontend/admin-dashboard.html` ✅
- **Purpose**: System administration
- **Access**: Protected (admins only)
- **Navigation**: Main hub for administrators

### **📧 contact.html** - **CONTACT PAGE**
- **Location**: `frontend/contact.html` ✅
- **Purpose**: Contact information and form
- **Access**: Public
- **Navigation**: Linked from main navigation

### **❓ help.html** - **HELP/FAQ**
- **Location**: `frontend/help.html` ✅
- **Purpose**: Help documentation and FAQ
- **Access**: Public
- **Navigation**: Linked from main navigation

### **🚫 404.html** - **NOT FOUND**
- **Location**: `frontend/404.html` ✅
- **Purpose**: 404 error page
- **Access**: Public (error handling)
- **Navigation**: Error page

### **⚠️ 500.html** - **SERVER ERROR**
- **Location**: `frontend/500.html` ✅
- **Purpose**: 500 error page
- **Access**: Public (error handling)
- **Navigation**: Error page

## ✅ **Status: All Pages Correctly Positioned**

All pages are currently in their optimal locations:

1. **Public pages** are in the main frontend directory for easy access
2. **Protected pages** have proper authentication guards
3. **Navigation flows** are logical and user-friendly
4. **File organization** follows web development best practices
5. **URL structure** is clean and intuitive

## 🔄 **Navigation Verification**

Each page has proper navigation to/from other pages:

- **Main navigation** connects all public pages
- **User dropdown** provides role-appropriate links
- **Breadcrumbs** and back buttons for easy navigation
- **Authentication redirects** ensure proper flow
- **Error pages** handle invalid routes gracefully

## 🎯 **Page Access Control Summary**

| Page | Access Level | Authentication Required | Role Required |
|------|-------------|------------------------|---------------|
| index.html | Public | ❌ | None |
| events.html | Public | ❌ | None |
| event-detail.html | Public | ❌ | None |
| login.html | Public | ❌ | None |
| register.html | Public | ❌ | None |
| verify-email.html | Public | ❌ | None |
| forgot-password.html | Public | ❌ | None |
| reset-password.html | Public | ❌ | None |
| contact.html | Public | ❌ | None |
| help.html | Public | ❌ | None |
| 404.html | Public | ❌ | None |
| 500.html | Public | ❌ | None |
| dashboard.html | Protected | ✅ | Attendee |
| profile.html | Protected | ✅ | Any User |
| checkout.html | Protected | ✅ | Any User |
| organiser-application.html | Protected | ✅ | Attendee |
| organiser-dashboard.html | Protected | ✅ | Organizer |
| admin-dashboard.html | Protected | ✅ | Admin |

---

**✅ Conclusion**: All pages are correctly positioned and organized according to their function and access requirements. The structure supports optimal user experience and security.
