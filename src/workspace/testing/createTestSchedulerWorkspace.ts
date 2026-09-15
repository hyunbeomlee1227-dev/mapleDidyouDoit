import {
  createSchedulerWorkspace,
  type ApiKeyStorage,
  type NexonGateway,
  type NexonGatewayResponse,
  type SchedulerWorkspace,
  type WorkspaceStorage,
} from "../SchedulerWorkspace";

type TestSchedulerWorkspaceOptions = Readonly<{
  nexonResponse?: NexonGatewayResponse;
  networkFailure?: boolean;
}>;

export function createTestSchedulerWorkspaceSession(
  options: TestSchedulerWorkspaceOptions = {},
) {
  let storedApiKey: string | null = null;
  let storedValue: unknown | null = null;

  const nexon: NexonGateway = {
    getAccountCharacters: async () => {
      if (options.networkFailure) throw new Error("Network unavailable");
      return options.nexonResponse ?? {
        ok: true,
        status: 200,
        body: { account_list: [] },
      };
    },
  };

  const storage: WorkspaceStorage = {
    load: async () => storedValue,
    save: async (value) => {
      storedValue = value;
    },
    clear: async () => {
      storedValue = null;
    },
  };

  const apiKeyStorage: ApiKeyStorage = {
    load: () => storedApiKey,
    save: (apiKey) => {
      storedApiKey = apiKey;
    },
    clear: () => {
      storedApiKey = null;
    },
  };

  const createWorkspace = () =>
    createSchedulerWorkspace({ nexon, storage, apiKeyStorage });

  return {
    workspace: createWorkspace(),
    reopen: createWorkspace,
  };
}

export function createTestSchedulerWorkspace(): SchedulerWorkspace {
  return createTestSchedulerWorkspaceSession().workspace;
}
