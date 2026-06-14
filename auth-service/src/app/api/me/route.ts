import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlement } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

/**
 * Главный endpoint для десктопа. Принимает Authorization: Bearer <token>.
 * Возвращает профиль + текущий план (free | pro).
 * Десктоп зовёт его при старте и периодически (см. offline-грейс на клиенте).
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ent = await getEntitlement(session.user.id);

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null,
    },
    plan: ent.plan,
    status: ent.status,
    currentPeriodEnd: ent.currentPeriodEnd,
    serverTime: new Date().toISOString(),
  });
}
