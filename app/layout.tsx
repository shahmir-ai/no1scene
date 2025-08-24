import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NO1 Scene Editor',
  description: 'Browser-based scene editor for YouTube thumbnail composition',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
