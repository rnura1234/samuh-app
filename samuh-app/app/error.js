// app/error.js
'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-gray-200 mb-4">Oops!</p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-6">{error?.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    </main>
  )
}