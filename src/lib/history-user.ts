import { NextRequest, NextResponse } from "next/server";

export const HISTORY_USER_COOKIE_NAME = "eat_run_uid";

const TWO_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 2;

export function resolveHistoryUserId(request: NextRequest) {
  const fromCookie = request.cookies.get(HISTORY_USER_COOKIE_NAME)?.value?.trim();
  if (fromCookie) {
    return { userId: fromCookie, shouldSetCookie: false };
  }

  return { userId: crypto.randomUUID(), shouldSetCookie: true };
}

export function applyHistoryUserCookie(
  response: NextResponse,
  userId: string,
  shouldSetCookie: boolean
) {
  if (!shouldSetCookie) return;
  setHistoryUserCookie(response, userId);
}

export function setHistoryUserCookie(response: NextResponse, userId: string) {
  response.cookies.set(HISTORY_USER_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWO_YEARS_IN_SECONDS
  });
}
