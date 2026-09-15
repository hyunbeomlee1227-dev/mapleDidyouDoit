import {
  createSchedulerWorkspace,
  type NexonGateway,
  type SchedulerWorkspace,
  type WorkspaceStorage,
} from "../SchedulerWorkspace";

export function createTestSchedulerWorkspace(): SchedulerWorkspace {
  const nexon: NexonGateway = {
    getAccountCharacters: async () => ({
      ok: true,
      status: 200,
      body: { account_list: [] },
    }),
  };

  let storedValue: unknown | null = null;
  const storage: WorkspaceStorage = {
    load: async () => storedValue,
    save: async (value) => {
      storedValue = value;
    },
    clear: async () => {
      storedValue = null;
    },
  };

  return createSchedulerWorkspace({ nexon, storage });
}
