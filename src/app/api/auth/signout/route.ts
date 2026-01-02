// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // Clear auth cookie
  cookieStore.delete("ns_user");

  const url = new URL(request.url);
  const origin = url.origin;
  
  return NextResponse.redirect(new URL("/", origin));
}

