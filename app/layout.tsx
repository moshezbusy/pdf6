import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import AppSidebar from "@/components/ui/AppSidebar"

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <div style={{ display: "flex", height: "100vh" }}>
            <AppSidebar />
            <main style={{ flex: 1 }}>
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
