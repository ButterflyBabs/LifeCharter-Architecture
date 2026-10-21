// Internal test switch for the Sales Reference combined checkout (Babs, 2026-10-21), the same idea as the self-serve
// Starter test (app_settings.starter_test_email): while app_settings.sales_test_email holds exactly the buyer's address,
// that checkout is 100% off for good and collects no card, so the Sales Reference path (checkout, agreement, onboarding
// details saved as waiting, account opens after payment and signature) can be tested with one Eloise contact and no
// charge. The setting is empty except while a test is running. Only the standard checkout supports it.
export function isSalesTestEmail(setting: string | null | undefined, email: string | null | undefined): boolean {
  const want = String(setting ?? "").trim().toLowerCase();
  const got = String(email ?? "").trim().toLowerCase();
  return want !== "" && want === got;
}
