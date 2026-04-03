import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-message";
import { fromHistoryDbRow, HistoryDbRow, toHistoryDbRow } from "@/lib/history-record";
import { applyHistoryUserCookie, resolveHistoryUserId } from "@/lib/history-user";
import { HistoryEntry } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "history_entries";

function toStartOfDayKstIso(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toISOString();
}

function toEndOfDayKstIso(date: string) {
  return new Date(`${date}T23:59:59+09:00`).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { userId, shouldSetCookie } = resolveHistoryUserId(request);
    const supabase = createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? "30", 10) || 30, 1),
      100
    );
    const before = searchParams.get("before");
    const mode = searchParams.get("mode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const keyword = (searchParams.get("q") ?? "").trim();

    let query = supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) query = query.lt("created_at", before);
    if (mode && mode !== "all") query = query.eq("mode", mode);
    if (startDate) query = query.gte("created_at", toStartOfDayKstIso(startDate));
    if (endDate) query = query.lte("created_at", toEndOfDayKstIso(endDate));
    if (keyword) {
      const escaped = keyword.replace(/[%_]/g, "");
      query = query.or(`food_name.ilike.%${escaped}%,route_names_text.ilike.%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as HistoryDbRow[];
    const entries = rows.map(fromHistoryDbRow);
    const nextCursor = rows.length === limit ? rows[rows.length - 1]?.created_at ?? null : null;

    const response = NextResponse.json({ entries, nextCursor });
    applyHistoryUserCookie(response, userId, shouldSetCookie);
    return response;
  } catch (error) {
    const message = getErrorMessage(error, "기록 조회에 실패했습니다.");
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, shouldSetCookie } = resolveHistoryUserId(request);
    const supabase = createSupabaseServerClient();
    const body = (await request.json()) as { entry?: HistoryEntry };
    const entry = body.entry;
    if (!entry) {
      return NextResponse.json({ error: { message: "entry가 필요합니다." } }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...toHistoryDbRow(entry), user_id: userId })
      .select("*")
      .single();
    if (error) throw error;

    const response = NextResponse.json({ entry: fromHistoryDbRow(data as HistoryDbRow) });
    applyHistoryUserCookie(response, userId, shouldSetCookie);
    return response;
  } catch (error) {
    const message = getErrorMessage(error, "기록 저장에 실패했습니다.");
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, shouldSetCookie } = resolveHistoryUserId(request);
    const supabase = createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clear = searchParams.get("clear") === "true";

    if (clear) {
      const { error } = await supabase.from(TABLE).delete().eq("user_id", userId);
      if (error) throw error;
      const response = NextResponse.json({ ok: true });
      applyHistoryUserCookie(response, userId, shouldSetCookie);
      return response;
    }

    if (!id) {
      return NextResponse.json({ error: { message: "id가 필요합니다." } }, { status: 400 });
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    const response = NextResponse.json({ ok: true });
    applyHistoryUserCookie(response, userId, shouldSetCookie);
    return response;
  } catch (error) {
    const message = getErrorMessage(error, "기록 삭제에 실패했습니다.");
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
