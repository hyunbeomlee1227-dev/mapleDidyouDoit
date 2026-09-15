import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createTestSchedulerWorkspace } from "./workspace/testing/createTestSchedulerWorkspace";

describe("메했니? 앱 셸", () => {
  it("사용자가 서비스 범위와 넥슨 출처를 확인한다", () => {
    const workspace = createTestSchedulerWorkspace();

    render(<App workspace={workspace} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "메했니?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("메이플 스케줄러 자동 체크")).toBeInTheDocument();
    expect(screen.getByText("KMS 전용 서비스")).toBeInTheDocument();
    expect(screen.getByText("Data based on NEXON Open API")).toBeInTheDocument();
    expect(screen.getByText("넥슨의 공식 서비스가 아닙니다")).toBeInTheDocument();
  });
});
