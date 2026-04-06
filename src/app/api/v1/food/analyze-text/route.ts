import { NextRequest, NextResponse } from "next/server";
import {
  applyAccessCookies,
  createLoginRequiredResponse,
  resolveAccessContext
} from "@/lib/auth-access";

const analyzeApiUrl = process.env.ANALYZE_API_URL;
const backendApiKey = process.env.BACKEND_API_KEY;

function resolveTextAnalyzeUrl() {
  if (!analyzeApiUrl) return null;
  if (analyzeApiUrl.includes("/v1/food/analyze")) {
    return analyzeApiUrl.replace(/\/v1\/food\/analyze\/?$/, "/v1/food/analyze-text");
  }

  try {
    const url = new URL(analyzeApiUrl);
    url.pathname = "/v1/food/analyze-text";
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const access = await resolveAccessContext(req, { allowGuest: true });
  if (access.kind === "denied") return createLoginRequiredResponse();

  const textAnalyzeUrl = resolveTextAnalyzeUrl();
  if (!textAnalyzeUrl) {
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

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const locale = typeof body?.locale === "string" ? body.locale : "ko-KR";

  if (!text) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_TEXT",
          message: "분석할 음식 텍스트를 입력해주세요."
        }
      },
      { status: 400 }
    );
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  if (backendApiKey) {
    headers.Authorization = `Bearer ${backendApiKey}`;
  }
  headers["X-User-Id"] = access.userId;

  const upstream = await fetch(textAnalyzeUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, locale }),
    cache: "no-store"
  });

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: {
          code: payload?.error?.code || "ANALYSIS_FAILED",
          message: payload?.error?.message || "텍스트 분석 요청에 실패했습니다."
        }
      },
      { status: upstream.status }
    );
  }

  const response = NextResponse.json(payload, { status: 200 });
  applyAccessCookies(response, access);
  return response;
}
