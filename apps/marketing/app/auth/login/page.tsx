import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/public-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Realvian account.",
  alternates: { canonical: "/auth/login" },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="min-h-[calc(100vh-68px)] grid place-items-center bg-[var(--bg)] px-5 py-16">
      <div className="w-full max-w-[400px]">
        <LoginForm />
        <p className="text-center text-[13.5px] text-[var(--text-muted)] mt-6">
          New to Realvian?{" "}
          <Link href="/auth/signup" style={{ color: "var(--primary)" }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
