// app/book/[slug]/page.js
import Link from "next/link";

// Fetch one book by slug
// Fetch one book by slug (debug-friendly + tolerant matching)
async function getBook(slug) {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/books?q=${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("getBook: fetch failed", res.status, await res.text());
      throw new Error("Failed to fetch book");
    }

    const data = await res.json();

    // DEBUG: log server-side so you can inspect shape in terminal
    console.log("getBook: query =", slug);
    console.log("getBook: raw api response:", JSON.stringify(data, null, 2));

    const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);

    // helper to extract a slug string from different shapes
    const extractSlug = (b) => {
      if (!b) return undefined;
      if (typeof b.slug === "string") return b.slug;
      // handle common nested shapes: { slug: { current: "..." } }
      if (b.slug && typeof b.slug === "object" && typeof b.slug.current === "string") return b.slug.current;
      // fall back to some other id if slug missing
      if (typeof b._id === "string") return b._id;
      return undefined;
    };

    const normalize = (s) => (s || "").toString().trim().toLowerCase();

    const normalizedTarget = normalize(slug);

    const book = items.find((b) => {
      const s = normalize(extractSlug(b));
      // tolerant matches: exact, decoded, contains
      return (
        s === normalizedTarget ||
        s === normalize(decodeURIComponent(slug)) ||
        s.includes(normalizedTarget) ||
        normalizedTarget.includes(s)
      );
    });

    return book || null;
  } catch (err) {
    console.error("Error fetching book:", err);
    return null;
  }
}


// Fetch related books
async function getRelatedBooks(category, currentSlug) {
  if (!category) return [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/books?category=${encodeURIComponent(category)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).filter((b) => b.slug !== currentSlug).slice(0, 4);
  } catch {
    return [];
  }
}

// Dynamic Metadata (SEO)
export async function generateMetadata({ params }) {
  // <-- await params before using it
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) {
    return { title: "Book Not Found — Bhagabati Publication" };
  }

  return {
    title: `${book.title} — Bhagabati Publication`,
    description: book.description?.slice(0, 150) || "Book details and preview."
  };
}

export default async function BookDetailPage({ params }) {
  // <-- await params before using it
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-2">Book not found</h2>
        <p className="text-gray-600 mb-6">
          We couldn’t find the book you’re looking for. Please check our
          <Link href="/books" className="text-brand-accent ml-1 underline">
            catalog.
          </Link>
        </p>
      </div>
    );
  }

  const related = await getRelatedBooks(book.category, book.slug);
  return (
    <div className="container mx-auto px-4 py-10">
      {/* Main details */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Image */}
        <div className="flex justify-center">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full max-w-sm rounded-lg shadow"
            />
          ) : (
            <div className="w-full max-w-sm h-[400px] bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg">
              No Cover Image
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div>
          <h1 className="text-3xl font-semibold mb-2">{book.title}</h1>

          {book.authors?.length > 0 && (
            <p className="text-gray-600 mb-2">
              by <span className="font-medium">{book.authors.join(", ")}</span>
            </p>
          )}

          {book.isbn && (
            <p className="text-sm text-gray-500 mb-4">ISBN: {book.isbn}</p>
          )}

          <div className="flex items-end gap-3 mb-4">
            <p className="text-2xl font-bold text-brand-accent">
              ₹{book.price.toFixed(2)}
            </p>
            {book.mrp && book.mrp > book.price && (
              <p className="text-gray-400 line-through">₹{book.mrp.toFixed(2)}</p>
            )}
          </div>

          <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
            {book.description || "No description available."}
          </p>

          <div className="flex gap-4 mb-8">
            <button className="px-5 py-2 bg-brand-accent text-white rounded hover:opacity-90">
              Buy Now
            </button>
            <button className="px-5 py-2 border rounded hover:bg-gray-50">
              Add to Cart
            </button>
          </div>

          {book.pdfPreview && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <iframe
                src={book.pdfPreview}
                className="w-full h-[500px] border rounded-lg"
                title="Book Preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Related Books */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-4">Related Books</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {related.map((r) => (
              <div
                key={r._id}
                className="group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white"
              >
                <Link href={`/book/${r.slug}`} className="block">
                  <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                    {r.coverImage ? (
                      <img
                        src={r.coverImage}
                        alt={r.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 group-hover:text-brand-accent line-clamp-2">
                      {r.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                      {r.authors?.join(", ")}
                    </p>
                    <p className="text-sm font-semibold text-brand-accent mt-1">
                      ₹{r.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
