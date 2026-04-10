# musinsa

[무신사(musinsa.com)](https://www.musinsa.com)를 대상으로 한 **Playwright** E2E 테스트 프로젝트입니다. Page Object 패턴과 로그인 셋업(`storageState`)으로 회귀·스모크 시나리오를 돌립니다.

## 요구 사항

- Node.js (LTS 권장)

- **브라우저**: **macOS 로컬**에서는 기본적으로 **설치된 Google Chrome**으로 실행합니다(번들 Chromium 없어도 `yarn test` 가능). 번들만 쓰려면 `yarn playwright install chromium` 후 `PW_USE_BUNDLED_CHROMIUM=1 yarn test`. Linux/Windows 로컬은 `yarn playwright install chromium` 또는 Chrome 사용 시 `PW_USE_SYSTEM_CHROME=1`. CI는 `postinstall`/워크플로에서 받은 Chromium을 사용합니다.

- `setup` 프로젝트가 먼저 실행되어 로그인 상태를 `tests/fixtures/storage/authed.json`에 저장하고, `chromium` 프로젝트가 이어서 실행됩니다.
- 리포트: `playwright-reports/` (HTML), 실패 시 `test-results/`에 스크린샷·트레이스 등

## 디렉터리 구조 (요약)

| 경로 | 설명 |
|------|------|
| `tests/e2e/` | 스펙 (`regression`, `smoke` 등) |
| `tests/pages/` | 페이지·컴포넌트 객체 (`@/pages/...`) |
| `tests/fixtures/` | 공통 픽스처, `auth.setup.ts`, `storage/` |
| `tests/data/` | 검색 키워드·테스트 계정 등 데이터 |
| `playwright.config.ts` | `baseURL`, 로케일·타임존·지역(서울), 프로젝트 정의 |

TypeScript 경로 별칭: `@/*` → `./tests/*` (`tsconfig.json`).

## CI

GitHub Actions(`.github/workflows/playwright.yml`)에서 `main` / `master`에 push·PR 시 테스트를 실행합니다. 러너는 **self-hosted**로 설정되어 있으므로, 다른 환경에서는 러너·비밀 정보를 맞춰야 합니다.

## 주의

- 로그인이 필요한 시나리오는 `tests/data/general.ts` 등에서 사용하는 **테스트 전용 계정**을 사용합니다. 실서비스 계정을 넣지 말고, 필요 시 환경 변수나 CI 시크릿으로 분리하는 것을 권장합니다.

