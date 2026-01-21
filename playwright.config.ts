import { defineConfig, devices } from "@playwright/test";
import "tsconfig-paths/register";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
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
  reporter: [["html", { outputFolder: "playwright-reports" }]],

  use: {
    baseURL: "https://www.musinsa.com/main/musinsa",

    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: !!process.env.CI,
  },
  globalTeardown: "./tests/fixtures/global-teardown.ts",
  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"], headless: true },
    },
    {
      name: "chromium",
      testMatch: /e2e\/.*\.spec\.ts/,
      testIgnore: [/.*\.setup\.ts/, /.*node_modules.*/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/fixtures/storage/authed.json",
      },
      dependencies: ["setup"], // "setup" 프로젝트가 성공해야 실행됨, 의존성 추가
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
