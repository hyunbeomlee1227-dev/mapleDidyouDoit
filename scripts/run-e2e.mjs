import { spawn } from "node:child_process";

const node = process.execPath;

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(node, args, { stdio: "inherit" });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${args[0]} 명령이 종료 코드 ${code}로 실패했습니다.`));
    });
  });
}

async function waitForPreview(url) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview server has not started listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("미리보기 서버가 제한 시간 안에 시작되지 않았습니다.");
}

await run(["./node_modules/typescript/bin/tsc", "-b"]);
await run(["./node_modules/vite/bin/vite.js", "build"]);

const preview = spawn(
  node,
  [
    "./node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ],
  { stdio: "inherit" },
);

try {
  await waitForPreview("http://127.0.0.1:4173");
  await run(["./node_modules/@playwright/test/cli.js", "test"]);
} finally {
  preview.kill();
}
