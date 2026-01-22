import { expect, test as setup } from "@playwright/test";

import path from "path";
import { USER_DATA } from "../data/general";

// 이 파일은 테스트 실행 전에 한 번만 실행되어:
// 로그인을 수행
// 인증된 상태(쿠키, 세션 등)를 파일에 저장
// 이후 모든 테스트에서 이 저장된 상태를 재사용

const authStatePath = path.resolve(
  __dirname,
  "storage",
  "./storage/authed.json"
);

setup("authenticate", async ({ page }) => {
  const { USERNAME, PASSWORD } = USER_DATA;

  // 1. 로그인 페이지로 이동
  // 2. 사용자 이름과 비밀번호 입력
  // 3. 로그인 버튼 클릭
  // 4. 로그인 성공 후 인증 상태 저장
});
