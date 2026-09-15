import type { ApiKeyStorage } from "../SchedulerWorkspace";

const API_KEY_STORAGE_KEY = "api-key";

export function createBrowserApiKeyStorage(): ApiKeyStorage {
  return {
    load: () => localStorage.getItem(API_KEY_STORAGE_KEY),
    save: (apiKey) => localStorage.setItem(API_KEY_STORAGE_KEY, apiKey),
    clear: () => localStorage.removeItem(API_KEY_STORAGE_KEY),
  };
}
