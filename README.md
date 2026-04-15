# musinsa

## 프로젝트 소개

[무신사(musinsa.com)](https://www.musinsa.com)를 대상으로 한 **Playwright** **단위 테스트** 저장소입니다. <br><br>
Page Object 패턴으로 화면별 로케이터·액션을 분리하고, 로그인 셋업 프로젝트가 생성한 `storageState`(`authed.json`)로 인증이 필요한 시나리오를 반복 실행합니다. <br>
테스트 케이스는 스프레드시트의 시나리오 ID(예: `FEATURE_검색_0xx`)와 코드의 `test` 제목을 맞춰 두었습니다.

### 링크

| 구분 | URL |
|------|-----|
| **Local Test Report** | https://playwright-reports-eight.vercel.app/ |
| **Test Case Sheet** | https://docs.google.com/spreadsheets/d/1MV3zCdSLq4Eb7XZCN4ltTse4kCpJpTJE1423JpVSCIM/edit?gid=0#gid=0 |

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 런타임 | Node.js (LTS 권장) |
| 언어 | TypeScript |
| 단위 테스트 | [@playwright/test](https://playwright.dev/) `^1.57` (브라우저 자동화) |
| 패키지 매니저 | `yarn` (또는 `npm`) |
| 설정·비밀 | `dotenv` (`.env` 로드, `playwright.config.ts`에서 사용) |
| 리포트 배포 | Vercel CLI (`npx vercel`, `package.json`의 `deploy:report*` 스크립트) |

---

## 프로젝트 구조

### 루트

| 파일 | 역할 |
|------|------|
| `playwright.config.ts` | `baseURL`, 로케일·지역·타임존, `setup` / `chromium` 프로젝트, 리포터 |
| `tsconfig.json` | TypeScript 및 `@/*` 경로 |
| `package.json` | `test`, `test:chrome`, `postinstall`(Chromium 설치) 등 |
| `vercel.json` | 리포트 정적 배포 참고 |
| `.env` | (선택) `MUSINSA_TEST_USER` 등 — 저장소에 커밋하지 말 것 |

### `tests/` 트리

```
tests/
├── unit/
│   └── regression/
│       ├── auth/
│       │   └── login-flow.serial.spec.ts   # 로그인~로그아웃 시리얼
│       └── search/
│           ├── _helpers.ts
│           ├── header-search.spec.ts       # 헤더 검색 관련
│           ├── search-result.spec.ts       # 검색 결과 페이지
│           └── brand-filter-musinsa-standard.serial.spec.ts  # 브랜드 필터 체인(시리얼)
├── fixtures/
│   ├── index.ts
│   ├── auth.setup.ts                     # 로그인 후 authed.json 저장 (setup 프로젝트)
│   └── storage/
│       └── authed.json                   # setup 실행 시 갱신되는 storageState
├── pages/                                 # Page Object
│   ├── Base.page.ts
│   ├── Main.page.ts
│   ├── Login.page.ts
│   ├── Search.page.ts
│   ├── SearchResult.page.ts
│   ├── ProductList.page.ts
│   ├── ProductDetail.page.ts
│   ├── Like.page.ts
│   └── components/
│       ├── Header.comp.ts
│       └── AuthGate.comp.ts
├── data/
│   └── general.ts                         # 검색 키워드, 브랜드, USER_DATA
├── util/
└── reports/
    └── custom-reporter.ts
```

| 경로 | 설명 |
|------|------|
| `tests/unit/regression/` | 기능·회귀 단위 시나리오. 상태를 이어 쓰는 흐름은 `*.serial.spec.ts` + `test.describe.configure({ mode: "serial" })` |
| `tests/pages/` | 화면별 로케이터·액션, `components/`는 헤더 등 부분 UI |
| `tests/fixtures/` | 인증 setup, `storageState` |
| `test-results/` | (실행 시 생성, gitignore) 실패 시 스크린샷·트레이스 등 |
| `playwright-reports/` | (실행 시 생성, gitignore) HTML 리포트 |

---

## CI

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)에서 `main` / `master`에 대한 **push·pull request**마다 테스트를 실행합니다.


### Actions에서만 실패할 때 (지역·리다이렉트)

GitHub 호스티드 러너는 **해외 IP**에서 나가는 경우가 많아, 무신사가 **`global.musinsa.com`** 등으로 보내거나 국내와 다른 UI·로그인 흐름이 나올 수 있습니다. 로컬(한국)에서는 통과해도 CI만 깨질 수 있으니, ci를 성공시키고 싶다면 **한국 self-hosted** 대안을 검토하세요.

---

## 테스트 및 배포 명령어

로컬에서 테스트로 만든 **`playwright-reports/`** 를 Vercel에 정적 사이트로 올립니다(CI 성공 여부와 무관). `playwright-reports/index.html`이 없으면 스크립트가 실패합니다.

**배포**

```bash
yarn test                    # 먼저 리포트 생성
yarn deploy:report          # 프리뷰 URL
yarn deploy:report:prod     # 프로덕션(연결된 도메인, 예: 위 Local Test Report)
```

