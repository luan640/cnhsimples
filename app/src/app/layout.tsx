import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CNH Simples — Instrutores autônomos em Fortaleza',
  description: 'Conecte-se com instrutores autônomos credenciados pelo DETRAN-CE. Agende sua aula, pague online e aprenda a dirigir com quem entende.',
  keywords: 'instrutor de direção Fortaleza, aula de direção, CNH, autoescola particular, instrutor autônomo Ceará',
  openGraph: {
    title: 'CNH Simples',
    description: 'Instrutores autônomos credenciados em Fortaleza-CE',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
