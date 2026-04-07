import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "lifeos",
    timestamp: new Date().toISOString(),
  });
}
