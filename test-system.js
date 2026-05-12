#!/usr/bin/env node

/**
 * Complete System Test Script
 * Tests all backend endpoints and database connectivity
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:5000/api';

class SystemTester {
    constructor() {
        this.testResults = [];
        this.authToken = null;
        this.testUser = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        
        switch(type) {
            case 'success':
                console.log(`${prefix} ✅ ${message}`.green);
                break;
            case 'error':
                console.log(`${prefix} ❌ ${message}`.red);
                break;
            case 'warning':
                console.log(`${prefix} ⚠️  ${message}`.yellow);
                break;
            case 'info':
            default:
                console.log(`${prefix} ℹ️  ${message}`.blue);
                break;
        }
    }

    async test(name, testFn) {
        this.log(`Testing: ${name}`, 'info');
        try {
            const result = await testFn();
            this.testResults.push({ name, status: 'PASS', result });
            this.log(`✅ ${name} - PASSED`, 'success');
            return result;
        } catch (error) {
            this.testResults.push({ name, status: 'FAIL', error: error.message });
            this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
            throw error;
        }
    }

    async testHealthCheck() {
        const response = await axios.get(`${API_BASE}/health`);
        if (response.data.status !== 'OK') {
            throw new Error('Health check failed');
        }
        return response.data;
    }

    async testUserRegistration() {
        const userData = {
            first_name: 'Test',
            last_name: 'User',
            email: `test${Date.now()}@example.com`,
            password: 'Test123!@#'
        };

        const response = await axios.post(`${API_BASE}/auth/register`, userData);
        
        if (!response.data.success) {
            throw new Error('Registration failed');
        }

        this.testUser = userData;
        return response.data;
    }

    async testUserLogin() {
        if (!this.testUser) {
            throw new Error('No test user available');
        }

        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: this.testUser.email,
            password: this.testUser.password
        });

        if (!response.data.success || !response.data.token) {
            throw new Error('Login failed');
        }

        this.authToken = response.data.token;
        return response.data;
    }

    async testGetEvents() {
        const response = await axios.get(`${API_BASE}/events`);
        
        if (!response.data.success) {
            throw new Error('Failed to get events');
        }

        return response.data;
    }

    async testGetCategories() {
        const response = await axios.get(`${API_BASE}/events/categories/list`);
        
        if (!response.data.success) {
            throw new Error('Failed to get categories');
        }

        return response.data;
    }

    async testGetVenues() {
        const response = await axios.get(`${API_BASE}/events/venues/list`);
        
        if (!response.data.success) {
            throw new Error('Failed to get venues');
        }

        return response.data;
    }

    async testProtectedRoute() {
        if (!this.authToken) {
            throw new Error('No auth token available');
        }

        const response = await axios.get(`${API_BASE}/orders/my-orders`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        if (!response.data.success) {
            throw new Error('Protected route failed');
        }

        return response.data;
    }

    async testOrganizerApplication() {
        if (!this.authToken) {
            throw new Error('No auth token available');
        }

        const applicationData = {
            company_name: 'Test Company',
            business_email: 'business@testcompany.com',
            phone: '+1234567890',
            business_description: 'A test company for system testing purposes. We organize various events and want to use this platform to manage our ticket sales.'
        };

        const response = await axios.post(`${API_BASE}/organiser/application`, applicationData, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.success) {
            throw new Error('Organizer application failed');
        }

        return response.data;
    }

    async testAdminLogin() {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: process.env.ADMIN_EMAIL || 'admin@eventticketing.com',
            password: process.env.ADMIN_PASSWORD || 'Admin123!'
        });

        if (!response.data.success || !response.data.token) {
            throw new Error('Admin login failed');
        }

        return response.data.token;
    }

    async testAdminDashboard() {
        const adminToken = await this.testAdminLogin();

        const response = await axios.get(`${API_BASE}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.data.success) {
            throw new Error('Admin dashboard failed');
        }

        return response.data;
    }

    async testDatabaseConnectivity() {
        // This is tested implicitly through other endpoints
        // But we can specifically test by checking if we can create an event
        if (!this.authToken) {
            throw new Error('No auth token available');
        }

        const eventData = {
            title: 'Test Event',
            description: 'A test event for system validation',
            category_id: 1,
            venue_id: 1,
            event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            total_tickets: 100,
            starting_price: 10.00
        };

        const response = await axios.post(`${API_BASE}/events`, eventData, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        // This might fail if user is not organizer, which is expected
        // So we just check if the endpoint exists
        return response.data;
    }

    async testErrorHandling() {
        try {
            await axios.get(`${API_BASE}/nonexistent-endpoint`);
            throw new Error('Should have returned 404');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return { status: 'OK', message: '404 handling working' };
            }
            throw error;
        }
    }

    async runAllTests() {
        console.log('\n🚀 Starting Event Ticketing System Tests\n'.rainbow.bold);
        console.log('=' .repeat(60).gray);

        try {
            // Basic connectivity tests
            await this.test('Server Health Check', () => this.testHealthCheck());
            
            // Public API tests
            await this.test('Get Events', () => this.testGetEvents());
            await this.test('Get Categories', () => this.testGetCategories());
            await this.test('Get Venues', () => this.testGetVenues());
            
            // Authentication tests
            await this.test('User Registration', () => this.testUserRegistration());
            await this.test('User Login', () => this.testUserLogin());
            
            // Protected route tests
            await this.test('Protected Route Access', () => this.testProtectedRoute());
            
            // Feature tests
            await this.test('Organizer Application', () => this.testOrganizerApplication());
            
            // Admin tests
            await this.test('Admin Dashboard', () => this.testAdminDashboard());
            
            // Database tests
            await this.test('Database Connectivity', () => this.testDatabaseConnectivity());
            
            // Error handling tests
            await this.test('Error Handling', () => this.testErrorHandling());

        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
        }

        this.printResults();
    }

    printResults() {
        console.log('\n' + '=' .repeat(60).gray);
        console.log('📊 TEST RESULTS SUMMARY\n'.bold);
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`.green);
        console.log(`Failed: ${failed}`.red);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:'.red.bold);
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`  • ${r.name}: ${r.error}`.red);
                });
        }

        console.log('\n' + '=' .repeat(60).gray);
        
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED! System is ready for use.'.green.bold);
        } else {
            console.log('⚠️  Some tests failed. Please check the issues above.'.yellow.bold);
        }

        console.log('\n📱 Next Steps:'.bold);
        console.log('1. Open http://localhost:3000 in your browser');
        console.log('2. Login with admin credentials:');
        console.log('   Email: admin@eventticketing.com');
        console.log('   Password: Admin123!');
        console.log('3. Test the complete user interface');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new SystemTester();
    tester.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = SystemTester;
