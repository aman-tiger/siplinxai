// Клиент авторизации/подписки для десктопа.
//
// ВАЖНО про хранение токена: используется @tauri-apps/plugin-store (auth.json).
// Это НЕ шифрованное хранилище. Токен — серверная сессия (revocable, с TTL),
// но для усиления безопасности стоит мигрировать на OS keychain (crate `keyring`)
// или tauri-plugin-stronghold. См. TODO в README репозитория.

import { start, cancel, onUrl } from "@fabianlars/tauri-plugin-oauth";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Store } from "@tauri-apps/plugin-store";
import { AUTH_URL, LOOPBACK_PORTS } from "@/config/auth";

export type MeResponse = {
  user: { id: string; email: string; name?: string | null; image?: string | null };
  plan: "free" | "pro";
  status: string;
  currentPeriodEnd: string | null;
  serverTime?: string;
};

const STORE_FILE = "auth.json";
const K_TOKEN = "auth.token";
const K_ME = "auth.me";
const K_VERIFIED_AT = "auth.lastVerifiedAt";

async function store() {
  // defaults обязателен в новых версиях @tauri-apps/plugin-store (StoreOptions);
  // указываем пустой объект — совместимо со старой и новой версией.
  return await Store.load(STORE_FILE, { autoSave: true, defaults: {} });
}

export async function getToken(): Promise<string | null> {
  const s = await store();
  return (await s.get<string>(K_TOKEN)) ?? null;
}

export async function setSession(token: string, me: MeResponse): Promise<void> {
  const s = await store();
  await s.set(K_TOKEN, token);
  await s.set(K_ME, me);
  await s.set(K_VERIFIED_AT, Date.now());
  await s.save();
}

export async function getCachedMe(): Promise<{ me: MeResponse | null; verifiedAt: number | null }> {
  const s = await store();
  const me = (await s.get<MeResponse>(K_ME)) ?? null;
  const verifiedAt = (await s.get<number>(K_VERIFIED_AT)) ?? null;
  return { me, verifiedAt };
}

export async function clearSession(): Promise<void> {
  const s = await store();
  await s.delete(K_TOKEN);
  await s.delete(K_ME);
  await s.delete(K_VERIFIED_AT);
  await s.save();
}

export type FetchMeResult = MeResponse | "unauthorized" | "network-error";

export async function fetchMe(token: string): Promise<FetchMeResult> {
  try {
    const res = await fetch(`${AUTH_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return "unauthorized";
    if (!res.ok) return "network-error";
    return (await res.json()) as MeResponse;
  } catch {
    return "network-error";
  }
}

function randomState(): string {
  // crypto.randomUUID доступен в webview Tauri.
  return crypto.randomUUID();
}

const DONE_HTML = `<!doctype html><meta charset="utf-8">
<body style="font-family:system-ui;text-align:center;padding:48px;background:#FFE6A7;color:#432818">
<h2>Готово ✓</h2><p>Можно вернуться в приложение Siplinx AI. Это окно можно закрыть.</p></body>`;

/**
 * Полный флоу логина через Google:
 * 1) поднимаем временный loopback-сервер (tauri-plugin-oauth),
 * 2) открываем системный браузер на /desktop/start сервиса,
 * 3) после Google сервис редиректит на loopback с token+state,
 * 4) валидируем state, тянем /api/me, сохраняем сессию.
 */
export async function loginWithGoogle(): Promise<MeResponse> {
  const expectedState = randomState();

  return await new Promise<MeResponse>((resolve, reject) => {
    let port: number | undefined;
    let unlisten: (() => void) | null = null;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = async () => {
      if (timer) clearTimeout(timer);
      if (unlisten) {
        try { unlisten(); } catch { /* noop */ }
      }
      if (port != null) {
        try { await cancel(port); } catch { /* noop */ }
      }
    };

    (async () => {
      try {
        port = await start({ ports: LOOPBACK_PORTS, response: DONE_HTML });

        unlisten = await onUrl(async (url) => {
          if (settled) return;
          try {
            const u = new URL(url);
            const token = u.searchParams.get("token");
            const state = u.searchParams.get("state");
            if (!token || state !== expectedState) {
              throw new Error("Некорректный ответ входа (state mismatch)");
            }
            const me = await fetchMe(token);
            if (me === "unauthorized" || me === "network-error") {
              throw new Error("Не удалось подтвердить вход на сервере");
            }
            await setSession(token, me);
            settled = true;
            await cleanup();
            resolve(me);
          } catch (e) {
            settled = true;
            await cleanup();
            reject(e);
          }
        });

        const loginUrl =
          `${AUTH_URL}/desktop/start?port=${port}&state=${encodeURIComponent(expectedState)}`;
        await openUrl(loginUrl);

        // Таймаут на случай, если вход не завершён.
        timer = setTimeout(async () => {
          if (!settled) {
            settled = true;
            await cleanup();
            reject(new Error("Время входа истекло. Попробуйте снова."));
          }
        }, 5 * 60 * 1000);
      } catch (e) {
        settled = true;
        await cleanup();
        reject(e);
      }
    })();
  });
}

async function openAuthedUrl(path: string): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error("Не авторизован");
  const res = await fetch(`${AUTH_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Сервер вернул ${res.status}`);
  const { url } = (await res.json()) as { url: string };
  await openUrl(url);
}

/** Открыть Polar checkout в браузере. */
export async function openCheckout(plan: "monthly" | "yearly" = "monthly"): Promise<void> {
  await openAuthedUrl(`/api/billing/checkout?plan=${plan}`);
}

/** Открыть Polar customer portal в браузере. */
export async function openPortal(): Promise<void> {
  await openAuthedUrl(`/api/billing/portal`);
}

export async function logout(): Promise<void> {
  await clearSession();
}
