export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F1E8" }}>
      <div style={{ marginLeft: "256px", minHeight: "100vh" }}>
        <main style={{ padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
