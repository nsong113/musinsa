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
  timeout: 60_000,
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
  globalTeardown: "./tests/fixtures/global-teardown.ts",
  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: {
        ...desktopChrome,
        headless: true,
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
