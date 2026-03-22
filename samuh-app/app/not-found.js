// app/not-found.js
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h2>
        <p className="text-gray-400 text-sm mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}