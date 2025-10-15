// app/api/books/route.js
import connect from '../../../lib/mongoose';
import Book from '../../../models/Book';

export async function GET(request) {
    try {
        await connect();
        const url = new URL(request.url);
        const raw = url.searchParams.get('q') || '';
        const category = url.searchParams.get('category') || '';
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);

        // helper to safely use user input in regex
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const filter = {};
        if (raw) {
            const search = raw.trim();
            // escaped regex for title/authors/isbn (partial, case-insensitive)
            const safe = escapeRegExp(search);
            const partialRegex = { $regex: safe, $options: 'i' };

            filter.$or = [
                { title: partialRegex },
                { authors: partialRegex }, // works for arrays of strings
                { isbn: partialRegex },
                // slug exact match (case-insensitive) — ensures ?q=slug returns book
                { slug: { $regex: `^${safe}$`, $options: 'i' } }
            ];
        }

        if (category) {
            filter.category = category;
        }

        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            Book.countDocuments(filter)
        ]);

        return new Response(JSON.stringify({ items, total, page, limit }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Failed to fetch books' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request) {
    try {
        // Server-side admin check: require correct header
        const suppliedPass = (request.headers.get('x-admin-pass') || '').trim();
        const ADMIN_PASS = (process.env.ADMIN_PASS || '').trim();
        if (!ADMIN_PASS || suppliedPass !== ADMIN_PASS) {
            return new Response(JSON.stringify({ error: 'Unauthorized: invalid admin password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();

        // basic validation
        if (!body.title || !body.slug || typeof body.price === 'undefined') {
            return new Response(JSON.stringify({ error: 'title, slug and price are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await connect();

        // prevent duplicate slug
        const existing = await Book.findOne({ slug: body.slug });
        if (existing) {
            return new Response(JSON.stringify({ error: 'A book with this slug already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const created = await Book.create(body);
        return new Response(JSON.stringify({ book: created }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Failed to create book' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
