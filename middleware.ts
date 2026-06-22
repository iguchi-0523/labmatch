import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin 以下を HTTP Basic 認証で保護する。
 *
 * 環境変数（Vercel に設定）:
 *   ADMIN_PASSWORD … 必須。未設定なら /admin は 503 で閉じる（誤公開防止）
 *   ADMIN_USER     … 任意。未設定ならユーザ名は不問（パスワードのみ照合）
 *
 * HTTPS 前提なので Basic 認証で十分。Cookie ログインより実装が薄い。
 */
export const config = { matcher: ["/admin/:path*", "/admin"] };

export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return new NextResponse("Admin is not configured.", { status: 503 });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    const user = sep >= 0 ? decoded.slice(0, sep) : "";
    const pass = sep >= 0 ? decoded.slice(sep + 1) : "";
    const expectedUser = process.env.ADMIN_USER;
    const userOk = !expectedUser || user === expectedUser;
    if (userOk && pass === expected) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="labmatch admin", charset="UTF-8"',
    },
  });
}
