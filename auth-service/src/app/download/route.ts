import { NextRequest, NextResponse } from "next/server";

// Одна кнопка «Скачать» на лендинге ведёт сюда. Эндпоинт определяет ОС по
// User-Agent и 302-редиректит на свежий установщик из последнего GitHub-релиза,
// поэтому ссылка на сайте не зависит от номера версии.

const REPO = "aman-tiger/siplinxai";
const RELEASES = `https://github.com/${REPO}/releases`;
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;

type Platform = "mac" | "win";
type Asset = { name: string; browser_download_url: string };

function detectPlatform(req: NextRequest): Platform | null {
  const forced = req.nextUrl.searchParams.get("platform");
  if (forced === "mac" || forced === "win") return forced;

  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  // Мобильные сначала: в iOS User-Agent есть "mac os x", иначе iPhone получил бы .dmg.
  if (/iphone|ipad|ipod|android|mobile/.test(ua)) return null;
  if (ua.includes("win")) return "win";
  if (ua.includes("mac")) return "mac";
  return null;
}

function pickAsset(assets: Asset[], platform: Platform): Asset | undefined {
  const by = (suffix: string) => assets.find((a) => a.name.toLowerCase().endsWith(suffix));
  if (platform === "mac") return by(".dmg");
  // Windows: предпочитаем NSIS-установщик (-setup.exe), затем любой .exe, затем .msi.
  return by("-setup.exe") ?? by(".exe") ?? by(".msi");
}

export async function GET(req: NextRequest) {
  const platform = detectPlatform(req);

  // Неизвестная ОС (Linux/мобильный) → страница релизов, пусть выберут вручную.
  if (!platform) {
    return NextResponse.redirect(`${RELEASES}/latest`, 302);
  }

  try {
    const res = await fetch(LATEST_API, {
      headers: { Accept: "application/vnd.github+json" },
      // Кэшируем ответ GitHub, чтобы не упереться в лимит 60 запросов/час.
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);

    const release = (await res.json()) as { assets?: Asset[] };
    const asset = pickAsset(release.assets ?? [], platform);
    if (asset) {
      return NextResponse.redirect(asset.browser_download_url, 302);
    }
  } catch {
    // упадём на страницу релизов ниже
  }

  return NextResponse.redirect(`${RELEASES}/latest`, 302);
}
