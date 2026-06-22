"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { openCheckout, openPortal, redeemTrial } from "@/lib/authClient";

/**
 * Бренд Siplinx AI: градиент синий #2F6BFF → фиолетовый #7A3BE0.
 */
const BRAND_GRADIENT = "linear-gradient(135deg, #2F6BFF 0%, #7A3BE0 100%)";
const BRAND_BLUE = "#2F6BFF";

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
        background: BRAND_GRADIENT,
        color: "#FFFFFF",
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.7 : 1,
        boxShadow: "0 6px 18px rgba(47,107,255,0.22)",
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
        border: `1px solid ${BRAND_BLUE}`,
        background: "transparent",
        color: BRAND_BLUE,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Управлять подпиской
    </button>
  );
}

/**
 * Поле активации бесплатного триала по промокоду (без карты).
 * При успехе обновляет статус — /api/me вернёт PRO, и гейт пропустит контент.
 */
export function PromoCodeField() {
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const submit = async () => {
    const value = code.trim();
    if (!value) return;
    setBusy(true);
    setMsg(null);
    const res = await redeemTrial(value);
    if (res.ok) {
      setMsg({ kind: "ok", text: "Промокод активирован — открываем PRO…" });
      await refresh();
    } else {
      setMsg({ kind: "err", text: res.error });
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Промокод"
          disabled={busy}
          aria-label="Промокод"
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid rgba(47,107,255,0.35)",
            background: "#FFFFFF",
            color: "#0E1116",
            minWidth: 160,
          }}
        />
        <button
          onClick={submit}
          disabled={busy || !code.trim()}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: `1px solid ${BRAND_BLUE}`,
            background: "transparent",
            color: BRAND_BLUE,
            fontWeight: 600,
            cursor: busy || !code.trim() ? "default" : "pointer",
            opacity: busy || !code.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Активируем…" : "Активировать"}
        </button>
      </div>
      {msg && (
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: msg.kind === "ok" ? "#1B7F4B" : "#B23B3B",
          }}
        >
          {msg.text}
        </p>
      )}
    </div>
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
        border: "1px solid rgba(47,107,255,0.25)",
        borderRadius: 12,
        padding: 20,
        textAlign: "center",
        background:
          "linear-gradient(135deg, rgba(47,107,255,0.06) 0%, rgba(122,59,224,0.06) 100%)",
        color: "#0E1116",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {feature ? `${feature} — функция PRO` : "Функция PRO"}
      </div>
      <p style={{ color: "#5A6472", fontSize: 14, marginBottom: 14 }}>
        Оформите подписку Siplinx AI PRO, чтобы разблокировать.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {/* Сейчас в Polar заведён только месячный план. Кнопку «PRO / год»
            вернуть, когда появится годовой продукт (POLAR_PRODUCT_ID_YEARLY). */}
        <UpgradeButton plan="monthly" label="Оформить PRO" />
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "#5A6472" }}>
        или активируйте промокод на бесплатный период
      </div>
      <PromoCodeField />
    </div>
  );
}
