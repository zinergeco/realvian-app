import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/public-auth";
import { redirect } from "next/navigation";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free Realvian account.",
  alternates: { canonical: "/auth/signup" },
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="min-h-[calc(100vh-68px)] grid place-items-center bg-[var(--bg)] px-5 py-16">
      <div className="w-full max-w-[400px]">
        <SignupForm />
        <p className="text-center text-[13.5px] text-[var(--text-muted)] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--primary)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
