import type { Metadata } from "next";
import { LoginView } from "@/components/login/login-view";

export const metadata: Metadata = {
  title: "Sign In — LifeCharter Command Suite",
  description: "Sign in to your LifeCharter command center.",
};

export default function LoginPage() {
  return <LoginView />;
}
