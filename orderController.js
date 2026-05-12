const { pool } = require('../config/database');
const { sendEmail } = require('../config/email');
const QRCode = require('qrcode');
const crypto = require('crypto');

const reserveTickets = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { ticket_category_id, quantity } = req.body;
        const attendeeId = req.user.id;
        
        // Lock the ticket category row for update
        const [categories] = await connection.query(
            'SELECT * FROM ticket_categories WHERE id = ? FOR UPDATE',
            [ticket_category_id]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({ error: 'Ticket category not found' });
        }
        
        const category = categories[0];
        const available = category.total_quantity - category.sold_quantity - category.reserved_quantity;
        
        if (quantity > category.max_per_order) {
            return res.status(400).json({ error: `Maximum ${category.max_per_order} tickets per order` });
        }
        
        if (quantity > available) {
            return res.status(409).json({ error: 'Not enough tickets available' });
        }
        
        // Check for existing active reservation
        const [existing] = await connection.query(
            `SELECT id FROM orders 
             WHERE attendee_id = ? AND status = 'pending' 
             AND reservation_expires > NOW()`,
            [attendeeId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'You have an existing pending reservation' });
        }
        
        // Create order with reservation
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        const unitPrice = parseFloat(category.price);
        const subtotal = unitPrice * quantity;
        const serviceFee = subtotal * (parseFloat(process.env.SERVICE_FEE_PERCENTAGE) / 100);
        const totalAmount = subtotal + serviceFee;
        const reservationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_number, attendee_id, event_id, status, 
                                 subtotal, service_fee, total_amount, reservation_expires)
             VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
            [orderNumber, attendeeId, category.event_id, subtotal, serviceFee, totalAmount, reservationExpires]
        );
        
        // Create order item
        const [itemResult] = await connection.query(
            `INSERT INTO order_items (order_id, ticket_category_id, quantity, unit_price, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [orderResult.insertId, ticket_category_id, quantity, unitPrice, subtotal]
        );
        
        // Update reserved quantity
        await connection.query(
            'UPDATE ticket_categories SET reserved_quantity = reserved_quantity + ? WHERE id = ?',
            [quantity, ticket_category_id]
        );
        
        await connection.commit();
        
        res.status(201).json({
            message: 'Tickets reserved successfully',
            reservation_id: orderResult.insertId,
            order_number: orderNumber,
            expires_at: reservationExpires,
            total_amount: totalAmount
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Reservation error:', error);
        res.status(500).json({ error: 'Reservation failed' });
    } finally {
        connection.release();
    }
};

const confirmOrder = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { order_id, payment_method, payment_details } = req.body;
        const attendeeId = req.user.id;
        
        // Get order with lock
        const [orders] = await connection.query(
            `SELECT o.*, e.title as event_title, e.event_date 
             FROM orders o
             JOIN events e ON o.event_id = e.id
             WHERE o.id = ? AND o.attendee_id = ? AND o.status = 'pending' 
             AND o.reservation_expires > NOW()
             FOR UPDATE`,
            [order_id, attendeeId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired reservation' });
        }
        
        const order = orders[0];
        
        // Simulate payment processing
        const paymentReference = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
        const paymentSuccess = simulatePayment(payment_details);
        
        if (!paymentSuccess) {
            return res.status(400).json({ error: 'Payment declined' });
        }
        
        // Get order items
        const [orderItems] = await connection.query(
            `SELECT oi.*, tc.event_id, tc.name as ticket_name
             FROM order_items oi
             JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
             WHERE oi.order_id = ?`,
            [order_id]
        );
        
        // Update ticket quantities
        for (const item of orderItems) {
            await connection.query(
                `UPDATE ticket_categories 
                 SET sold_quantity = sold_quantity + ?, 
                     reserved_quantity = reserved_quantity - ?
                 WHERE id = ?`,
                [item.quantity, item.quantity, item.ticket_category_id]
            );
        }
        
        // Generate booking references and QR codes
        for (const item of orderItems) {
            for (let i = 0; i < item.quantity; i++) {
                const bookingRef = 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
                const qrData = JSON.stringify({
                    booking_ref: bookingRef,
                    event: order.event_title,
                    attendee_id: attendeeId,
                    order_id: order_id
                });
                const qrCode = await QRCode.toDataURL(qrData);
                
                // Store each ticket individually (simplified - in production use separate table)
            }
        }
        
        // Update order
        await connection.query(
            `UPDATE orders 
             SET status = 'confirmed', 
                 payment_method = ?, 
                 payment_reference = ?,
                 confirmed_at = NOW()
             WHERE id = ?`,
            [payment_method, paymentReference, order_id]
        );
        
        await connection.commit();
        
        // Send confirmation email
        await sendConfirmationEmail(order, orderItems, req.user.email);
        
        res.json({
            message: 'Order confirmed successfully',
            order_number: order.order_number,
            payment_reference: paymentReference,
            total_amount: order.total_amount
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Order confirmation error:', error);
        res.status(500).json({ error: 'Order confirmation failed' });
    } finally {
        connection.release();
    }
};

const simulatePayment = (paymentDetails) => {
    // Simple simulation - accept any card ending with 4242
    const cardNumber = paymentDetails?.card_number || '';
    return cardNumber.endsWith('4242') || cardNumber === 'test';
};

const sendConfirmationEmail = async (order, items, userEmail) => {
    const itemsHtml = items.map(item => `
        <tr>
            <td>${item.ticket_name}</td>
            <td>${item.quantity}</td>
            <td>$${item.unit_price}</td>
            <td>$${item.quantity * item.unit_price}</td>
        </tr>
    `).join('');
    
    const html = `
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been confirmed.</p>
        <h3>Order Number: ${order.order_number}</h3>
        <table border="1" cellpadding="10" style="border-collapse: collapse;">
            <thead>
                <tr><th>Ticket Type</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
                ${itemsHtml}
                <tr>
                    <td colspan="3" align="right"><strong>Subtotal:</strong></td>
                    <td>$${order.subtotal}</td>
                </tr>
                <tr>
                    <td colspan="3" align="right"><strong>Service Fee:</strong></td>
                    <td>$${order.service_fee}</td>
                </tr>
                <tr>
                    <td colspan="3" align="right"><strong>Total:</strong></td>
                    <td><strong>$${order.total_amount}</strong></td>
                </tr>
            </tbody>
        </table>
        <p>You can download your e-tickets from your dashboard.</p>
    `;
    
    await sendEmail(userEmail, `Order Confirmed - ${order.order_number}`, html);
};

const getMyOrders = async (req, res) => {
    const attendeeId = req.user.id;
    
    try {
        const [orders] = await pool.query(
            `SELECT o.*, e.title as event_title, e.event_date, e.venue_name,
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as ticket_count
             FROM orders o
             JOIN events e ON o.event_id = e.id
             WHERE o.attendee_id = ?
             ORDER BY o.created_at DESC`,
            [attendeeId]
        );
        
        res.json({ orders });
        
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const getOrderDetails = async (req, res) => {
    const { id } = req.params;
    const attendeeId = req.user.id;
    
    try {
        const [orders] = await pool.query(
            `SELECT o.*, e.title as event_title, e.event_date, e.event_time, 
                    e.venue_name, e.venue_address
             FROM orders o
             JOIN events e ON o.event_id = e.id
             WHERE o.id = ? AND o.attendee_id = ?`,
            [id, attendeeId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = orders[0];
        
        const [items] = await pool.query(
            `SELECT oi.*, tc.name as ticket_category_name
             FROM order_items oi
             JOIN ticket_categories tc ON oi.ticket_category_id = tc.id
             WHERE oi.order_id = ?`,
            [id]
        );
        
        res.json({ order, items });
        
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

module.exports = {
    reserveTickets,
    confirmOrder,
    getMyOrders,
    getOrderDetails
};