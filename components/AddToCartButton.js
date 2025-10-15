// components/AddToCartButton.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ book, variant = 'default' }) {
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('bhg_cart') || '[]');
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('bhg_cart', JSON.stringify(cart));
    // optional: trigger navigation refresh or other UI updates
    try { window.dispatchEvent(new Event('storage')); } catch { }
  }

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdding(true);
    try {
      const existing = getCart();
      const found = existing.find((i) => i.slug === (book.slug || book._id));
      if (found) {
        found.qty = (found.qty || 1) + 1;
      } else {
        existing.push({
          bookId: book._id || '',
          slug: book.slug || book._id || '',
          title: book.title || 'Untitled',
          price: Number(book.price || 0),
          qty: 1,
          coverImage: book.coverImage || '',
          authors: book.authors || []
        });
      }
      saveCart(existing);
      // small UI feedback
      alert('Added to cart');
      // optionally navigate to cart or update UI:
      // router.push('/cart');
    } catch (err) {
      console.error('Add to cart error', err);
      alert('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (variant === 'ghost') {
    return (
      <button onClick={handleAdd} disabled={adding} className="px-5 py-2 border rounded hover:bg-gray-50">
        {adding ? 'Adding...' : 'Add to Cart'}
      </button>
    );
  }

  return (
    <button onClick={handleAdd} disabled={adding} className="px-5 py-2 border rounded hover:bg-gray-50">
      {adding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
