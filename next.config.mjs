/** @type {import('next').NextConfig} */
const nextConfig = {
  // ORT + import.meta + terser => build crash. Slå minify fra indtil ORT er 100% isoleret i worker bundle.
  swcMinify: false,

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

module.exports = nextConfig;
