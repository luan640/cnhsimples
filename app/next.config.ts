import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    '*.trycloudflare.com',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Supabase Storage (substituir pela URL real do projeto)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
