/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization for all pages to support useSearchParams
  experimental: {
    dynamicIO: true
  },
  redirects: async () => [
    { source: '/webshop.html', destination: '/collection', permanent: true },
    { source: '/exhibitionsmessenmaumlssor.html', destination: '/events', permanent: true }
  ]
};

export default nextConfig;


