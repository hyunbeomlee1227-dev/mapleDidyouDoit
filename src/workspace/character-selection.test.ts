import { expect, it } from "vitest";
import { createTestSchedulerWorkspaceSession } from "./testing/createTestSchedulerWorkspace";

const characterResponse = {
  ok: true, status: 200,
  body: { account_list: [{ account_id: "account-1", character_list: Array.from({ length: 11 }, (_, index) => ({
    ocid: `character-${index}`, character_name: `단풍용사${index}`, world_name: "스카니아", character_class: "히어로", character_level: 280,
  })) }] },
};

it("확정 저장 중 선택이 바뀌면 새 선택은 검토 전 상태를 유지한다", async () => {
  let release = () => {};
  const barrier = new Promise<void>(resolve => { release = resolve; });
  let delay = false;
  const session = createTestSchedulerWorkspaceSession({ nexonResponse: characterResponse, beforeWorkspaceSave: () => delay ? barrier : Promise.resolve() });
  await session.workspace.connectApiKey("test-key");
  await session.workspace.setCharacterActive("character-0", true);
  await session.workspace.reviewSelection();
  delay = true;
  const confirming = session.workspace.confirmSelection();
  const editing = session.workspace.setCharacterActive("character-1", true);
  release();
  await Promise.all([confirming, editing]);
  expect(session.workspace.getState()).toMatchObject({ selectionPhase: "editing", selectedIds: ["character-0", "character-1"] });
  const reopened = session.reopen();
  await reopened.initialize();
  expect(reopened.getState()).toMatchObject({ selectionPhase: "editing", selectedIds: ["character-0", "character-1"] });
});

it("손상된 저장 데이터는 삭제하거나 새 목록으로 덮어쓰지 않는다", async () => {
  const session = createTestSchedulerWorkspaceSession({ storedApiKey: "test-key", storedWorkspace: { version: 999 }, nexonResponse: characterResponse });
  await session.workspace.initialize();
  expect(session.workspace.getState()).toMatchObject({ selectionError: expect.stringContaining("데이터는 삭제하지 않았습니다") });
  const reopened = session.reopen();
  await reopened.initialize();
  expect(reopened.getState()).toMatchObject({ selectionError: expect.stringContaining("SELECTION_STORAGE_ERROR") });
});

it("확정 전의 선택도 다시 열면 편집 상태로 유지한다", async () => {
  const session = createTestSchedulerWorkspaceSession({ nexonResponse: characterResponse });
  await session.workspace.connectApiKey("test-key");
  await session.workspace.setCharacterActive("character-3", true);
  const reopened = session.reopen();
  await reopened.initialize();
  expect(reopened.getState()).toMatchObject({ selectionPhase: "editing", selectedIds: ["character-3"] });
});

it("저장에 실패한 선택 결과는 확정 성공으로 표시하지 않는다", async () => {
  const { workspace } = createTestSchedulerWorkspaceSession({ nexonResponse: characterResponse, workspaceSaveFailure: true });
  await workspace.connectApiKey("test-key");
  await workspace.setCharacterActive("character-0", true);
  await workspace.reviewSelection();
  await workspace.confirmSelection();
  expect(workspace.getState()).toMatchObject({ selectionPhase: "review", selectionError: expect.stringContaining("SELECTION_STORAGE_ERROR") });
});

it("저장된 키만 있는 기존 브라우저도 계정 캐릭터를 가져온다", async () => {
  const { workspace } = createTestSchedulerWorkspaceSession({ storedApiKey: "test-key", nexonResponse: characterResponse });
  await workspace.initialize();
  expect(workspace.getState()).toMatchObject({ characters: expect.arrayContaining([expect.objectContaining({ name: "단풍용사0" })]), selectedIds: [] });
});

it("검증된 계정 캐릭터를 도메인 모델로 가져오고 기본적으로 추적하지 않는다", async () => {
  const { workspace } = createTestSchedulerWorkspaceSession({ nexonResponse: characterResponse });
  await workspace.connectApiKey("test-key");
  expect(workspace.getState()).toMatchObject({ characters: expect.arrayContaining([expect.objectContaining({ id: "character-0", name: "단풍용사0", world: "스카니아", className: "히어로", level: 280 })]), selectedIds: [], selectionPhase: "editing" });
});

it("활성 추적 순서를 바꾸고 검토·확정한 결과를 다시 열어 복원한다", async () => {
  const session = createTestSchedulerWorkspaceSession({ nexonResponse: characterResponse });
  await session.workspace.connectApiKey("test-key");
  await session.workspace.setCharacterActive("character-0", true);
  await session.workspace.setCharacterActive("character-1", true);
  await session.workspace.moveCharacter("character-1", 0);
  await session.workspace.reviewSelection();
  expect(session.workspace.getState()).toMatchObject({ selectionPhase: "review", selectedIds: ["character-1", "character-0"] });
  await session.workspace.confirmSelection();
  const reopened = session.reopen();
  await reopened.initialize();
  expect(reopened.getState()).toMatchObject({ selectionPhase: "confirmed", selectedIds: ["character-1", "character-0"], characters: expect.arrayContaining([expect.objectContaining({ id: "character-10" })]) });
});

it("최대 10개만 활성 추적으로 선택하고 해제한 캐릭터는 목록에 유지한다", async () => {
  const { workspace } = createTestSchedulerWorkspaceSession({ nexonResponse: characterResponse });
  await workspace.connectApiKey("test-key");
  for (let index = 0; index < 11; index++) await workspace.setCharacterActive(`character-${index}`, true);
  expect(workspace.getState()).toMatchObject({ selectedIds: Array.from({ length: 10 }, (_, index) => `character-${index}`), selectionError: "활성 추적 캐릭터는 최대 10개까지 선택할 수 있습니다. (SELECTION_LIMIT_REACHED)" });
  await workspace.setCharacterActive("character-0", false);
  expect(workspace.getState()).toMatchObject({ characters: expect.arrayContaining([expect.objectContaining({ id: "character-0" })]), selectedIds: expect.not.arrayContaining(["character-0"]) });
});
