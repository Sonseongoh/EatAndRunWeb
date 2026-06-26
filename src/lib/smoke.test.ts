import { describe, expect, it } from "vitest";
import { getActivityLabel } from "@/lib/activity";

// 테스트 러너가 동작하고, `@/` 경로 별칭으로 src 모듈을 import할 수 있음을 증명하는 스모크 테스트.
describe("test setup", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @/ path alias to a real src module", () => {
    expect(getActivityLabel("walk", "ko")).toBe("걷기");
  });
});
