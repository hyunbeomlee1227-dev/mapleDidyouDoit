import { openDB, type DBSchema } from "idb";

import type { WorkspaceStorage } from "../SchedulerWorkspace";

interface WorkspaceDatabase extends DBSchema {
  workspace: {
    key: string;
    value: unknown;
  };
}

export function createBrowserWorkspaceStorage(): WorkspaceStorage {
  let database: ReturnType<typeof openDB<WorkspaceDatabase>> | undefined;
  const getDatabase = () => {
    database ??= openDB<WorkspaceDatabase>("maple-did-you-do-it", 1, {
      upgrade(db) {
        db.createObjectStore("workspace");
      },
    });

    return database;
  };

  return {
    async load() {
      return (await getDatabase()).get("workspace", "state");
    },
    async save(value) {
      await (await getDatabase()).put("workspace", value, "state");
    },
    async clear() {
      await (await getDatabase()).delete("workspace", "state");
    },
  };
}
