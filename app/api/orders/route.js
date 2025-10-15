// app/api/orders/route.js
import connect from '../../../lib/mongoose';
import Order from '../../../models/Order';

const RZP_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RZP_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();

export async function POST(request) {
    try {
        // Environment check must be inside the handler (no top-level return)
        if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
            return new Response(
                JSON.stringify({ error: 'Payment gateway not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // parse body
        const body = await request.json();

        // Basic validation
        if (!body || !body.items || !Array.isArray(body.items) || !body.name || !body.email) {
            return new Response(
                JSON.stringify({ error: 'Missing order data' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // derive amount from items (items expected in rupees)
        const computedPaise = Math.round(
            (body.items || []).reduce((sum, it) => {
                const p = Number(it.price || 0);
                const q = Number(it.qty || 1);
                return sum + p * q;
            }, 0) * 100
        );

        const amountInPaise = computedPaise;
        const currency = body.currency || 'INR';

        // create basic auth header
        // NOTE: if you use the Edge runtime, Buffer may not be available; use btoa fallback or set runtime to 'nodejs'
        const basicAuth =
            (typeof Buffer !== 'undefined')
                ? Buffer.from(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`).toString('base64')
                : (typeof btoa !== 'undefined' ? btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`) : '');

        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuth}`,
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
            return new Response(
                JSON.stringify({ error: 'Failed to create razorpay order', detail: rzpData }),
                { status: 502, headers: { 'Content-Type': 'application/json' } }
            );
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

        return new Response(
            JSON.stringify({
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
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('POST /api/orders error', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
