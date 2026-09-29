import Script from "next/script";

// LC Spark chat bubble on the Suite's public pages (managed in Alignment Architect › LC Spark).
// Not on signed-in client pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script src="/spark.js" data-key="42acb09c321dde80aace7b2c" strategy="afterInteractive" />
    </>
  );
}
