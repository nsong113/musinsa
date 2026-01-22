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
  await page.goto("https://www.musinsa.com");
  
  const urlAfterStep0 = page.url();
  console.log("[AUTH SETUP] URL after Step 0:", urlAfterStep0);
  if (urlAfterStep0.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ REDIRECTED TO GLOBAL SITE at Step 0!");
  } else {
    console.log("[AUTH SETUP] ✓ Still on Korean site (www.musinsa.com)");
  }

  console.log("[AUTH SETUP] Step 1: Setting up cookies for Korean site");

  // 쿠키 설정 (한국 사이트로 강제)
  await page.context().addCookies([
    {
      name: "gcc",
      value: "KR",
      domain: ".musinsa.com",
      path: "/",
    },
    {
      name: "gcuc",
      value: "KRW",
      domain: ".musinsa.com",
      path: "/",
    },
    {
      name: "glc",
      value: "ko",
      domain: ".musinsa.com",
      path: "/",
    },
  ]);
  console.log("[AUTH SETUP] Cookies set (gcc=KR, gcuc=KRW, glc=ko)");

  // 메인 페이지로 이동
  console.log("[AUTH SETUP] Step 2: Navigating to main page");
  await basePage.goToMain();

  const initialUrl = page.url();
  console.log("[AUTH SETUP] URL after Step 2 (goToMain):", initialUrl);
  
  // global로 리다이렉트되어도 계속 진행
  if (initialUrl.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ REDIRECTED TO GLOBAL SITE at Step 2!");
    console.warn("[AUTH SETUP] Global URL:", initialUrl);
    console.warn("[AUTH SETUP] Proceeding with test despite redirect...");
  } else {
    console.log("[AUTH SETUP] ✓ Still on Korean site after goToMain");
  }

  // 로그인 버튼 클릭
  console.log("[AUTH SETUP] Step 3: Clicking login button");
  const header = new HeaderComponent(page);
  
  const urlBeforeLoginClick = page.url();
  console.log("[AUTH SETUP] URL before login click:", urlBeforeLoginClick);
  if (urlBeforeLoginClick.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ REDIRECTED TO GLOBAL SITE before login click!");
  }
  
  const loginPage = await header.clickingLoginBtn();
  const urlAfterLoginClick = page.url();
  console.log("[AUTH SETUP] URL after login click:", urlAfterLoginClick);
  if (urlAfterLoginClick.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ REDIRECTED TO GLOBAL SITE after login click!");
  }

  // 로그인 수행
  console.log("[AUTH SETUP] Step 4: Performing login");
  await loginPage.login(USERNAME, PASSWORD);
  const urlAfterLogin = page.url();
  console.log("[AUTH SETUP] URL after login:", urlAfterLogin);
  if (urlAfterLogin.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ REDIRECTED TO GLOBAL SITE after login!");
  }

  // 로그인 후 리다이렉트 대기
  console.log("[AUTH SETUP] Step 5: Waiting for redirect");
  // await page.waitForLoadState("networkidle", { timeout: 15000 });
  await page.waitForURL(/.*musinsa.*/, { timeout: 15000 });
  const finalUrl = page.url();
  console.log("[AUTH SETUP] Final URL:", finalUrl);
  if (finalUrl.includes("global.musinsa.com")) {
    console.warn("[AUTH SETUP] ⚠️ FINAL URL IS GLOBAL SITE!");
  } else {
    console.log("[AUTH SETUP] ✓ Final URL is Korean site");
  }

  // 로그인 성공 확인 (로그아웃 버튼이 보이는지)
  console.log("[AUTH SETUP] Step 6: Verifying logout button");
  await expect(header.logoutButton).toBeVisible({ timeout: 10000 });
  console.log("[AUTH SETUP] Logout button is visible - login successful");

  // 인증 상태 저장
  console.log("[AUTH SETUP] Step 7: Saving storage state");
  await page.context().storageState({ path: authStatePath });
  console.log("[AUTH SETUP] Storage state saved to:", authStatePath);
});
