import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-message";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { toHistoryDbRow } from "@/lib/history-record";
import { createMockHistoryEntries } from "@/lib/mock-history";

const TABLE = "history_entries";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: { message: "프로덕션에서는 테스트 데이터 시드를 사용할 수 없습니다." } },
      { status: 403 }
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const mockEntries = createMockHistoryEntries();
    const rows = mockEntries.map(toHistoryDbRow);

    const { error: clearError } = await supabase.from(TABLE).delete().not("id", "is", null);
    if (clearError) throw clearError;

    const { error } = await supabase.from(TABLE).insert(rows);
    if (error) throw error;

    return NextResponse.json({ inserted: rows.length });
  } catch (error) {
    const message = getErrorMessage(error, "테스트 데이터 입력에 실패했습니다.");
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
