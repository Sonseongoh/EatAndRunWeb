import { defineConfig } from "vitest/config";

// 단위 테스트는 순수 모듈(`src/lib/*`)을 대상으로 하므로 node 환경으로 충분하다.
// tsconfig의 `@/*` 경로 별칭은 Vite의 네이티브 tsconfig 경로 해석으로 처리한다.
export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
});
