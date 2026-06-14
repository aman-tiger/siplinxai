"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Экран входа. Показывается, пока пользователь не авторизован.
 * Регистрация обязательна для использования приложения.
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await login();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFE6A7",
        color: "#432818",
      }}
    >
      <div style={{ maxWidth: 380, textAlign: "center", padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Siplinx AI</h1>
        <p style={{ opacity: 0.8, marginBottom: 28 }}>
          Войдите, чтобы пользоваться приложением. Запись и транскрипция
          по-прежнему выполняются локально на вашем устройстве.
        </p>

        <button
          onClick={handleLogin}
          disabled={busy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 10,
            border: "1px solid #99582A",
            background: busy ? "#e9d49a" : "#fff",
            color: "#432818",
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {/* Google G */}
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.9 38 46.5 31.8 46.5 24.5z"/>
            <path fill="#FBBC05" d="M10.4 28.3c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.9-6.1C.9 16 0 19.9 0 23.5s.9 7.5 2.5 10.9l7.9-6.1z"/>
            <path fill="#34A853" d="M24 47c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-3.7-13.6-9l-7.9 6.1C6.4 42.6 14.6 47 24 47z"/>
          </svg>
          {busy ? "Открываем браузер…" : "Войти через Google"}
        </button>

        {error && (
          <p style={{ color: "#6F1D1B", marginTop: 16, fontSize: 13 }}>{error}</p>
        )}

        <p style={{ opacity: 0.55, marginTop: 24, fontSize: 12 }}>
          Вход откроется в системном браузере. После входа вернитесь в приложение.
        </p>
      </div>
    </div>
  );
}
