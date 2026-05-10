"use client";

import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16">
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/songs"
        />
      </section>
    </main>
  );
}
