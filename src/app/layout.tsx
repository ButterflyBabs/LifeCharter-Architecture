import { PublicTracking } from "@/components/PublicTracking";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "LifeCharter",
  description: "Align your business with your vision",
  // The Suite installs as its own phone app (the Collective sets its own manifest).
  manifest: "/suite.webmanifest",
  appleWebApp: { capable: true, title: "Command Suite", statusBarStyle: "default" },
  icons: { apple: "/suite-icons/apple-touch-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <PublicTracking />
        </ThemeProvider>
      </body>
    </html>
  );
}
