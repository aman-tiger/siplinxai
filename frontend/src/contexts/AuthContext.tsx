"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as authApi from "@/lib/authClient";
import { OFFLINE_GRACE_DAYS } from "@/config/auth";

type Status = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: Status;
  user: authApi.MeResponse["user"] | null;
  plan: "free" | "pro";
  isPro: boolean;
  /** true, если статус взят из оффлайн-кэша (нет связи с сервером). */
  offline: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DAY_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<authApi.MeResponse | null>(null);
  const [offline, setOffline] = useState(false);

  const bootstrap = useCallback(async () => {
    const token = await authApi.getToken();
    if (!token) {
      setMe(null);
      setOffline(false);
      setStatus("unauthenticated");
      return;
    }

    const res = await authApi.fetchMe(token);

    if (res === "unauthorized") {
      // Токен отозван/протух — выходим.
      await authApi.clearSession();
      setMe(null);
      setOffline(false);
      setStatus("unauthenticated");
      return;
    }

    if (res === "network-error") {
      // Оффлайн-грейс: пускаем с последним известным статусом, если он свежий.
      const { me: cached, verifiedAt } = await authApi.getCachedMe();
      const ageDays = verifiedAt ? (Date.now() - verifiedAt) / DAY_MS : Infinity;
      if (cached && ageDays <= OFFLINE_GRACE_DAYS) {
        setMe(cached);
        setOffline(true);
        setStatus("authenticated");
      } else {
        // Не смогли подтвердить и грейс истёк — просим войти заново.
        setMe(null);
        setOffline(false);
        setStatus("unauthenticated");
      }
      return;
    }

    await authApi.setSession(token, res);
    setMe(res);
    setOffline(false);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await authApi.loginWithGoogle();
      setMe(res);
      setOffline(false);
      setStatus("authenticated");
    } catch (e) {
      setStatus("unauthenticated");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setMe(null);
    setOffline(false);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const plan = me?.plan ?? "free";

  return (
    <AuthContext.Provider
      value={{
        status,
        user: me?.user ?? null,
        plan,
        isPro: plan === "pro",
        offline,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри <AuthProvider>");
  return ctx;
}

/** Удобный хук: есть ли активная PRO-подписка. */
export function usePro(): boolean {
  return useAuth().isPro;
}
