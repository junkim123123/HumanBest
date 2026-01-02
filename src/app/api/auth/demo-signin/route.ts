// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // Set demo auth cookie
  cookieStore.set("ns_user", "demo-user-id", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  const url = new URL(request.url);
  const origin = url.origin;
  
  return NextResponse.redirect(new URL("/app", origin));
}

