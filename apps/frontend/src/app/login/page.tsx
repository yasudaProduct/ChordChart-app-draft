"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    const redirect = searchParams.get("redirect") || "/songs";
    router.push(redirect);
  };

  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            ログイン
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            メールアドレスとパスワードでログインしてください。
          </p>
          {error && (
            <p data-testid="auth-error" className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-600">
              メールアドレス
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block text-sm text-slate-600">
              パスワード
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="********"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>
          <div className="mt-4 text-center text-xs text-slate-500">
            アカウントがない場合は{" "}
            <Link href="/register" className="font-semibold text-slate-800">
              新規登録
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
