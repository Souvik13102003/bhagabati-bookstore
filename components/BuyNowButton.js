// components/BuyNowButton.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyNowButton({ book, qty = 1, className = '' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  async function handleBuy(e) {
    e?.preventDefault?.();
    setLoading(true);

    try {
      // minimal prompts for buyer info (MVP). Replace with a proper form in production.
      const name = window.prompt('Your full name') || '';
      const email = window.prompt('Your email address') || '';
      const phone = window.prompt('Phone (optional)') || '';

      if (!name || !email) {
        alert('Name and email are required to create the order.');
        setLoading(false);
        return;
      }

      const amount = Number(book?.price || 0) * Number(qty || 1);

      // Create server-side order
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          name,
          email,
          phone,
          items: [
            {
              bookId: book?._id || '',
              slug: book?.slug || '',
              title: book?.title || 'Untitled',
              qty: Number(qty || 1),
              price: Number(book?.price || 0)
            }
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Create order failed', data);
        alert(data?.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      // rename server rzp payload to avoid name collision
      const { rzp: rzpResp, order, key } = data;

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway.');
        setLoading(false);
        return;
      }

      const options = {
        key: key, // public key returned by your server
        amount: rzpResp.amount, // in paise
        currency: rzpResp.currency,
        name: 'Bhagabati Publication',
        description: `Order ${order.id}`,
        order_id: rzpResp.id,
        handler: async function (response) {
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
              alert('Payment successful — order confirmed');
              // optionally redirect to orders or thank-you
              router.push('/orders');
            } else {
              console.error('Verification failed', verifyData);
              alert('Payment verification failed. Contact support.');
            }
          } catch (err) {
            console.error('verify error', err);
            alert('Error verifying payment');
          }
        },
        prefill: {
          name,
          email,
          contact: phone || ''
        },
        theme: { color: '#ff6600' }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();

    } catch (err) {
      console.error('BuyNow error', err);
      alert('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`px-5 py-2 rounded text-white bg-brand-accent hover:opacity-95 ${className}`}
    >
      {loading ? 'Processing...' : `Buy Now${qty && qty > 1 ? ` x${qty}` : ''}`}
    </button>
  );
}
