import { describe, expect, it } from "vitest";

import { createTestSchedulerWorkspaceSession } from "./testing/createTestSchedulerWorkspace";

describe("사용자 API 키 연결", () => {
  it("서버 오류를 키 권한 문제로 오해하지 않는다", async () => {
    const { workspace } = createTestSchedulerWorkspaceSession({ nexonResponse: { ok: false, status: 503, body: null } });
    await workspace.connectApiKey("test-key");
    expect(workspace.getState()).toMatchObject({ error: { kind: "service", code: "NEXON_UNAVAILABLE" } });
  });
  it("응답 형식이 바뀌면 저장하지 않고 확인 불가를 안내한다", async () => {
    const session = createTestSchedulerWorkspaceSession({ nexonResponse: { ok: true, status: 200, body: { unexpected: "value" } } });
    await session.workspace.connectApiKey("secret-key");
    expect(session.workspace.getState()).toMatchObject({ error: { kind: "response-invalid", code: "RESPONSE_INVALID" } });
    expect(session.reopen().getState()).toMatchObject({ screen: "connect-api-key", status: "idle" });
  });
  it("연결 실패는 키를 포함하지 않는 네트워크 오류로 안내한다", async () => {
    const { workspace } = createTestSchedulerWorkspaceSession({ networkFailure: true });
    await workspace.connectApiKey("secret-key");
    expect(workspace.getState()).toMatchObject({ error: { kind: "network", code: "NETWORK_ERROR" } });
    expect(JSON.stringify(workspace.getState())).not.toContain("secret-key");
  });
  it("조회 권한이 없는 키에는 권한 안내를 표시한다", async () => {
    const { workspace } = createTestSchedulerWorkspaceSession({ nexonResponse: { ok: false, status: 403, body: { error: { name: "OPENAPI00002" } } } });
    await workspace.connectApiKey("forbidden-key");
    expect(workspace.getState()).toMatchObject({ status: "error", error: { kind: "forbidden", code: "KEY_FORBIDDEN" } });
  });
  it("유효한 키를 연결하면 다음 단계로 이동하고 다시 열어도 연결 상태를 복원한다", async () => {
    const session = createTestSchedulerWorkspaceSession({
      nexonResponse: {
        ok: true,
        status: 200,
        body: {
          account_list: [
            {
              account_id: "account-1",
              character_list: [
                {
                  ocid: "character-1",
                  character_name: "단풍용사",
                  world_name: "스카니아",
                  character_class: "히어로",
                  character_level: 280,
                },
              ],
            },
          ],
        },
      },
    });

    await session.workspace.connectApiKey("valid-api-key");

    expect(session.workspace.getState()).toMatchObject({
      screen: "api-key-connected",
      source: "validated",
      characterCount: 1,
    });
    expect(session.reopen().getState()).toMatchObject({
      screen: "api-key-connected",
      source: "stored",
    });
  });

  it("잘못된 키는 저장하지 않고 다시 입력할 수 있게 안내한다", async () => {
    const session = createTestSchedulerWorkspaceSession({
      nexonResponse: {
        ok: false,
        status: 400,
        body: {
          error: {
            name: "OPENAPI00005",
            message: "Invalid API key",
          },
        },
      },
    });

    await session.workspace.connectApiKey("invalid-api-key");

    expect(session.workspace.getState()).toEqual({
      screen: "connect-api-key",
      status: "error",
      error: {
        kind: "invalid-key",
        code: "KEY_INVALID",
        message: "API 키가 올바르지 않습니다. 다시 확인해 주세요.",
      },
    });
    expect(session.reopen().getState()).toEqual({
      screen: "connect-api-key",
      status: "idle",
    });
  });
});
