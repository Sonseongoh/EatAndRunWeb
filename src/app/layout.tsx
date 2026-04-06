import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TopNav } from "./components/top-nav";

export const metadata: Metadata = {
  title: "Eat & Run | 먹은 만큼 똑똑하게 달리기",
  description:
    "음식 사진 칼로리 분석부터 러닝 경로 추천까지 한 번에 연결하는 실행형 건강 루틴 서비스"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <Script
            id="google-map-script"
            strategy="afterInteractive"
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          />
        ) : null}
        <Script
          id="iconify-script"
          strategy="afterInteractive"
          src="https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js"
        />
        <QueryProvider>
          <AuthProvider>
            <TopNav />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

