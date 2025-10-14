// app/layout.js
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Bhagabati Publication — Online Bookstore',
  description: 'Books for CBSE, Polytechnic, Vocational, and more — Bhagabati Publication, Kolkata.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header/>
        <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        <Footer/>
      </body>
    </html>
  );
}
