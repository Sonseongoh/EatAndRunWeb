import { NextRequest, NextResponse } from "next/server";
import {
  createLoginRequiredResponse,
  resolveAccessContext
} from "@/lib/auth-access";
import {
  HISTORY_USER_COOKIE_NAME,
  setHistoryUserCookie
} from "@/lib/history-user";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "history_entries";

export async function POST(request: NextRequest) {
  const access = await resolveAccessContext(request, { allowGuest: false });
  if (access.kind !== "authenticated") return createLoginRequiredResponse();

  const guestUserId = request.cookies.get(HISTORY_USER_COOKIE_NAME)?.value?.trim();
  if (!guestUserId || guestUserId === access.userId) {
    const response = NextResponse.json({ migrated: 0 });
    setHistoryUserCookie(response, access.userId);
    return response;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ user_id: access.userId })
    .eq("user_id", guestUserId)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: { message: error.message || "기록 이관에 실패했습니다." } },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ migrated: data?.length ?? 0 });
  setHistoryUserCookie(response, access.userId);
  return response;
}

