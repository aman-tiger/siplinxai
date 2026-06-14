"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { openCheckout, openPortal } from "@/lib/authClient";

/**
 * Кнопка апгрейда. Открывает Polar checkout в браузере и затем опрашивает
 * /api/me, пока подписка не станет активной (вебхук обновит статус).
 */
export function UpgradeButton({
  plan = "monthly",
  label,
}: {
  plan?: "monthly" | "yearly";
  label?: string;
}) {
  const { refresh, isPro } = useAuth();
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      await refresh();
      // Останавливаемся, когда стало PRO или прошло 2 минуты.
      if (isPro || Date.now() - startedAt > 2 * 60 * 1000) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setBusy(false);
      }
    }, 4000);
  }, [refresh, isPro]);

  const handle = async () => {
    setBusy(true);
    try {
      await openCheckout(plan);
      startPolling();
    } catch {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        border: "none",
        background: "#6F1D1B",
        color: "#FFE6A7",
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
      }}
    >
      {busy ? "Ждём оплату…" : label ?? "Оформить PRO"}
    </button>
  );
}

/** Кнопка управления подпиской (Polar customer portal). */
export function ManageSubscriptionButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await openPortal();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #99582A",
        background: "transparent",
        color: "#432818",
        cursor: "pointer",
      }}
    >
      Управлять подпиской
    </button>
  );
}

/**
 * Гейт PRO-фичи. Оборачивай платные функции:
 *   <ProGate feature="Экспорт в PDF"> <PdfExportButton/> </ProGate>
 * Для не-PRO показывает апселл вместо содержимого.
 */
export function ProGate({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature?: string;
}) {
  const { isPro } = useAuth();
  if (isPro) return <>{children}</>;

  return (
    <div
      style={{
        border: "1px dashed #99582A",
        borderRadius: 12,
        padding: 20,
        textAlign: "center",
        background: "rgba(187,148,87,0.12)",
        color: "#432818",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {feature ? `${feature} — функция PRO` : "Функция PRO"}
      </div>
      <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 14 }}>
        Оформите подписку Siplinx AI PRO, чтобы разблокировать.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <UpgradeButton plan="monthly" label="PRO / месяц" />
        <UpgradeButton plan="yearly" label="PRO / год" />
      </div>
    </div>
  );
}
