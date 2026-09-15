import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";
import { createBrowserNexonGateway } from "./workspace/browser/createBrowserNexonGateway";
import { createBrowserWorkspaceStorage } from "./workspace/browser/createBrowserWorkspaceStorage";
import { createSchedulerWorkspace } from "./workspace/SchedulerWorkspace";

const workspace = createSchedulerWorkspace({
  nexon: createBrowserNexonGateway(),
  storage: createBrowserWorkspaceStorage(),
});

const root = document.getElementById("root");

if (!root) {
  throw new Error("앱을 표시할 영역을 찾을 수 없습니다.");
}

createRoot(root).render(
  <StrictMode>
    <App workspace={workspace} />
  </StrictMode>,
);
