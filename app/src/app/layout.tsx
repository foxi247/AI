import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevForge AI — Build apps with AI in seconds',
  description: 'The AI-powered platform where you describe your idea and get a working app instantly. No installs, no config.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
