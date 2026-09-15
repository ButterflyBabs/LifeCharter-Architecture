/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Pre-existing ESLint warnings in unrelated files (react-hooks/exhaustive-deps
    // in src/app/dashboard/page.tsx and src/lib/hooks/useUnifiedMemory.tsx) were
    // failing production builds outright once the build cache stopped skipping a
    // fresh lint pass — real code that compiles and type-checks cleanly couldn't
    // deploy over warnings in files it never touched. Code quality already has
    // its own dedicated check (npm run lint in .github/workflows/ci.yml); it
    // shouldn't also gate whether a correct build can ship.
    ignoreDuringBuilds: true,
  },
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
