export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t mt-8">
      <div className="container mx-auto px-4 py-6 text-sm text-gray-600">
        <div className="flex flex-col md:flex-row md:justify-between">
          <div>
            <strong>Bhagabati Publication</strong>
            <div>Kolkata, India</div>
            <div className="mt-2">Contact: contact@bhagabati.example</div>
          </div>
          <div className="mt-4 md:mt-0">
            <div>© {new Date().getFullYear()} Bhagabati Publication</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
