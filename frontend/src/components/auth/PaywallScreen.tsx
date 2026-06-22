"use client";

import { useAuth } from "@/contexts/AuthContext";
import { UpgradeButton, PromoCodeField } from "./ProGate";

/**
 * Экран пейволла. Показывается после входа, если у пользователя НЕТ активной
 * подписки и НЕТ триала. Пользоваться приложением без PRO/триала нельзя.
 *
 * Бренд Siplinx AI: градиент синий #2F6BFF → фиолетовый #7A3BE0.
 */
const BRAND_GRADIENT = "linear-gradient(135deg, #2F6BFF 0%, #7A3BE0 100%)";

export default function PaywallScreen() {
  const { user, logout, refresh } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(122,59,224,0.10), rgba(255,255,255,0) 60%), #FFFFFF",
        color: "#0E1116",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>
          Siplinx{" "}
          <span
            style={{
              background: BRAND_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI PRO
          </span>
        </h1>
        <p style={{ color: "#5A6472", marginBottom: 24, lineHeight: 1.5 }}>
          Чтобы пользоваться приложением, оформите подписку PRO или активируйте
          промокод на бесплатный период.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <UpgradeButton plan="trial3" label="3 дня бесплатно, потом $5/мес" />
          <UpgradeButton plan="monthly" label="Оформить PRO — $9/мес" />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#94A0B0" }}>
          Для триала на 3 дня нужна карта. Списание начнётся после триала, отменить можно в любой момент.
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "#5A6472" }}>
          или активируйте промокод
        </div>
        <PromoCodeField />

        <div style={{ marginTop: 28, fontSize: 12, color: "#94A0B0" }}>
          <button
            onClick={() => refresh()}
            style={{
              background: "none",
              border: "none",
              color: "#2F6BFF",
              cursor: "pointer",
              fontSize: 12,
              textDecoration: "underline",
            }}
          >
            Я уже оплатил — обновить
          </button>
          {user && (
            <>
              <span style={{ margin: "0 8px" }}>·</span>
              <button
                onClick={() => logout()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A0B0",
                  cursor: "pointer",
                  fontSize: 12,
                  textDecoration: "underline",
                }}
              >
                Выйти ({user.email})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
