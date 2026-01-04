/** @type {import('next').NextConfig} */
const nextConfig = {
  // ORT + import.meta + minifier => build crash
  swcMinify: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hycbxiqfeunpzbgcasfo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  webpack: (config, { dev, isServer }) => {
    // Stop minifier i prod client-build (det er dér Terser rammer ort.bundle)
    if (!dev && !isServer) {
      config.optimization.minimize = false;
    }

    // Sørg for .mjs håndteres robust
    config.module.rules.push({
      test: /\.mjs$/,
      type: "javascript/auto",
    });

    return config;
  },
};

export default nextConfig;