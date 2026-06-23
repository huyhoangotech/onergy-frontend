import { NextResponse } from "next/server";

/** @param {import('next/server').NextRequest} req */
export const middleware = (req) => {
  const token = req.cookies.get("adminToken")?.value;

  // ❌ chưa đăng nhập → 404
  if (!token) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/admin/:path*"],
};
