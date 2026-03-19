// app/page.js
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Samuh App</h1>
        <p className="text-gray-500 mb-8">Group savings & loan management</p>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </Link>
      </div>
    </main>
  )
}