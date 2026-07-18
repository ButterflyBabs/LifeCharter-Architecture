import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";
import TravelPartnerWidget from "@/components/travel-partner/TravelPartnerWidget";

export const metadata: Metadata = {
  title: "LifeCharter Architecture",
  description: "Align your business with your vision",
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
          <TravelPartnerWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
