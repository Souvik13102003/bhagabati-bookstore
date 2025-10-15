// app/checkout/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function readCheckoutCart() {
    try {
        return JSON.parse(sessionStorage.getItem('bhg_checkout_cart') || localStorage.getItem('bhg_cart') || '[]');
    } catch { return []; }
}

export default function CheckoutPage() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        setItems(readCheckoutCart());
    }, []);

    const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handlePay(e) {
        e.preventDefault();
        setError(null);

        if (!form.name || !form.email) {
            setError('Please provide name and email');
            return;
        }
        if (!items.length) {
            setError('Cart empty');
            return;
        }

        setLoading(true);
        try {
            // create order server-side
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: subtotal,
                    currency: 'INR',
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: {
                        line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode, country: 'India'
                    },
                    items
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || 'Failed to create order');
                setLoading(false);
                return;
            }

            // rename to avoid shadowing
            const { rzp: rzpResp, order, key } = data;

            // open Razorpay checkout
            const options = {
                key: key, // razorpay key id (public)
                amount: rzpResp.amount, // in paise
                currency: rzpResp.currency,
                name: 'Bhagabati Publication',
                description: `Order ${order.id}`,
                order_id: rzpResp.id, // razorpay order id
                handler: async function (response) {
                    // response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
                    try {
                        const verifyRes = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: order.id
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.success) {
                            localStorage.removeItem('bhg_cart');
                            sessionStorage.removeItem('bhg_checkout_cart');
                            alert('Payment successful — order confirmed');
                            router.push('/orders');
                        } else {
                            console.error('verify failed', verifyData);
                            alert('Payment verification failed');
                        }
                    } catch (err) {
                        console.error('verify error', err);
                        alert('Error verifying payment');
                    }
                },
                prefill: {
                    name: form.name,
                    email: form.email,
                    contact: form.phone
                },
                theme: { color: '#ff6600' }
            };

            // load script & open
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setError('Failed to load payment gateway');
                setLoading(false);
                return;
            }

            const rzpInstance = new window.Razorpay(options);
            rzpInstance.open();

        } catch (err) {
            console.error(err);
            setError('Unexpected error during payment');
        } finally {
            setLoading(false);
        }
    }

    function loadRazorpayScript() {
        return new Promise((resolve) => {
            if (typeof window === 'undefined') return resolve(false);
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    if (!items || items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
                <p>Your cart is empty. Add items to cart before checkout.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
            {error && <div className="p-2 bg-red-100 text-red-700 mb-4 rounded">{error}</div>}
            <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={handlePay} className="space-y-4">
                    <div>
                        <label className="block text-sm">Full name</label>
                        <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm">Email</label>
                        <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm">Phone (optional)</label>
                        <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm">Address line 1</label>
                        <input name="line1" value={form.line1} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm">City</label>
                        <input name="city" value={form.city} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <button type="submit" className="px-4 py-2 bg-brand-accent text-white rounded" disabled={loading}>
                            {loading ? 'Processing...' : `Pay ₹${subtotal.toFixed(2)}`}
                        </button>
                    </div>
                </form>

                <div className="border rounded p-4">
                    <h3 className="font-semibold mb-3">Order summary</h3>
                    {items.map((it, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                            <div>
                                <div className="font-medium">{it.title}</div>
                                <div className="text-sm text-gray-500">Qty: {it.qty}</div>
                            </div>
                            <div>₹{((it.price || 0) * (it.qty || 1)).toFixed(2)}</div>
                        </div>
                    ))}
                    <div className="flex justify-between font-semibold mt-3">
                        <div>Total</div>
                        <div>₹{subtotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
