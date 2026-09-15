import type {
  NexonGateway,
  NexonGatewayResponse,
} from "../SchedulerWorkspace";

const CHARACTER_LIST_URL =
  "https://open.api.nexon.com/maplestory/v1/character/list";

export function createBrowserNexonGateway(): NexonGateway {
  return {
    async getAccountCharacters(apiKey): Promise<NexonGatewayResponse> {
      const response = await fetch(CHARACTER_LIST_URL, {
        headers: { "x-nxopen-api-key": apiKey },
      });

      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        // The workspace will classify an empty or malformed response.
      }

      return {
        ok: response.ok,
        status: response.status,
        body,
      };
    },
  };
}
