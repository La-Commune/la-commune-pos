/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
  eslint: {
    // Los errores de lint no bloquean el build — el CI ya tiene typecheck aparte
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
