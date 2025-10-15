// app/api/verify-payment/route.js
import connect from '../../../lib/mongoose';
import Order from '../../../models/Order';
import crypto from 'crypto';

const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request) {
    try {
        const body = await request.json();
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
            return new Response(JSON.stringify({ error: 'Missing verification fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Validate signature
        const generated = crypto.createHmac('sha256', RZP_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

        if (generated !== razorpay_signature) {
            // mark order as failed
            await connect();
            await Order.findOneAndUpdate({ orderId }, { status: 'failed', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature });
            return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // signature valid -> mark as paid
        await connect();
        const updated = await Order.findOneAndUpdate({ orderId }, { status: 'paid', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature }, { new: true });

        // TODO: send confirmation email (SendGrid) or update stock, send admin notification, etc.

        return new Response(JSON.stringify({ success: true, order: updated }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('verify-payment error', err);
        return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
