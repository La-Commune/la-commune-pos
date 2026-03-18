/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp"],
  eslint: {
    // Los errores de lint no bloquean el build — el CI ya tiene typecheck aparte
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
