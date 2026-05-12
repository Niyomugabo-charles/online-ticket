// Page Router
const routes = {
    '/': 'home',
    '/events.html': 'events',
    '/event-detail.html': 'eventDetail',
    '/login.html': 'login',
    '/register.html': 'register',
    '/dashboard.html': 'dashboard',
    '/organiser-dashboard.html': 'organiserDashboard',
    '/admin.html': 'adminDashboard',
    '/checkout.html': 'checkout'
};

// Load page based on current path
async function loadPage() {
    const path = window.location.pathname;
    const pageName = routes[path] || 'home';
    
    if (typeof window[`load${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`] === 'function') {
        await window[`load${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`]();
    }
}

// Home Page
window.loadHome = async function() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
        <div class="hero-section text-center py-5">
            <h1 class="display-4">Discover Amazing Events</h1>
            <p class="lead">Find and book tickets for the best events in town</p>
            <a href="/events.html" class="btn btn-primary btn-lg">Browse Events</a>
        </div>
        
        <div class="featured-events mt-5">
            <h2 class="text-center mb-4">Featured Events</h2>
            <div id="featured-events-list" class="row g-4"></div>
        </div>
    `;
    
    // Load featured events
    try {
        const data = await api.getEvents({ limit: 6 });
        const container = document.getElementById('featured-events-list');
        container.innerHTML = renderEventCards(data.events || []);
    } catch (error) {
        console.error('Error loading events:', error);
    }
};

// Events Page
window.loadEvents = async function() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <div class="filter-sidebar">
                    <h4>Filters</h4>
                    <div class="mb-3">
                        <label class="form-label">Category</label>
                        <select id="category-filter" class="form-select">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Search</label>
                        <input type="text" id="search-filter" class="form-control" placeholder="Search events...">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Sort By</label>
                        <select id="sort-filter" class="form-select">
                            <option value="date">Date (Newest)</option>
                            <option value="price">Price (Lowest)</option>
                        </select>
                    </div>
                    <button id="apply-filters" class="btn btn-primary w-100">Apply Filters</button>
                </div>
            </div>
            <div class="col-md-9">
                <div id="events-list" class="row g-4"></div>
            </div>
        </div>
    `;
    
    // Load categories
    try {
        const categories = await api.getCategories();
        const categorySelect = document.getElementById('category-filter');
        categories.categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    
    // Load events
    await loadFilteredEvents();
    
    // Setup filters
    document.getElementById('apply-filters').addEventListener('click', loadFilteredEvents);
    document.getElementById('search-filter').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadFilteredEvents();
    });
};

async function loadFilteredEvents() {
    const filters = {
        category: document.getElementById('category-filter')?.value,
        search: document.getElementById('search-filter')?.value,
        sort: document.getElementById('sort-filter')?.value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    try {
        const data = await api.getEvents(filters);
        const container = document.getElementById('events-list');
        
        if (!data.events || data.events.length === 0) {
            container.innerHTML = '<div class="col-12 text-center">No events found</div>';
            return;
        }
        
        container.innerHTML = renderEventCards(data.events);
    } catch (error) {
        console.error('Error loading filtered events:', error);
    }
}

function renderEventCards(events) {
    return events.map(event => `
        <div class="col-md-6 col-lg-4">
            <div class="event-card card h-100">
                <img src="${event.banner_image || 'https://via.placeholder.com/300x200'}" 
                     class="card-img-top event-card-img" alt="${event.title}">
                <div class="card-body">
                    <span class="badge bg-primary mb-2">${event.category_name || 'Event'}</span>
                    <h5 class="card-title">${escapeHtml(event.title)}</h5>
                    <p class="card-text text-muted">
                        <i class="fas fa-calendar"></i> ${new Date(event.event_date).toLocaleDateString()}<br>
                        <i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.venue_name)}<br>
                        <i class="fas fa-tag"></i> Starting from $${event.starting_price || 'N/A'}
                    </p>
                    <a href="/event-detail.html?id=${event.id}" class="btn btn-outline-primary">View Details</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Login Page
window.loadLogin = function() {
    if (Auth.isAuthenticated()) {
        window.location.href = '/';
        return;
    }
    
    const content = document.getElementById('page-content');
    content.innerHTML = `
        <div class="form-container">
            <h2 class="form-title">Login to Your Account</h2>
            <form id="login-form">
                <div class="mb-3">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" required>
                </div>
                <div class="mb-3">
                    <a href="/forgot-password.html">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
                <div class="text-center mt-3">
                    <a href="/register.html">Don't have an account? Register</a>
                </div>
            </form>
            <div id="login-message" class="mt-3"></div>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const result = await Auth.login(email, password);
        const messageDiv = document.getElementById('login-message');
        
        if (result.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        }
    });
};

// Register Page
window.loadRegister = function() {
    if (Auth.isAuthenticated()) {
        window.location.href = '/';
        return;
    }
    
    const content = document.getElementById('page-content');
    content.innerHTML = `
        <div class="form-container">
            <h2 class="form-title">Create an Account</h2>
            <form id="register-form">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="first_name" class="form-label">First Name</label>
                        <input type="text" class="form-control" id="first_name" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="last_name" class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="last_name" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" required>
                    <small class="text-muted">Must be 8+ chars with uppercase, number, and special character</small>
                </div>
                <div class="mb-3">
                    <label for="confirm_password" class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" id="confirm_password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Register</button>
                <div class="text-center mt-3">
                    <a href="/login.html">Already have an account? Login</a>
                </div>
            </form>
            <div id="register-message" class="mt-3"></div>
        </div>
    `;
    
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password !== confirmPassword) {
            document.getElementById('register-message').innerHTML = 
                '<div class="alert alert-danger">Passwords do not match</div>';
            return;
        }
        
        const userData = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            password: password
        };
        
        const result = await Auth.register(userData);
        const messageDiv = document.getElementById('register-message');
        
        if (result.success) {
            messageDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 3000);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        }
    });
};

// Dashboard Page
window.loadDashboard = async function() {
    if (!Auth.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    
    const content = document.getElementById('page-content');
    content.innerHTML = `
        <h2>My Tickets</h2>
        <div id="orders-list" class="mt-4"></div>
    `;
    
    try {
        const data = await api.getMyOrders();
        const container = document.getElementById('orders-list');
        
        if (!data.orders || data.orders.length === 0) {
            container.innerHTML = '<div class="alert alert-info">You have no orders yet. <a href="/events.html">Browse events</a></div>';
            return;
        }
        
        container.innerHTML = data.orders.map(order => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">${escapeHtml(order.event_title)}</h5>
                            <p class="card-text">
                                <small class="text-muted">
                                    Order #: ${order.order_number}<br>
                                    Date: ${new Date(order.event_date).toLocaleDateString()}<br>
                                    Venue: ${escapeHtml(order.venue_name)}<br>
                                    Tickets: ${order.ticket_count}
                                </small>
                            </p>
                        </div>
                        <div class="text-end">
                            <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                            <div class="mt-2">$${order.total_amount}</div>
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="viewOrder(${order.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
};

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-warning',
        'confirmed': 'bg-success',
        'cancelled': 'bg-danger',
        'refunded': 'bg-info'
    };
    return classes[status] || 'bg-secondary';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNav();
    loadPage();
});