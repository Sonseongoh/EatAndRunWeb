import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-message";
import { applyHistoryUserCookie, resolveHistoryUserId } from "@/lib/history-user";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { toHistoryDbRow } from "@/lib/history-record";
import { createMockHistoryEntries } from "@/lib/mock-history";

const TABLE = "history_entries";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: { message: "프로덕션에서는 테스트 데이터 시드를 사용할 수 없습니다." } },
      { status: 403 }
    );
  }

  try {
    const { userId, shouldSetCookie } = resolveHistoryUserId(request);
    const supabase = createSupabaseServerClient();
    const mockEntries = createMockHistoryEntries();
    const rows = mockEntries.map((entry) => ({ ...toHistoryDbRow(entry), user_id: userId }));

    const { error: clearError } = await supabase.from(TABLE).delete().eq("user_id", userId);
    if (clearError) throw clearError;

    const { error } = await supabase.from(TABLE).insert(rows);
    if (error) throw error;

    const response = NextResponse.json({ inserted: rows.length });
    applyHistoryUserCookie(response, userId, shouldSetCookie);
    return response;
  } catch (error) {
    const message = getErrorMessage(error, "테스트 데이터 입력에 실패했습니다.");
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
