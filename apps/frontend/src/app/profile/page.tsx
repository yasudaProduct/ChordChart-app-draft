"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name || undefined },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("保存しました。");
    }
    setIsSaving(false);
  };

  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            プロフィール
          </h1>

          <div className="mt-6 grid gap-4">
            {message && (
              <p className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {message}
              </p>
            )}
            <label className="text-sm text-slate-600">
              表示名
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="text-sm text-slate-600">
              メールアドレス
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500"
              />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-2 w-fit rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
