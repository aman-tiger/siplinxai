"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "./LoginScreen";

/**
 * Гейт регистрации: пока статус не подтверждён — сплэш; без входа — экран логина;
 * после входа — само приложение (children).
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFE6A7",
          color: "#432818",
        }}
      >
        <span style={{ opacity: 0.7 }}>Загрузка…</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
