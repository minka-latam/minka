/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:
          'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'swfgvfhpmicwptupjyko.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'euflkzolctyfscsnwspq.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'noplbukuwhiizabgmfoo.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'aoovlhsyzfrfbouqcedw.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // ... other config options
}

module.exports = nextConfig
