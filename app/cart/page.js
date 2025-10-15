// app/cart/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function readCart() {
    try {
        return JSON.parse(localStorage.getItem('bhg_cart') || '[]');
    } catch {
        return [];
    }
}

export default function CartPage() {
    const [items, setItems] = useState([]);
    const router = useRouter();

    useEffect(() => {
        setItems(readCart());
    }, []);

    function updateQty(index, qty) {
        const next = [...items];
        next[index].qty = Number(qty);
        setItems(next);
        localStorage.setItem('bhg_cart', JSON.stringify(next));
    }

    function removeItem(index) {
        const next = items.filter((_, i) => i !== index);
        setItems(next);
        localStorage.setItem('bhg_cart', JSON.stringify(next));
    }

    const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

    if (!items || items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <h1 className="text-2xl font-semibold mb-4">Cart</h1>
                <p>Your cart is empty. Browse <Link className="text-brand-accent underline" href="/books">books</Link>.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6">Cart</h1>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    {items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-4 border rounded p-3">
                            <img src={it.coverImage} alt={it.title} className="w-20 h-28 object-cover rounded" />
                            <div className="flex-1">
                                <h3 className="font-medium">{it.title}</h3>
                                <p className="text-sm text-gray-500">{it.authors?.join(', ')}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <input type="number" min="1" value={it.qty} onChange={(e) => updateQty(idx, e.target.value)} className="w-20 border rounded px-2 py-1" />
                                    <button onClick={() => removeItem(idx)} className="px-3 py-1 border rounded text-sm">Remove</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">₹{(it.price || 0).toFixed(2)}</div>
                                <div className="text-sm text-gray-500">x {it.qty}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border rounded p-4">
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    <div className="flex justify-between">
                        <div>Subtotal</div>
                        <div>₹{subtotal.toFixed(2)}</div>
                    </div>
                    <div className="mt-4">
                        <button className="w-full px-4 py-2 bg-brand-accent text-white rounded" onClick={() => {
                            // pass the cart to checkout page in sessionStorage and navigate
                            sessionStorage.setItem('bhg_checkout_cart', JSON.stringify(items));
                            router.push('/checkout');
                        }}>
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
