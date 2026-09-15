import { z } from "zod";

const characterListResponseSchema = z.object({
  account_list: z.array(
    z.object({
      account_id: z.string(),
      character_list: z.array(
        z.object({
          ocid: z.string(),
          character_name: z.string(),
          world_name: z.string(),
          character_class: z.string(),
          character_level: z.number(),
        }),
      ),
    }),
  ),
});

export type SchedulerWorkspaceState =
  | Readonly<{
      screen: "connect-api-key";
      status: "idle" | "validating" | "error";
      error?: Readonly<{ kind: string; code: string; message: string }>;
    }>
  | Readonly<{
      screen: "api-key-connected";
      source: "validated" | "stored";
      characterCount?: number;
      characters?: readonly AccountCharacter[];
      selectedIds?: readonly string[];
      selectionPhase?: "editing" | "review" | "confirmed";
      selectionError?: string;
    }>;

export type AccountCharacter = Readonly<{ id: string; name: string; world: string; className: string; level: number }>;

const savedSelectionSchema = z.object({
  version: z.literal(1),
  characters: z.array(z.object({ id: z.string(), name: z.string(), world: z.string(), className: z.string(), level: z.number() })),
  selectedIds: z.array(z.string()).max(10),
  selectionPhase: z.enum(["editing", "review", "confirmed"]),
}).refine(value => new Set(value.characters.map(character => character.id)).size === value.characters.length && new Set(value.selectedIds).size === value.selectedIds.length && value.selectedIds.every(id => value.characters.some(character => character.id === id)));

export interface SchedulerWorkspace {
  getState(): SchedulerWorkspaceState;
  subscribe(listener: () => void): () => void;
  connectApiKey(apiKey: string): Promise<void>;
  setCharacterActive(id: string, active: boolean): Promise<void>;
  initialize(): Promise<void>;
  moveCharacter(id: string, destinationIndex: number): Promise<void>;
  reviewSelection(): Promise<void>;
  confirmSelection(): Promise<void>;
}

export type NexonGatewayResponse = Readonly<{
  ok: boolean;
  status: number;
  body: unknown;
}>;

export interface NexonGateway {
  getAccountCharacters(apiKey: string): Promise<NexonGatewayResponse>;
}

export interface WorkspaceStorage {
  load(): Promise<unknown | null>;
  save(value: unknown): Promise<void>;
  clear(): Promise<void>;
}

export interface ApiKeyStorage {
  load(): string | null;
  save(apiKey: string): void;
  clear(): void;
}

export type SchedulerWorkspaceDependencies = Readonly<{
  nexon: NexonGateway;
  storage: WorkspaceStorage;
  apiKeyStorage: ApiKeyStorage;
}>;

