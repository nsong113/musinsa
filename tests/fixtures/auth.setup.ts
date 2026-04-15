import { expect, test as setup } from "@playwright/test";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { BasePage } from "@/pages/Base.page";
import path from "path";
import { USER_DATA } from "../data/general";

// 이 파일은 테스트 실행 전에 한 번만 실행되어:
// 로그인을 수행
// 인증된 상태(쿠키, 세션 등)를 파일에 저장
// 이후 모든 테스트에서 이 저장된 상태를 재사용

const authStatePath = path.resolve(__dirname, "storage", "authed.json");

setup("authenticate", async ({ page }) => {
  const { USERNAME, PASSWORD } = USER_DATA;

  // 메인 페이지로 이동
  console.log("[AUTH SETUP] Step 0: Navigating to domain");
  const basePage = new BasePage(page);
  await page.goto("https://www.musinsa.com", { waitUntil: "domcontentloaded" });

  await page.context().addCookies([
    { name: "gcc", value: "KR", domain: ".musinsa.com", path: "/" },
    { name: "gcuc", value: "KRW", domain: ".musinsa.com", path: "/" },
    { name: "glc", value: "ko", domain: ".musinsa.com", path: "/" },
  ]);
  await page.reload({ waitUntil: "domcontentloaded" });

  const urlAfterStep0 = page.url();
  // console.log("[AUTH SETUP] URL after cookies/reload:", urlAfterStep0);
  if (urlAfterStep0.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ REDIRECTED TO GLOBAL SITE at Step 0!");
  }

  // 메인 페이지로 이동
  // console.log("[AUTH SETUP] Step 2: Navigating to main page");
  await basePage.goToMain();

  const initialUrl = page.url();
  // console.log("[AUTH SETUP] URL after Step 2 (goToMain):", initialUrl);

  // 로그인 버튼 클릭
  // console.log("[AUTH SETUP] Step 3: Clicking login button");
  const header = new HeaderComponent(page);

  const loginPage = await header.clickingLoginBtn();

  // 로그인 수행
  // console.log("[AUTH SETUP] Step 4: Performing login");
  await loginPage.login(USERNAME, PASSWORD);

  // 로그인 후 리다이렉트 대기
  // console.log("[AUTH SETUP] Step 5: Waiting for redirect");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForURL(/musinsa\.com/i, { timeout: 30000 }).catch(() => {});

  // 로그인 후 메인으로 복귀(헤더 영역 기준 검증을 위해)
  await basePage.goToMain();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  // 로그인 성공 확인 (로그아웃 버튼이 보이는지)
  // console.log("[AUTH SETUP] Step 6: Verifying logout button");
  // 팝업/딤이 헤더 클릭/표시를 가릴 수 있어 Escape로 한번 정리
  await page.keyboard.press("Escape").catch(() => {});
  await expect(header.logoutButton).toBeVisible({ timeout: 20000 });
  // console.log("[AUTH SETUP] Logout button is visible - login successful");

  // 인증 상태 저장
  // console.log("[AUTH SETUP] Step 7: Saving storage state");
  await page.context().storageState({ path: authStatePath });
  // console.log("[AUTH SETUP] Storage state saved to:", authStatePath);
});
