import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-brand-accent flex items-center justify-center text-white font-bold">B</div>
          <span className="font-semibold text-lg">Bhagabati Publication</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-4 text-sm text-gray-700">
          <Link href="/books">Books</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/cart" className="px-3 py-1 border rounded">Cart</Link>
        </nav>
      </div>
    </header>
  );
}
