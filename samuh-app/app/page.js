// app/page.js
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Samuh
          </h1>
          <p className="text-xs text-gray-500">
            Group savings manager
          </p>
        </div>

        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
        >
          Sign in →
        </Link>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">

        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg hover:scale-105 transition">
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="11" stroke="white" strokeWidth="2" />
            <path d="M16 10v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
          समूह प्रबंधन
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-base max-w-md mb-2">
          Manage your group savings, deposits, and loans — all in one place.
        </p>

        <p className="text-gray-400 text-sm mb-10">
          बचत · ऋण · लेजर · रिपोर्ट
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">

          <Link
            href="/register"
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition text-center"
          >
            Create your Samuh 🚀
          </Link>

          <Link
            href="/login"
            className="flex-1 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:scale-105 transition text-center"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-6 pb-12 max-w-4xl mx-auto w-full">
        {[
          {
            title: 'बचत / Savings',
            desc: 'Track monthly deposits for all members',
            icon: '💰',
            color: 'from-green-400 to-green-600'
          },
          {
            title: 'ऋण / Loans',
            desc: 'Apply, approve and repay loans easily',
            icon: '💳',
            color: 'from-blue-400 to-blue-600'
          },
          {
            title: 'रिपोर्ट / Reports',
            desc: 'Export PDF and Excel statements',
            icon: '📊',
            color: 'from-purple-400 to-purple-600'
          },
        ].map(f => (
          <div
            key={f.title}
            className="group bg-white rounded-2xl p-5 text-center shadow-md hover:shadow-xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer border"
          >
            {/* Icon Circle */}
            <div className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br ${f.color} text-white text-2xl mb-4 shadow-lg group-hover:scale-110 transition`}>
              {f.icon}
            </div>

            {/* Title */}
            <p className="font-semibold text-gray-800 text-base mb-1 group-hover:text-black">
              {f.title}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-500 group-hover:text-gray-600">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <footer className="text-center pb-6 text-xs text-gray-400">
        Already a member? Ask your group admin for login credentials.
      </footer>
    </main>
  )
}