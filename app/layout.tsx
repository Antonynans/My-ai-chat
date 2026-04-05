import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Nexus — Team Chat',
  description: 'Real-time team workspace with AI-powered assistance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Figtree:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1e',
              color: '#e8e6e2',
              border: '1px solid #252529',
              borderRadius: '10px',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}