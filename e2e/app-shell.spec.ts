import { expect, test } from "@playwright/test";

test("잘못된 키를 안내하고 재접속에도 저장하지 않는다", async ({ page }) => {
  await page.route("https://open.api.nexon.com/maplestory/v1/character/list", route => route.fulfill({ status: 400, json: { error: { name: "OPENAPI00005", message: "secret-invalid-key" } } }));
  await page.goto("/");
  await page.getByLabel("사용자 API 키", { exact: true }).fill("secret-invalid-key");
  await page.getByRole("button", { name: "연결하기" }).click();
  await expect(page.getByRole("alert")).toContainText("KEY_INVALID");
  await expect(page.getByRole("alert")).not.toContainText("secret-invalid-key");
  await page.reload();
  await expect(page.getByRole("heading", { name: "내 계정 연결하기" })).toBeVisible();
});

test("키를 안전하게 입력하고 연결한 뒤 다시 열 수 있다", async ({ page }) => {
  await page.route("https://open.api.nexon.com/maplestory/v1/character/list", async (route) => {
    await route.fulfill({ json: { account_list: [] } });
  });
  await page.goto("/");
  await expect(page.getByText(/평문으로 저장/)).toBeVisible();
  const input = page.getByLabel("사용자 API 키", { exact: true });
  await expect(input).toHaveAttribute("type", "password");
  await input.fill("test-api-key");
  await page.getByRole("button", { name: "API 키 표시" }).click();
  await expect(input).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "연결하기" }).click();
  await expect(page.getByRole("heading", { name: "API 키 연결 완료" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("이 브라우저에 저장된 API 키가 연결되어 있습니다.")).toBeVisible();
});

test("사용자가 첫 화면에서 서비스 범위와 출처를 확인한다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "메했니?" })).toBeVisible();
  await expect(page.getByText("메이플 스케줄러 자동 체크")).toBeVisible();
  await expect(page.getByText("KMS 전용 서비스")).toBeVisible();
  await expect(page.getByText("Data based on NEXON Open API")).toBeVisible();
  await expect(page.getByText("넥슨의 공식 서비스가 아닙니다")).toBeVisible();
});
