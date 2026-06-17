import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";

export const dynamic = "force-dynamic";

/**
 * Десктоп вызывает с Authorization: Bearer <token> (fetch), получает { url }
 * и сам открывает url в системном браузере. Так не зависим от cookie в браузере.
 *
 * ?plan=monthly | yearly
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const plan = new URL(req.url).searchParams.get("plan") ?? "monthly";
  const productId =
    plan === "yearly"
      ? (process.env.POLAR_PRODUCT_ID_YEARLY as string)
      : (process.env.POLAR_PRODUCT_ID_MONTHLY as string);

  // План недоступен, если для него не задан ID продукта (напр. годовой пока не заведён).
  if (!productId) {
    return NextResponse.json({ error: `plan "${plan}" unavailable` }, { status: 400 });
  }

  const successUrl = new URL("/success", req.url).toString();

  // ВНИМАНИЕ: сигнатура checkouts.create зависит от версии @polar-sh/sdk.
  // Если SDK ругается — сверь поля по docs.polar.sh (products / productPriceId).
  const checkoutSession = await polarClient.checkouts.create({
    products: [productId],
    successUrl,
    customerExternalId: session.user.id,
    customerEmail: session.user.email ?? undefined,
  } as any);

  return NextResponse.json({ url: (checkoutSession as any).url });
}
