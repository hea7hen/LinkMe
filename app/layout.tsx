import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinkMe - Proximity Networking',
  description: 'Connect with people nearby',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-textPrimary font-sans`}>{children}</body>
    </html>
  )
}
