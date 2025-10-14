// app/book/[slug]/page.js
export default function BookDetail({ params }) {
  const { slug } = params;
  return (
    <div>
      <h2 className="text-2xl font-medium">Book: {slug}</h2>
      <p className="mt-2 text-gray-600">Book details will appear here.</p>
    </div>
  );
}
