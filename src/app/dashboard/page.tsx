"use client";

import { useEffect, useState } from "react";

// Simple test component
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[#1F315B]">
        Welcome back, Seraphina
      </h1>
      <p className="text-[#5E3B6C]">
        Dashboard is loading successfully!
      </p>
    </div>
  );
}
