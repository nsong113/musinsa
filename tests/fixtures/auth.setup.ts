import { expect, test as setup } from "@playwright/test";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { BasePage } from "@/pages/Base.page";

import path from "path";
import { USER_DATA } from "../data/general";

// 이 파일은 테스트 실행 전에 한 번만 실행되어:
// 로그인을 수행
// 인증된 상태(쿠키, 세션 등)를 파일에 저장
// 이후 모든 테스트에서 이 저장된 상태를 재사용

// 최소한의 검증

const authStatePath = path.resolve(__dirname, "storage", "authed.json");

setup("authenticate", async ({ page }) => {
  const { USERNAME, PASSWORD } = USER_DATA;

  const header = new HeaderComponent(page);
  const basePage = new BasePage(page);

  await basePage.goToMain();
  const loginPage = await header.clickingLoginBtn();

  await loginPage.login(USERNAME, PASSWORD);

  await page.waitForURL(/.*musinsa.*/); //로그인 후 리다이렉트 대기

  expect(header.logoutButton).toBeVisible();

  await page.context().storageState({ path: authStatePath });
});
