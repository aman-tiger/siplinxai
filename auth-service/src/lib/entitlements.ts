import { pool } from "./db";

/**
 * Источник истины по подписке — таблица user_entitlement.
 * Обновляется вебхуками Polar (onCustomerStateChanged), читается из /api/me.
 *
 * Почему отдельная таблица, а не запрос в Polar на каждый /api/me:
 *  - быстрее (без внешнего вызова на горячем пути),
 *  - переживает кратковременную недоступность Polar.
 */

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_entitlement (
      user_id            text PRIMARY KEY,
      customer_id        text,
      plan               text NOT NULL DEFAULT 'free',
      status             text,
      current_period_end timestamptz,
      updated_at         timestamptz NOT NULL DEFAULT now()
    );
  `);
}

type AnyObj = Record<string, any>;

export type Entitlement = {
  plan: "free" | "pro";
  status: string;
  currentPeriodEnd: string | null;
};

/**
 * Разбирает payload вебхука customer.state_changed и пишет план.
 *
 * ВНИМАНИЕ: точные имена полей зависят от версии Polar SDK/вебхука.
 * Здесь читаем защитно (camelCase + snake_case). После первого реального
 * вебхука в sandbox сверь форму payload по логам (onPayload) и при
 * необходимости поправь маппинг. См. README → «Проверка вебхука».
 */
export async function upsertEntitlementFromCustomerState(payload: AnyObj): Promise<void> {
  await ensureSchema();
  const data: AnyObj = payload?.data ?? payload ?? {};

  const userId: string | undefined =
    data?.externalId ?? data?.external_id ?? data?.customer?.externalId ?? data?.customer?.external_id;
  const customerId: string | undefined = data?.id ?? data?.customer?.id;

  if (!userId) {
    console.warn(
      "[entitlements] нет externalId в payload customer.state — пропуск.",
      JSON.stringify(data).slice(0, 800)
    );
    return;
  }

  const subs: AnyObj[] = data?.activeSubscriptions ?? data?.active_subscriptions ?? [];
  const active = subs.find((s) => ["active", "trialing"].includes(String(s?.status)));
  const plan: "free" | "pro" = active ? "pro" : "free";
  const status: string = active?.status ?? "none";
  const periodEnd: string | null =
    active?.currentPeriodEnd ?? active?.current_period_end ?? null;

  await pool.query(
    `INSERT INTO user_entitlement (user_id, customer_id, plan, status, current_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE SET
       customer_id        = EXCLUDED.customer_id,
       plan               = EXCLUDED.plan,
       status             = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end,
       updated_at         = now()`,
    [userId, customerId ?? null, plan, status, periodEnd]
  );
  console.log(`[entitlements] user=${userId} → plan=${plan} status=${status}`);
}

export async function getEntitlement(userId: string): Promise<Entitlement> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT plan, status, current_period_end FROM user_entitlement WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    return { plan: "free", status: "none", currentPeriodEnd: null };
  }
  return {
    plan: rows[0].plan === "pro" ? "pro" : "free",
    status: rows[0].status ?? "none",
    currentPeriodEnd: rows[0].current_period_end
      ? new Date(rows[0].current_period_end).toISOString()
      : null,
  };
}
