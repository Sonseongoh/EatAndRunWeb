import { NextRequest, NextResponse } from "next/server";
import {
  applyAccessCookies,
  createLoginRequiredResponse,
  resolveAccessContext
} from "@/lib/auth-access";

export async function GET(request: NextRequest) {
  const access = await resolveAccessContext(request, { allowGuest: true });
  if (access.kind === "denied") return createLoginRequiredResponse();

  const response = NextResponse.json({
    ok: true,
    mode: access.kind
  });
  applyAccessCookies(response, access);
  return response;
}

