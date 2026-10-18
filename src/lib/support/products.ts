// The apps that share the one support route (Help › Contact Support → Support Desk → support@lccommandsuite.com).
export const SUPPORT_PRODUCTS = [
  { id: "lccs", label: "Command Suite", home: "/help/contact" },
  { id: "volant", label: "LC Volant", home: "/help/contact" },
  { id: "fledge", label: "LC Fledge", home: "https://fledge.lccommandsuite.com" },
] as const;
export type SupportProduct = (typeof SUPPORT_PRODUCTS)[number]["id"];

export const supportProduct = (v: unknown): SupportProduct => (SUPPORT_PRODUCTS.some((p) => p.id === v) ? (v as SupportProduct) : "lccs");
export const productLabel = (v: unknown) => SUPPORT_PRODUCTS.find((p) => p.id === supportProduct(v))!.label;
