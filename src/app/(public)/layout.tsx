import Link from 'next/link';

function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-gray-900 font-bold text-lg tracking-tight no-underline hover:no-underline"
        >
          Big Claw
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/projects" className="text-gray-500 hover:text-gray-900 transition-colors">
            Projects
          </Link>
          <Link href="/about" className="text-gray-500 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-6 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Big Claw. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
