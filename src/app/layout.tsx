import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { TopNav } from "./components/top-nav";

export const metadata: Metadata = {
  title: "먹고 달리기",
  description: "사진 기반 칼로리 분석과 운동 추천 서비스"
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
        <QueryProvider>
          <TopNav />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
