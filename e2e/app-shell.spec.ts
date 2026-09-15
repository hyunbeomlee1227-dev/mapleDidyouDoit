import { expect, test } from "@playwright/test";

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
