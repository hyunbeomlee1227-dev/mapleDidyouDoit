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
    }>;

export interface SchedulerWorkspace {
  getState(): SchedulerWorkspaceState;
  subscribe(listener: () => void): () => void;
  connectApiKey(apiKey: string): Promise<void>;
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
  let state: SchedulerWorkspaceState = dependencies.apiKeyStorage.load()
    ? { screen: "api-key-connected", source: "stored" }
    : { screen: "connect-api-key", status: "idle" };

  const updateState = (nextState: SchedulerWorkspaceState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
  };

  return {
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

        dependencies.apiKeyStorage.save(apiKey);
        const characterCount = parsed.data.account_list.reduce(
          (count, account) => count + account.character_list.length,
          0,
        );
        updateState({
          screen: "api-key-connected",
          source: "validated",
          characterCount,
        });
      } catch {
        updateState({ screen: "connect-api-key", status: "error", error: { kind: "network", code: "NETWORK_ERROR", message: "넥슨 API에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요." } });
      }
    },
  };
}
