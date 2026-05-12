// Complete API Service with all endpoints
const API_BASE_URL = 'http://localhost:5000/api';

class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: this.getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ============ AUTH ENDPOINTS ============
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async verifyEmail(token) {
        return this.request(`/auth/verify-email/${token}`);
    }

    async login(credentials) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(token, password) {
        return this.request(`/auth/reset-password/${token}`, {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    logout() {
        this.setToken(null);
        window.location.href = '/';
    }

    // ============ EVENT ENDPOINTS ============
    async getEvents(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/events${params ? '?' + params : ''}`);
    }

    async getEvent(id) {
        return this.request(`/events/${id}`);
    }

    async getCategories() {
        return this.request('/events/categories');
    }

    async getEventStats() {
        return this.request('/events/stats');
    }

    async createEvent(eventData) {
        return this.request('/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    async updateEvent(id, eventData) {
        return this.request(`/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
    }

    async publishEvent(id) {
        return this.request(`/events/${id}/publish`, {
            method: 'POST'
        });
    }

    async deleteEvent(id) {
        return this.request(`/events/${id}`, {
            method: 'DELETE'
        });
    }

    async uploadEventImage(id, file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${API_BASE_URL}/events/${id}/upload-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
        
        return response.json();
    }

    async getMyEvents() {
        return this.request('/events/my/events');
    }

    // ============ ORDER ENDPOINTS ============
    async reserveTickets(ticketCategoryId, quantity) {
        return this.request('/orders/reserve', {
            method: 'POST',
            body: JSON.stringify({ 
                ticket_category_id: ticketCategoryId, 
                quantity 
            })
        });
    }

    async confirmOrder(orderData) {
        return this.request('/orders/confirm', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getReservationStatus(reservationId) {
        return this.request(`/orders/reservation/${reservationId}`);
    }

    async getMyOrders() {
        return this.request('/orders');
    }

    async getOrderDetails(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    async cancelOrder(orderId) {
        return this.request(`/orders/${orderId}/cancel`, {
            method: 'POST'
        });
    }

    async requestRefund(orderId) {
        return this.request(`/orders/${orderId}/refund`, {
            method: 'POST'
        });
    }

    async downloadTicket(orderId) {
        return this.request(`/orders/${orderId}/download`);
    }

    // ============ ORGANISER ENDPOINTS ============
    async applyOrganiser(organisationData) {
        return this.request('/organiser/apply', {
            method: 'POST',
            body: JSON.stringify(organisationData)
        });
    }

    async getApplicationStatus() {
        return this.request('/organiser/application/status');
    }

    async getOrganiserEvents() {
        return this.request('/organiser/events');
    }

    async getEventSalesReport(eventId) {
        return this.request(`/organiser/sales/${eventId}`);
    }

    async getRevenueSummary() {
        return this.request('/organiser/revenue');
    }

    async addTicketCategory(categoryData) {
        return this.request('/organiser/ticket-category', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateTicketCategory(id, categoryData) {
        return this.request(`/organiser/ticket-category/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async getEventAttendees(eventId) {
        return this.request(`/organiser/event/${eventId}/attendees`);
    }

    async cancelOrganiserEvent(eventId) {
        return this.request(`/organiser/event/${eventId}/cancel`, {
            method: 'POST'
        });
    }

    // ============ ADMIN ENDPOINTS ============
    async getDashboardStats() {
        return this.request('/admin/dashboard');
    }

    async getUsers(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/admin/users${params ? '?' + params : ''}`);
    }

    async getUserById(userId) {
        return this.request(`/admin/users/${userId}`);
    }

    async suspendUser(userId) {
        return this.request(`/admin/users/${userId}/suspend`, {
            method: 'PUT'
        });
    }

    async activateUser(userId) {
        return this.request(`/admin/users/${userId}/activate`, {
            method: 'PUT'
        });
    }

    async deleteUser(userId) {
        return this.request(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async getOrganisers() {
        return this.request('/admin/organisers');
    }

    async getOrganiserById(organiserId) {
        return this.request(`/admin/organisers/${organiserId}`);
    }

    async approveOrganiser(organiserId) {
        return this.request(`/admin/organisers/${organiserId}/approve`, {
            method: 'PUT'
        });
    }

    async rejectOrganiser(organiserId, reason) {
        return this.request(`/admin/organisers/${organiserId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async getAdminEvents(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/admin/events${params ? '?' + params : ''}`);
    }

    async getAdminEventById(eventId) {
        return this.request(`/admin/events/${eventId}`);
    }

    async deleteAdminEvent(eventId) {
        return this.request(`/admin/events/${eventId}`, {
            method: 'DELETE'
        });
    }

    async getOrganiserApplications() {
        return this.request('/admin/applications');
    }

    async getRecentActivities() {
        return this.request('/admin/activities');
    }

    async getSystemSettings() {
        return this.request('/admin/settings');
    }

    async updateSystemSettings(settings) {
        return this.request('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    async getSalesReport(startDate, endDate) {
        const params = new URLSearchParams({ startDate, endDate });
        return this.request(`/admin/sales-report?${params}`);
    }
}

// Create global instance
const api = new API();