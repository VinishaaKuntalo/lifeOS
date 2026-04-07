import { NextResponse } from "next/server";

import { APP_ROUTES } from "@/lib/constants/routes";
import { getClientEnv } from "@/lib/env/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? APP_ROUTES.dashboard;
  const error = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(APP_ROUTES.login, getClientEnv().NEXT_PUBLIC_APP_URL),
    );
  }

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(
    new URL(next, getClientEnv().NEXT_PUBLIC_APP_URL),
  );
}
