import { NextRequest, NextResponse } from "next/server";
import { HISTORY_USER_COOKIE_NAME } from "@/lib/history-user";

const analyzeApiUrl = process.env.ANALYZE_API_URL;
const backendApiKey = process.env.BACKEND_API_KEY;

export async function POST(req: NextRequest) {
  if (!analyzeApiUrl) {
    return NextResponse.json(
      {
        error: {
          code: "ANALYZE_API_URL_MISSING",
          message: "서버 환경변수 ANALYZE_API_URL이 설정되지 않았습니다."
        }
      },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const image = formData.get("image");
  const locale = String(formData.get("locale") || "ko-KR");

  if (!(image instanceof File)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_IMAGE",
          message: "이미지 파일이 필요합니다."
        }
      },
      { status: 400 }
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_IMAGE",
          message: "이미지 파일만 지원합니다."
        }
      },
      { status: 400 }
    );
  }

  const outgoing = new FormData();
  outgoing.append("image", image);
  outgoing.append("locale", locale);

  const headers: HeadersInit = {};
  const historyUserId = req.cookies.get(HISTORY_USER_COOKIE_NAME)?.value?.trim();
  if (backendApiKey) {
    headers.Authorization = `Bearer ${backendApiKey}`;
  }
  if (historyUserId) {
    headers["X-User-Id"] = historyUserId;
  }

  const upstream = await fetch(analyzeApiUrl, {
    method: "POST",
    headers,
    body: outgoing,
    cache: "no-store"
  });

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: {
          code: payload?.error?.code || "ANALYSIS_FAILED",
          message:
            payload?.error?.message || "외부 AI 분석 서버 요청에 실패했습니다."
        }
      },
      { status: upstream.status }
    );
  }

  return NextResponse.json(payload, { status: 200 });
}
