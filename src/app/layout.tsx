import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { QueryProvider } from "@/providers/query-provider";
import { InstallPrompt } from "./components/install-prompt";
import { LocaleFab } from "./components/locale-fab";
import { PwaRegister } from "./components/pwa-register";
import { TopNav } from "./components/top-nav";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://eat-and-run-web.vercel.app";
const siteTitle = "Eat & Run | 먹은 만큼 똑똑하게 달리기";
const siteDescription =
  "음식 사진 칼로리 분석부터 러닝 경로 추천까지 한 번에 연결하는 실행형 건강 루틴 서비스";
const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Eat & Run - 먹은 만큼 똑똑하게 달리기"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Eat & Run",
    images: [ogImage],
    locale: "ko_KR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage]
  },
  other: {
    "google-adsense-account": "ca-pub-9041574190753656"
  }
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {/* Google Maps JS는 /map 화면의 GoogleRouteMap(useJsApiLoader)에서만 로드한다.
            전역 주입을 제거해 지도가 없는 페이지의 초기 로딩을 가볍게 유지. */}
        <Script
          id="iconify-script"
          strategy="afterInteractive"
          src="https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js"
        />
        <Script
          id="google-analytics-script"
          async
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-7JRKMDRH7N"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7JRKMDRH7N');
          `}
        </Script>
        <Script id="microsoft-clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "w7rxyf7yoj");
          `}
        </Script>
        <QueryProvider>
          <LocaleProvider>
            <AuthProvider>
              <TopNav />
              <LocaleFab />
              {children}
              <InstallPrompt />
              <PwaRegister />
            </AuthProvider>
          </LocaleProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

