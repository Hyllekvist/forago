/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    typedRoutes: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hycbxiqfeunpzbgcasfo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;