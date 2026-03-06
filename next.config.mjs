/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude these packages from Next.js bundling
  serverExternalPackages: ['mammoth'],
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
}

export default nextConfig
