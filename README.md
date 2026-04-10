# musinsa

[무신사(musinsa.com)](https://www.musinsa.com)를 대상으로 한 **Playwright** E2E 테스트 프로젝트입니다. Page Object 패턴과 로그인 셋업(`storageState`)으로 회귀·스모크 시나리오를 실행합니다.

## 요구 사항

- Node.js (LTS 권장)
- `yarn` (또는 `npm`)

## 로컬에서 실행

```bash
yarn
yarn test
# 설치된 Chrome으로 강제 (PW_USE_SYSTEM_CHROME=1). 윈/리눅스·CI에서 기본이 Chromium일 때 쓰기 쉽게 해 둔 스크립트
yarn test:chrome
```

- `setup` 프로젝트가 먼저 돌아 로그인 뒤 `tests/fixtures/storage/authed.json`에 상태를 저장하고, 이어서 `chromium` 프로젝트가 같은 저장 상태로 테스트합니다.

**브라우저는 `playwright.config.ts`에서 이렇게 갈립니다.**

| 실행 환경 | 기본으로 쓰는 것 |
|-----------|------------------|
| **macOS + 로컬** (`CI` 아님) | PC에 설치된 **Google Chrome** |
| **Windows / Linux 로컬**, 또는 **GitHub Actions 등 CI** | Playwright가 받아 두는 **Chromium**(번들). `yarn` 할 때 `postinstall`로 같이 설치됨 |

**기본값을 바꾸고 싶을 때만:**

- 맥 로컬인데 **번들 Chromium**으로 돌리기 → `PW_USE_BUNDLED_CHROMIUM=1 yarn test`
- 윈도우/리눅스나 CI에서 **설치된 Chrome**으로 돌리기 → `PW_USE_SYSTEM_CHROME=1 yarn test` (또는 `yarn test:chrome`)

Chromium만 따로 다시 깔고 싶으면 `yarn playwright install chromium`입니다.

## 리포트

- HTML 리포트: `playwright-reports/` (실행 후 생성)
- 실패 시 스크린샷·트레이스 등: `test-results/`
- 보기: `yarn playwright show-report playwright-reports` (포트 충돌 시 `-- --port 9324` 등)

### 로컬 리포트만 Vercel에 배포 (CI와 무관)

GitHub Actions 성공·실패와 상관없이, **맥/로컬에서 `yarn test` 등으로 만든 `playwright-reports/`** 를 그대로 정적 사이트로 올리는 방식입니다.

1. Vercel CLI는 전역 설치 없이 `npx`로 씁니다(`deploy:report`와 동일).
2. 최초 한 번 로그인: `yarn vercel:login` (또는 `npx vercel@latest login`). `vercel`만 치면 `command not found`일 수 있음.
3. 테스트 실행 후 리포트 생성 확인:
   ```bash
   yarn test
   ```
4. 배포:
   ```bash
   yarn deploy:report        # 미리보기(프리뷰) URL
   yarn deploy:report:prod   # 프로덕션(연결된 도메인)
   ```
   처음에는 프로젝트 이름·팀을 물어보며, 이후 같은 디렉터리에 `.vercel`이 생깁니다.

`deploy:report`는 `playwright-reports/index.html`이 없으면 바로 실패합니다(테스트를 먼저 돌렸는지 확인).

CI용 시크릿(`VERCEL_TOKEN`)으로 자동 배포하고 싶다면 별도 워크플로에서 `vercel deploy playwright-reports --token=...`를 쓰면 됩니다. 위 스크립트는 **로컬에서 수동으로 올릴 때**를 기준으로 합니다.

## 프로젝트 구조

### 루트

| 파일 | 역할 |
|------|------|
| `playwright.config.ts` | `baseURL`, 로케일·지역·타임존, `setup` / `chromium` 프로젝트, 리포터 |
| `tsconfig.json` | TypeScript·경로 별칭 `@/*` → `./tests/*` |
| `package.json` | 스크립트(`test`, `test:chrome`), `postinstall`로 Chromium 설치 |
| `vercel.json` | Vercel 스키마 참고용(리포트는 `yarn deploy:report`로 `playwright-reports/`만 배포) |
| `.env` | (선택) `MUSINSA_TEST_USER` 등 — `dotenv`로 로드(`playwright.config`에서 로드) |

### `tests/` 트리

```
tests/
├── e2e/
│   └── regression/
│       └── search/
│           └── search.spec.ts      # 검색·브랜드 필터 등 시나리오
├── fixtures/
│   ├── index.ts                    # 스펙용 `test` / `expect` re-export·확장 진입점
│   ├── auth.setup.ts               # 로그인 후 storageState 저장 (setup 프로젝트)
│   └── storage/
│       └── authed.json             # 생성물: 로그인 쿠키·세션 (setup 실행 후 갱신)
├── pages/
│   ├── Base.page.ts
│   ├── Main.page.ts
│   ├── Login.page.ts
│   ├── Search.page.ts
│   ├── SearchResult.page.ts        # 검색 결과·필터·상품 목록 등
│   ├── ProductList.page.ts
│   ├── ProductDetail.page.ts
│   ├── Like.page.ts
│   └── components/
│       ├── Header.comp.ts          # 헤더 검색·로그인/로그아웃
│       └── AuthGate.comp.ts
├── data/
│   └── general.ts                  # 검색 키워드, 브랜드명, `USER_DATA`(env·기본값)
├── util/
│   ├── env.ts
│   ├── assertions.ts
│   └── testData.ts
└── reports/
    └── custom-reporter.ts
```

### 디렉터리 역할

| 경로 | 설명 |
|------|------|
| `tests/e2e/` | Playwright 스펙. `regression/`·`smoke/` 등 시나리오 단위로 확장 |
| `tests/pages/` | Page Object: 화면별 로케터·액션. `components/`는 헤더 등 부분 UI |
| `tests/fixtures/` | 인증 `setup`, 저장된 `storageState`, 픽스처 래퍼 |
| `tests/data/` | 키워드·계정 등 테스트 데이터(비밀은 env·시크릿 권장) |
| `tests/util/` | 공통 헬퍼 |
| `tests/reports/` | 커스텀 리포터 |
| `test-results/` | (실행 시 생성, gitignore) 실패 스크린샷·트레이스 등 |
| `playwright-reports/` | (실행 시 생성, gitignore) HTML 리포트 |

**경로 별칭:** `@/*` → `./tests/*` (`tsconfig.json`). 예: `@/pages/components/Header.comp`.

## CI

[GitHub Actions](.github/workflows/playwright.yml)에서 `main` / `master`에 대한 push·PR마다 **`ubuntu-latest`**(GitHub 호스티드 러너)에서 테스트를 실행합니다. 의존성 설치 후 `playwright install --with-deps`로 브라우저를 받고, 종료 시 `playwright-reports/`를 아티팩트로 올립니다.

로그인이 필요한 경우 CI에서는 **`MUSINSA_TEST_USER`**, **`MUSINSA_TEST_PASSWORD`** 등을 리포지토리 시크릿(또는 환경 변수)으로 넣는 것을 권장합니다. 기본값에 의존하지 마세요.

### GitHub Actions에서 실패가 나는 흔한 이유 (지역·리다이렉트)

GitHub 호스티드 러너는 **미국 등 해외 IP**에서 나가는 경우가 많습니다. 무신사는 접속 지역에 따라 **`global.musinsa.com`(글로벌 무신사)** 등으로 리다이렉트하거나, 국내 도메인과 다른 화면·로그인 흐름이 나올 수 있습니다. 그 결과 로그인·메인 진입·셀렉터가 기대와 달라 **CI만 실패**하는 현상이 납니다. `auth.setup.ts`에서도 `global.musinsa.com`으로 튕기면 경고를 남기도록 되어 있습니다.

**대안(택·조직 정책에 맞게):**

- **한국에서 egress가 나오는 러너**에서 실행 (예: 사내/self-hosted runner를 한국 리전 또는 한국망에 두고 `runs-on` 지정)
- PR에서는 E2E를 생략하고 `workflow_dispatch`로만 돌리기, 또는 별도 워크플로로 분리
- 무신사 측에서 허용하는 범위라면 **고정 출구 IP·프록시** 등을 쓰는 전용 실행 환경 구성

로컬(한국 네트워크)에서는 통과해도 **같은 워크플로가 Actions에서만 깨지는 경우** 위 원인을 먼저 의심하면 됩니다.

## 주의

- 테스트 전용 계정만 사용하고, 실서비스 비밀번호를 저장소에 넣지 마세요. 로컬은 `.env`(`dotenv`)로 덮어쓸 수 있습니다(`tests/data/general.ts` 참고).
