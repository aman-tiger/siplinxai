import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";

export const dynamic = "force-dynamic";

/**
 * "Manage subscription". Десктоп вызывает с Bearer-токеном, получает { url }
 * и открывает Polar Customer Portal в браузере.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ВНИМАНИЕ: имя метода/поля зависит от версии SDK
  // (customerSessions.create → customerPortalUrl). Сверь при ошибке.
  const portalSession = await polarClient.customerSessions.create({
    customerExternalId: session.user.id,
  } as any);

  return NextResponse.json({ url: (portalSession as any).customerPortalUrl });
}
