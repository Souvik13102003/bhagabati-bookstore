// app/api/orders/route.js
import connect from '../../../lib/mongoose';
import Order from '../../../models/Order';

const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body || !body.amount || !body.currency || !body.items || !body.name || !body.email) {
            return new Response(JSON.stringify({ error: 'Missing order data' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const amountInPaise = Math.round(Number(body.amount) * 100); // e.g. ₹199 => 19900
        const currency = body.currency || 'INR';

        // Create Razorpay order via REST API
        const auth = Buffer.from(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`).toString('base64');

        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency,
                receipt: `rcpt_${Date.now()}`,
                payment_capture: 1 // auto-capture
            })
        });

        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) {
            console.error('Razorpay order create failed', rzpData);
            return new Response(JSON.stringify({ error: 'Failed to create razorpay order', detail: rzpData }), { status: 502, headers: { 'Content-Type': 'application/json' } });
        }

        // Save order in DB
        await connect();
        const orderDoc = await Order.create({
            orderId: `order_${Date.now()}`, // local id
            razorpayOrderId: rzpData.id,
            amount: amountInPaise,
            currency,
            status: 'created',
            name: body.name,
            email: body.email,
            phone: body.phone || '',
            address: body.address || {},
            items: body.items || [],
            metadata: body.metadata || {}
        });

        return new Response(JSON.stringify({
            success: true,
            order: {
                id: orderDoc.orderId,
                razorpayOrderId: rzpData.id,
                amount: amountInPaise,
                currency
            },
            rzp: {
                id: rzpData.id,
                amount: rzpData.amount,
                currency: rzpData.currency
            },
            key: RZP_KEY_ID
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('POST /api/orders error', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
