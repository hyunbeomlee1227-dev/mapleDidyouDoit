export type SchedulerWorkspaceState = Readonly<{
  screen: "welcome";
}>;

export interface SchedulerWorkspace {
  getState(): SchedulerWorkspaceState;
}

export interface NexonGateway {
  getAccountCharacters(apiKey: string): Promise<unknown>;
}

export interface WorkspaceStorage {
  load(): Promise<unknown | null>;
  save(value: unknown): Promise<void>;
  clear(): Promise<void>;
}

export type SchedulerWorkspaceDependencies = Readonly<{
  nexon: NexonGateway;
  storage: WorkspaceStorage;
}>;

export function createSchedulerWorkspace(
  dependencies: SchedulerWorkspaceDependencies,
): SchedulerWorkspace {
  void dependencies;

  return {
    getState: () => ({ screen: "welcome" }),
  };
}
