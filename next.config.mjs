/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source-database-809785351172.europe-north1.run.app',
        pathname: '/uploads/**',
      },
    ],
  },
  redirects: async () => [
    { source: '/webshop.html', destination: '/collection', permanent: true },
    { source: '/exhibitionsmessenmaumlssor.html', destination: '/events', permanent: true }
  ]
};

export default nextConfig;


