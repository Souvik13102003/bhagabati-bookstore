// app/page.js
export default function HomePage() {
  return (
    <section>
      <div className="py-8">
        <h1 className="text-3xl font-semibold">Welcome to Bhagabati Publication</h1>
        <p className="mt-2 text-gray-600">Browse textbooks, guides, and more — optimized for students in India.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">New Arrivals (placeholder)</div>
        <div className="p-4 border rounded">Bestsellers (placeholder)</div>
        <div className="p-4 border rounded">Staff Picks (placeholder)</div>
      </div>
    </section>
  );
}