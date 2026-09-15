import { expect, test } from "@playwright/test";

test("캐릭터를 선택하고 순서를 검토·확정한 뒤 복원한다", async ({ page }) => {
  await page.route("https://open.api.nexon.com/maplestory/v1/character/list", route => route.fulfill({ json: { account_list: [{ account_id: "account", character_list: ["단풍용사", "초록마법사", "주황버섯"].map((name, index) => ({ ocid: `character-${index}`, character_name: name, world_name: "스카니아", character_class: "히어로", character_level: 280 })) }] } }));
  await page.goto("/");
  await page.getByLabel("사용자 API 키", { exact: true }).fill("test-api-key");
  await page.getByRole("button", { name: "연결하기" }).click();
  await page.getByRole("checkbox", { name: "단풍용사 활성 추적" }).check();
  await page.getByRole("checkbox", { name: "초록마법사 활성 추적" }).check();
  await page.getByRole("button", { name: "초록마법사 위로" }).click();
  await expect(page.getByTestId("selected-characters").getByRole("listitem").first()).toContainText("초록마법사");
  const ordered = page.getByTestId("selected-characters").getByRole("listitem");
  await ordered.filter({ hasText: "단풍용사" }).dragTo(ordered.filter({ hasText: "초록마법사" }));
  await expect(ordered.first()).toContainText("단풍용사");
  await page.getByRole("button", { name: "초록마법사 위로" }).focus();
  await page.keyboard.press("Enter");
  await expect(ordered.first()).toContainText("초록마법사");
  await expect(page.getByText("주황버섯").locator("..")).toContainText("비활성 · 스케줄러 조회 제외");
  await page.getByRole("button", { name: "선택 결과 검토" }).click();
  await expect(page.getByRole("heading", { name: "선택 결과 검토" })).toBeVisible();
  await page.getByRole("button", { name: "이 선택으로 확정" }).click();
  await expect(page.getByRole("status").filter({ hasText: "활성 추적 선택을 확정했습니다" })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("selected-characters").getByRole("listitem").first()).toContainText("초록마법사");
  await expect(page.getByRole("checkbox", { name: "주황버섯 활성 추적" })).not.toBeChecked();
});
