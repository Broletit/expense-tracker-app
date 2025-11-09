/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // ⚙️ Cho phép Next.js không bundle pdfkit vào trong .next
    serverComponentsExternalPackages: ['pdfkit'],
  },
  webpack: (config) => {
    // Tránh Next cố polyfill fs hoặc bundle pdfkit
    config.externals = config.externals || [];
    return config;
  },
};

module.exports = nextConfig;
