/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  redirects: async () => [
    { source: '/webshop.html', destination: '/collection', permanent: true },
    { source: '/exhibitionsmessenmaumlssor.html', destination: '/events', permanent: true }
  ]
};

export default nextConfig;


