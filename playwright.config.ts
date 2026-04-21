import { defineConfig, devices } from "@playwright/test";
import "tsconfig-paths/register";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env"), quiet: true });

const isCi = !!process.env.CI;
const forceBundled = process.env.PW_USE_BUNDLED_CHROMIUM === "1";
const forceSystemChrome =
  process.env.PW_USE_SYSTEM_CHROME === "1" ||
  process.env.USE_SYSTEM_CHROME === "1";


const useSystemChrome =
  forceSystemChrome ||
  (!isCi && !forceBundled && process.platform === "darwin");

const desktopChrome = useSystemChrome
  ? { ...devices["Desktop Chrome"], channel: "chrome" as const }
  : { ...devices["Desktop Chrome"] };

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  outputDir: "test-results/", // 스크린샷, 비디오, 트레이스 등 테스트 실행 결과물
  // reporter: "html",
  reporter: [
    ["html", { outputFolder: "playwright-reports" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: "https://www.musinsa.com",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    geolocation: { longitude: 126.978, latitude: 37.5665 }, // 서울 좌표
    extraHTTPHeaders: {
      //헤더 조작 강화
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
   
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video:
      process.env.PLAYWRIGHT_RECORD_VIDEO === "1"
        ? "retain-on-failure"
        : "off",
    headless: !!process.env.CI,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: {
        ...desktopChrome,
        // 로컬에서 로그인 플로우가 간헐적으로 차단/변경되는 경우에도,
        // 기존 storageState로 setup이 통과하도록 기본 주입(필요 시 setup에서 재로그인 후 갱신 가능)
        storageState: "tests/fixtures/storage/authed.json",
        // 로컬에서는 chromium 스펙과 동일하게 헤디드로 맞춤(무신사 로그인·헤더 검증이 헤드리스에서만 실패하는 경우 완화)
        headless: !!process.env.CI,
        locale: "ko-KR",
        timezoneId: "Asia/Seoul",
        geolocation: { longitude: 126.978, latitude: 37.5665 }, // 서울 좌표
        extraHTTPHeaders: {
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      },
    },
    {
      name: "chromium",
      testDir: "./tests",
      testMatch: /.*\.spec\.ts/,
      testIgnore: [/.*\.setup\.ts/, /.*node_modules.*/],
      use: {
        ...desktopChrome,
        storageState: "tests/fixtures/storage/authed.json",
      },
      dependencies: ["setup"], // "setup" 프로젝트가 성공해야 실행됨, 의존성 추가
    },
  ],

});
