"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  signup as doSignup,
  login as doLogin,
  destroySession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./public-auth";

async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const h = await headers();
  const result = await doSignup(email, password, name, {
    ip: await clientIp(),
    userAgent: h.get("user-agent") ?? undefined,
  });

  if (!result.ok || !result.sessionId) {
    return { error: result.error ?? "Sign-up failed." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, result.sessionId, SESSION_COOKIE_OPTIONS);
  redirect("/account");
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const h = await headers();
  const result = await doLogin(email, password, {
    ip: await clientIp(),
    userAgent: h.get("user-agent") ?? undefined,
  });

  if (!result.ok || !result.sessionId) {
    return { error: result.error ?? "Sign-in failed." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, result.sessionId, SESSION_COOKIE_OPTIONS);
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
