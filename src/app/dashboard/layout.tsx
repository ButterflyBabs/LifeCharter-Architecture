import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/theme-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Sidebar activeItem="dashboard" />
        <div className="ml-64 min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
