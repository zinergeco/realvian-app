import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg)] px-5">
      <div className="w-full max-w-[380px]">
        <LoginForm />
      </div>
    </div>
  );
}
