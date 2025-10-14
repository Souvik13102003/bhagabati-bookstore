// app/admin/add-book/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAddBookPage() {
    const router = useRouter();

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    async function handleFileUpload(e, type = 'image') {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        try {
            // Step 1: get signature from your server
            const signRes = await fetch('/api/cloudinary-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder: 'books',
                    resource_type: type === 'pdf' ? 'raw' : 'image'
                })
            });
            const signData = await signRes.json();
            if (!signRes.ok) throw new Error(signData.error || 'Failed to get signature');

            // Step 2: prepare form data for Cloudinary direct upload
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('api_key', signData.apiKey);
            uploadData.append('timestamp', signData.timestamp);
            uploadData.append('folder', signData.folder);
            uploadData.append('signature', signData.signature);

            const uploadURL = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resource_type}/upload`;

            // Step 3: upload directly to Cloudinary
            const cloudRes = await fetch(uploadURL, {
                method: 'POST',
                body: uploadData
            });
            const cloudData = await cloudRes.json();

            if (!cloudRes.ok) throw new Error(cloudData.error?.message || 'Upload failed');

            // Step 4: set URL in form
            if (type === 'pdf') {
                setForm((p) => ({ ...p, pdfPreview: cloudData.secure_url }));
            } else {
                setForm((p) => ({ ...p, coverImage: cloudData.secure_url }));
            }
        } catch (err) {
            console.error(err);
            setUploadError(err.message);
        } finally {
            setUploading(false);
        }
    }


    // admin gate
    const [isAuthed, setIsAuthed] = useState(false);
    const [passInput, setPassInput] = useState('');

    // form
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        authors: '',
        isbn: '',
        description: '',
        price: '',
        mrp: '',
        category: '',
        language: '',
        coverImage: '',
        stock: ''
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const ok = sessionStorage.getItem('bhg_admin_ok') === '1';
        if (ok) setIsAuthed(true);
    }, []);

    function handleGateSubmit(e) {
        e.preventDefault();
        // store password in sessionStorage only after a server-side quick check
        // We'll do a light server-side validation by calling a small endpoint that echoes the admin pass check.
        // But for simplicity, we just store the value locally — server will still validate on POST (required).
        if (!passInput) {
            setError('Please enter admin password');
            return;
        }
        sessionStorage.setItem('bhg_admin_ok', '1');
        sessionStorage.setItem('bhg_admin_pass', passInput);
        setIsAuthed(true);
        setError(null);
        setMessage('Admin unlocked for this session. You may add books.');
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        // basic client validation
        if (!form.title || !form.slug || !form.price) {
            setError('Please provide title, slug and price.');
            return;
        }

        setLoading(true);
        try {
            const adminPass = sessionStorage.getItem('bhg_admin_pass') || '';
            const payload = {
                title: form.title.trim(),
                slug: form.slug.trim(),
                authors: form.authors ? form.authors.split(',').map(a => a.trim()) : [],
                isbn: form.isbn.trim(),
                description: form.description,
                price: Number(form.price) || 0,
                mrp: form.mrp ? Number(form.mrp) : undefined,
                category: form.category,
                language: form.language,
                coverImage: form.coverImage,
                stock: form.stock ? Number(form.stock) : 0
            };

            const res = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-pass': adminPass // server will validate
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data?.error || 'Failed to create book';
                setError(msg);
                setLoading(false);
                return;
            }

            setMessage('Book created successfully.');
            setForm({
                title: '',
                slug: '',
                authors: '',
                isbn: '',
                description: '',
                price: '',
                mrp: '',
                category: '',
                language: '',
                coverImage: '',
                stock: ''
            });

            // optional: navigate to books list, or to book detail
            // router.push(`/book/${data.book.slug}`);
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }

    if (!isAuthed) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-semibold mb-4">Admin Login — Bhagabati</h2>
                <form onSubmit={handleGateSubmit} className="max-w-md">
                    <label className="block mb-2 text-sm font-medium">Admin Password</label>
                    <input
                        type="password"
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        className="w-full border rounded px-3 py-2 mb-3"
                        placeholder="Enter admin password"
                    />
                    {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
                    <button className="px-4 py-2 bg-brand-accent text-white rounded" type="submit">
                        Unlock Admin
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-4">Add New Book (Admin)</h2>

            {message && <div className="p-3 bg-green-100 text-green-800 rounded mb-4">{message}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Slug (url)</label>
                        <input name="slug" value={form.slug} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                        <div className="text-xs text-gray-500 mt-1">Lowercase, hyphen-separated (e.g. cbse-maths-101)</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Authors</label>
                        <input name="authors" value={form.authors} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Comma separated" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">ISBN</label>
                        <input name="isbn" value={form.isbn} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows="5" className="w-full border rounded px-3 py-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Price (₹)</label>
                        <input name="price" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" type="number" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">MRP (₹)</label>
                        <input name="mrp" value={form.mrp} onChange={handleChange} className="w-full border rounded px-3 py-2" type="number" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Category</label>
                        <input name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Stock</label>
                        <input name="stock" value={form.stock} onChange={handleChange} className="w-full border rounded px-3 py-2" type="number" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Language</label>
                    <input name="language" value={form.language} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                </div>

                {/* COVER IMAGE UPLOAD */}
                <div>
                    <label className="block text-sm font-medium mb-1">Cover Image</label>
                    {form.coverImage ? (
                        <div className="flex items-center gap-3 mb-2">
                            <img src={form.coverImage} alt="Cover" className="w-24 h-32 object-cover rounded border" />
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, coverImage: '' })}
                                className="px-3 py-1 border rounded text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'image')}
                            className="w-full border rounded px-3 py-2"
                        />
                    )}
                    {uploading && <div className="text-sm text-gray-600 mt-1">Uploading...</div>}
                    {uploadError && <div className="text-sm text-red-600 mt-1">{uploadError}</div>}
                </div>

                {/* PDF PREVIEW UPLOAD */}
                <div>
                    <label className="block text-sm font-medium mb-1">Preview PDF (optional)</label>
                    {form.pdfPreview ? (
                        <div className="flex items-center gap-3 mb-2">
                            <a href={form.pdfPreview} target="_blank" rel="noreferrer" className="underline text-blue-600">
                                View Uploaded PDF
                            </a>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, pdfPreview: '' })}
                                className="px-3 py-1 border rounded text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleFileUpload(e, 'pdf')}
                            className="w-full border rounded px-3 py-2"
                        />
                    )}
                </div>


                <div className="flex items-center gap-3">
                    <button type="submit" className="px-4 py-2 bg-brand-accent text-white rounded" disabled={loading}>
                        {loading ? 'Saving...' : 'Create Book'}
                    </button>

                    <button
                        type="button"
                        className="px-4 py-2 border rounded"
                        onClick={() => {
                            sessionStorage.removeItem('bhg_admin_ok');
                            sessionStorage.removeItem('bhg_admin_pass');
                            setIsAuthed(false);
                        }}
                    >
                        Logout Admin
                    </button>
                </div>
            </form>
        </div>
    );
}
