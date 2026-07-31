/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable the client-side Router Cache so navigating between pages always
    // re-renders and re-fetches live data (segment scores, alignment, etc.)
    // instead of reusing a previously-rendered page.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
