import { NextRequest, NextResponse } from "next/server";
import { applyHistoryUserCookie, resolveHistoryUserId } from "@/lib/history-user";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const TWO_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 2;
export const TRIAL_USED_COOKIE_NAME = "eat_run_trial_used";

type AccessContext =
  | {
      kind: "authenticated";
      userId: string;
    }
  | {
      kind: "guest";
      userId: string;
      shouldSetHistoryCookie: boolean;
    }
  | {
      kind: "denied";
    };

function getBearerToken(request: NextRequest) {
  const raw = request.headers.get("authorization") ?? "";
  if (!raw.startsWith("Bearer ")) return null;
  return raw.slice("Bearer ".length).trim() || null;
}

export async function resolveAccessContext(
  request: NextRequest,
  options?: { allowGuest?: boolean }
): Promise<AccessContext> {
  const allowGuest = options?.allowGuest ?? true;
  const token = getBearerToken(request);

  if (token) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user?.id) {
        return { kind: "authenticated", userId: data.user.id };
      }
    } catch {
      // Fallback to guest resolution below.
    }
  }

  const trialUsed = request.cookies.get(TRIAL_USED_COOKIE_NAME)?.value === "1";
  if (!allowGuest || trialUsed) return { kind: "denied" };

  const { userId, shouldSetCookie } = resolveHistoryUserId(request);
  return { kind: "guest", userId, shouldSetHistoryCookie: shouldSetCookie };
}

export function applyAccessCookies(
  response: NextResponse,
  access: AccessContext,
  options?: { markTrialUsed?: boolean }
) {
  if (access.kind === "guest") {
    applyHistoryUserCookie(response, access.userId, access.shouldSetHistoryCookie);
  }

  if (options?.markTrialUsed) {
    response.cookies.set(TRIAL_USED_COOKIE_NAME, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TWO_YEARS_IN_SECONDS
    });
  }
}

export function createLoginRequiredResponse() {
  return NextResponse.json(
    {
      error: {
        code: "LOGIN_REQUIRED",
        message: "첫 체험 후 계속 사용하려면 로그인이 필요합니다."
      }
    },
    { status: 401 }
  );
}

