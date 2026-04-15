import type { Page } from "@playwright/test";
import { test, expect } from "@/fixtures/index";
import { MainPage } from "@/pages/Main.page";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { LoginPage } from "@/pages/Login.page";
import { USER_DATA } from "@/data/general";

test.describe("Auth · 로그인 플로우", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  let sharedPage: Page;
  let mainPage: MainPage;
  let header: HeaderComponent;

  async function goToMainForAuth(): Promise<void> {
    // 국가/언어 쿠키 세팅을 먼저 해서 global 리다이렉트·헤더 변형을 줄임
    await sharedPage.goto("https://www.musinsa.com", {
      waitUntil: "domcontentloaded",
    });
    await sharedPage.context().addCookies([
      { name: "gcc", value: "KR", domain: ".musinsa.com", path: "/" },
      { name: "gcuc", value: "KRW", domain: ".musinsa.com", path: "/" },
      { name: "glc", value: "ko", domain: ".musinsa.com", path: "/" },
    ]);
    await sharedPage.goto("https://www.musinsa.com/main/musinsa/recommend?gf=A", {
      waitUntil: "domcontentloaded",
    });
    await sharedPage.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  }

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "https://www.musinsa.com",
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      geolocation: { longitude: 126.978, latitude: 37.5665 },
      extraHTTPHeaders: {
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      // 프로젝트 기본 use.storageState(authed.json)가 newContext에 합쳐질 수 있어 강제로 로그아웃 상태에서 시작
      storageState: { cookies: [], origins: [] },
    });
    sharedPage = await context.newPage();
    mainPage = new MainPage(sharedPage);
    header = new HeaderComponent(sharedPage);
    await goToMainForAuth();
  });

  test.afterAll(async () => {
    await sharedPage?.context().close();
  });

  test("FEATURE_로그인_001: 메인 헤더에 로그인 버튼이 존재한다", async () => {
    await goToMainForAuth();
    await expect(header.loginButton).toBeVisible({ timeout: 15000 });
  });

  test("FEATURE_로그인_002: 로그인 버튼 클릭 시 로그인 페이지로 이동한다", async () => {
    await goToMainForAuth();
    await header.clickingLoginBtn();
    await expect(sharedPage).toHaveURL(/\/login/i);
  });

  test("FEATURE_로그인_003~005: 아이디/비밀번호 입력 영역이 존재한다", async () => {
    // `clickingLoginBtn`가 LoginPage를 리턴하지만, 직전 테스트에서 이동한 상태를 그대로 사용
    const id = sharedPage.getByRole("textbox", { name: "통합계정 또는 이메일" });
    const pw = sharedPage.getByRole("textbox", { name: "비밀번호 입력" });
    await expect(id).toBeVisible({ timeout: 15000 });
    await expect(pw).toBeVisible({ timeout: 15000 });
  });

  test("FEATURE_로그인_006~008: 계정 입력 후 로그인한다", async () => {
    // 직전 테스트에서 로그인 페이지 진입 상태를 유지한다
    const loginPage = new LoginPage(sharedPage);
    await loginPage.login(USER_DATA.USERNAME, USER_DATA.PASSWORD);

    // 로그인 성공: 헤더에 로그아웃 링크가 노출
    await expect(header.logoutButton).toBeVisible({ timeout: 20000 });
  });

  test("FEATURE_로그인_009~012: 로그아웃하면 로그인 버튼이 다시 노출된다", async () => {
    await header.clickingLogoutBtn();
    await expect(header.loginButton).toBeVisible({ timeout: 15000 });
  });
});