export function createSchedulerWorkspace(
  dependencies: SchedulerWorkspaceDependencies,
): SchedulerWorkspace {
  const listeners = new Set<() => void>();
  const storageErrorState: SchedulerWorkspaceState = {
    screen: "connect-api-key", status: "error",
    error: { kind: "storage", code: "STORAGE_UNAVAILABLE", message: "브라우저 저장소를 사용할 수 없습니다. 사이트 저장 권한과 남은 공간을 확인한 뒤 다시 연결해 주세요." },
  };
  let state: SchedulerWorkspaceState;
  try {
    state = dependencies.apiKeyStorage.load()
      ? { screen: "api-key-connected", source: "stored" }
      : { screen: "connect-api-key", status: "idle" };
  } catch {
    state = storageErrorState;
  }

  const updateState = (nextState: SchedulerWorkspaceState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
  };

  let saveQueue = Promise.resolve(true);
  const persistSelection = (phase?: "confirmed") => {
    if (state.screen !== "api-key-connected" || !state.characters) return Promise.resolve(false);
    const snapshot = { version: 1, characters: state.characters, selectedIds: state.selectedIds ?? [], selectionPhase: phase ?? state.selectionPhase ?? "editing" };
    saveQueue = saveQueue.then(async () => {
      try {
        await dependencies.storage.save(snapshot);
        return true;
      } catch {
        if (state.screen === "api-key-connected") updateState({ ...state, selectionError: "로컬 저장에 실패했습니다. 사이트 저장 권한과 남은 공간을 확인해 주세요. (SELECTION_STORAGE_ERROR)" });
        return false;
      }
    });
    return saveQueue;
  };
  let initialization: Promise<void> | undefined;

  const workspace: SchedulerWorkspace = {
    initialize() {
      if (initialization) return initialization;
      initialization = (async () => {
        if (state.screen !== "api-key-connected" || state.characters) return;
        try {
          const saved = await dependencies.storage.load();
          if (saved == null) {
            const apiKey = dependencies.apiKeyStorage.load();
            if (apiKey) await workspace.connectApiKey(apiKey);
            return;
          }
          const parsed = savedSelectionSchema.safeParse(saved);
          if (!parsed.success) throw new Error("Invalid local selection");
          updateState({ screen: "api-key-connected", source: "stored", characterCount: parsed.data.characters.length, characters: parsed.data.characters, selectedIds: parsed.data.selectedIds, selectionPhase: parsed.data.selectionPhase });
        } catch {
          if (state.screen === "api-key-connected") updateState({ ...state, selectionError: "저장된 캐릭터 정보를 읽을 수 없습니다. 데이터는 삭제하지 않았습니다. 새로고침 후 다시 시도해 주세요. (SELECTION_STORAGE_ERROR)" });
        }
      })();
      return initialization;
    },
    async moveCharacter(id, destinationIndex) {
      if (state.screen !== "api-key-connected") return;
      const selectedIds = [...state.selectedIds ?? []];
      const index = selectedIds.indexOf(id);
      if (index < 0 || !Number.isInteger(destinationIndex) || destinationIndex < 0 || destinationIndex >= selectedIds.length) return;
      selectedIds.splice(index, 1);
      selectedIds.splice(destinationIndex, 0, id);
      updateState({ ...state, selectedIds, selectionPhase: "editing", selectionError: undefined });
      await persistSelection();
    },
    async reviewSelection() {
      if (state.screen !== "api-key-connected") return;
      if (!state.selectedIds?.length) {
        updateState({ ...state, selectionError: "활성 추적 캐릭터를 1개 이상 선택해 주세요." });
        return;
      }
      updateState({ ...state, selectionPhase: "review", selectionError: undefined });
      await persistSelection();
    },
    async confirmSelection() {
      if (state.screen !== "api-key-connected" || state.selectionPhase !== "review") return;
      const saved = await persistSelection("confirmed");
      if (saved && state.screen === "api-key-connected") updateState({ ...state, selectionPhase: "confirmed", selectionError: undefined });
    },
    async setCharacterActive(id, active) {
      if (state.screen !== "api-key-connected" || !state.characters?.some(character => character.id === id)) return;
      const selectedIds = state.selectedIds ?? [];
      if (active && !selectedIds.includes(id) && selectedIds.length >= 10) {
        updateState({ ...state, selectionError: "활성 추적 캐릭터는 최대 10개까지 선택할 수 있습니다." });
        return;
      }
      updateState({ ...state, selectedIds: active ? selectedIds.includes(id) ? selectedIds : [...selectedIds, id] : selectedIds.filter(selected => selected !== id), selectionError: undefined, selectionPhase: "editing" });
      await persistSelection();
    },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async connectApiKey(apiKey) {
      updateState({ screen: "connect-api-key", status: "validating" });

      try {
        const response = await dependencies.nexon.getAccountCharacters(apiKey);
        if (!response.ok) {
          const invalidKey = z.object({ error: z.object({ name: z.literal("OPENAPI00005") }) }).safeParse(response.body).success;
          updateState({ screen: "connect-api-key", status: "error", error: invalidKey
            ? { kind: "invalid-key", code: "KEY_INVALID", message: "API 키가 올바르지 않습니다. 다시 확인해 주세요." }
            : response.status === 403
              ? { kind: "forbidden", code: "KEY_FORBIDDEN", message: "이 API 키로 캐릭터 목록을 조회할 권한이 없습니다." }
              : { kind: "service", code: "NEXON_UNAVAILABLE", message: "넥슨 API를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요." } });
          return;
        }

        const parsed = characterListResponseSchema.safeParse(response.body);
        if (!parsed.success) {
          updateState({ screen: "connect-api-key", status: "error", error: { kind: "response-invalid", code: "RESPONSE_INVALID", message: "넥슨 API 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요." } });
          return;
        }

        try {
          dependencies.apiKeyStorage.save(apiKey);
        } catch {
          updateState(storageErrorState);
          return;
        }
        const characterCount = parsed.data.account_list.reduce(
          (count, account) => count + account.character_list.length,
          0,
        );
        updateState({
          screen: "api-key-connected",
          source: "validated",
          characterCount,
          characters: parsed.data.account_list.flatMap(account => account.character_list.map(character => ({ id: character.ocid, name: character.character_name, world: character.world_name, className: character.character_class, level: character.character_level }))),
          selectedIds: [],
          selectionPhase: "editing",
        });
        await persistSelection();
      } catch {
        updateState({ screen: "connect-api-key", status: "error", error: { kind: "network", code: "NETWORK_ERROR", message: "넥슨 API에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요." } });
      }
    },
  };
  return workspace;
}
