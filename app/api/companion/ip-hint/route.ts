import { NextResponse } from "next/server";
import { getIpLocationHintFromHeaders } from "../../../../lib/companionExploration";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.json({ hint: getIpLocationHintFromHeaders(request.headers) });
}
