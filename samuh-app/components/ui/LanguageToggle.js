// components/ui/LanguageToggle.js
'use client'
import { useState, useEffect } from 'react'

export default function LanguageToggle() {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('samuh-lang') || 'en'
    setLang(saved)
  }, [])

  function toggle() {
    const newLang = lang === 'en' ? 'hi' : 'en'
    setLang(newLang)
    localStorage.setItem('samuh-lang', newLang)
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      className="text-xs border rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 transition"
    >
      {lang === 'en' ? 'हिंदी' : 'English'}
    </button>
  )
}