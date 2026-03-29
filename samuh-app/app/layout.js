// app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'
import SessionGuard from '@/components/SessionGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Samuh App',
  description: 'Group savings & loan management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionGuard />
        {children}
      </body>
    </html>
  )
}