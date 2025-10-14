// app/books/page.js
import Link from "next/link";

async function getBooks() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/books`, {
      cache: "no-store", // always fetch fresh data (can be changed to ISR later)
    });

    if (!res.ok) throw new Error("Failed to fetch books");

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("Error fetching books:", err);
    return [];
  }
}

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">All Books</h1>

      {books.length === 0 ? (
        <p className="text-gray-500 text-lg">No books found. Please check again later.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => (
            <div
              key={book._id}
              className="group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white"
            >
              <Link href={`/book/${book.slug}`} className="block">
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
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
                    {book.title}
                  </h3>

                  {book.authors?.length > 0 && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                      {book.authors.join(", ")}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-semibold text-brand-accent">
                      ₹{book.price.toFixed(2)}
                    </p>

                    {book.mrp && book.mrp > book.price && (
                      <p className="text-sm text-gray-400 line-through">
                        ₹{book.mrp.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
