import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      // Supabase Storage (substituir pela URL real do projeto)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
