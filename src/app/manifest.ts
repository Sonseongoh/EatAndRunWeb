import type { MetadataRoute } from "next";

// PWA 웹 매니페스트 (Next 15 메타데이터 라우트). /manifest.webmanifest로 서빙되고 자동 링크된다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eat & Run",
    short_name: "Eat & Run",
    description: "먹은 만큼 똑똑하게 — 계획부터 완수까지 추적하는 건강 루틴",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
