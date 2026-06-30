"use client";

import { useEffect } from "react";

// 서비스워커 등록. 개발 모드에선 HMR 간섭을 피하려 등록하지 않는다(프로덕션 빌드에서만 동작).
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // 이 효과는 하이드레이션 이후 실행되므로 window 'load'는 이미 지났다.
    // 따라서 load 이벤트를 기다리지 말고 곧바로 등록한다.
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
