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

  const status: string = rows[0].status ?? "none";
  const periodEnd: Date | null = rows[0].current_period_end
    ? new Date(rows[0].current_period_end)
    : null;

  // Триал (без карты/вебхуков) истекает САМ по дате: после current_period_end → free.
  // Платные подписки (status=active) по дате НЕ гасим — их закрывает вебхук Polar.
  const trialExpired =
    status === "trialing" && periodEnd !== null && periodEnd.getTime() < Date.now();

  const plan: "free" | "pro" = !trialExpired && rows[0].plan === "pro" ? "pro" : "free";

  return {
    plan,
    status: trialExpired ? "expired" : status,
    currentPeriodEnd: periodEnd ? periodEnd.toISOString() : null,
  };
}

export type TrialResult =
  | { ok: true; currentPeriodEnd: string }
  | { ok: false; reason: "already_pro" };

/**
 * Выдаёт бесплатный триал на N дней (без карты, без Polar). Пишет в ту же
 * таблицу user_entitlement: plan=pro, status=trialing, срок = now + days.
 * По решению заказчицы повторных проверок НЕТ — код можно активировать
 * многократно. Единственная защита: не затираем активную ПЛАТНУЮ подписку.
 */
export async function startTrial(userId: string, days: number): Promise<TrialResult> {
  await ensureSchema();

  const { rows } = await pool.query(
    `SELECT plan, status FROM user_entitlement WHERE user_id = $1`,
    [userId]
  );
  if (rows.length > 0 && rows[0].plan === "pro" && rows[0].status === "active") {
    return { ok: false, reason: "already_pro" };
  }

  const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO user_entitlement (user_id, customer_id, plan, status, current_period_end, updated_at)
     VALUES ($1, NULL, 'pro', 'trialing', $2, now())
     ON CONFLICT (user_id) DO UPDATE SET
       plan               = 'pro',
       status             = 'trialing',
       current_period_end = EXCLUDED.current_period_end,
       updated_at         = now()`,
    [userId, periodEnd.toISOString()]
  );
  console.log(`[entitlements] trial granted user=${userId} until=${periodEnd.toISOString()}`);
  return { ok: true, currentPeriodEnd: periodEnd.toISOString() };
}
