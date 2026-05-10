"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/authStore";
import { setTokenGetter } from "@/lib/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? user.firstName ?? undefined,
      });
    } else {
      setUser(null);
    }
  }, [isLoaded, user, setUser, setLoading]);

  return <>{children}</>;
};
