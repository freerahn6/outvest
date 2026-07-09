# 종목노트 — 주식 정보 개인 블로그

국내 주식 종목 분석을 담는 개인 블로그입니다.
**Astro(정적 사이트) + GitHub + Cloudflare Pages** 로 100% 무료 운영하며,
**한국투자증권(KIS) 실시간 시세**를 종목별로 보여줍니다.

```
[GitHub] --push--> [Cloudflare Pages] (정적 블로그, SEO 최적화)
                          │  종목 시세 요청
                          ▼
                   [Cloudflare Worker] --앱키 은닉--> [KIS 실시간 시세 API]
```

---

## 1. 로컬에서 실행

```bash
npm install
npm run dev       # http://localhost:4321
```

- 시세 카드는 Worker 가 있어야 실제 값이 뜹니다(아래 4번). Worker 연결 전에는 "불러오지 못했습니다"로 표시됩니다.

## 2. 글 쓰는 법

`src/content/posts/` 에 마크다운 파일을 추가하면 됩니다. 상단 프론트매터 예시:

```markdown
---
title: "글 제목"
description: "검색결과·공유에 뜨는 한 줄 설명"
pubDate: 2026-07-09
tickers:
  - { code: "005930", name: "삼성전자" }   # 이 종목 시세 카드가 글에 자동으로 붙음
tags: ["반도체", "투자메모"]
---

본문을 마크다운으로 작성합니다.
```

- `tickers` 에 적은 종목은 글 상단에 **실시간 시세 카드**로 렌더링됩니다.
- 초안은 `draft: true` 를 넣으면 사이트에 노출되지 않습니다.

## 3. 배포 (GitHub → Cloudflare Pages)

1. 이 폴더를 GitHub 저장소에 push
2. Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Connect to Git**
3. 저장소 선택 후 빌드 설정:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. 배포되면 `프로젝트명.pages.dev` 주소가 생깁니다.
5. **중요**: `astro.config.mjs` 의 `site` 와 `src/config.ts` 의 `url`, `public/robots.txt`
   의 도메인을 실제 주소로 바꾼 뒤 다시 push 하세요. (SEO/sitemap 기준 주소)

> 커스텀 도메인(예: `.com`)을 붙이면 SEO·신뢰도에 유리합니다. Cloudflare Pages → Custom domains 에서 연결.

## 4. 실시간 시세 연결 (KIS + Worker)

### 4-1. KIS 앱키 발급 (무료)
1. 한국투자증권 계좌 개설 (비대면, 무료)
2. [KIS Developers](https://apiportal.koreainvestment.com) 가입 → **앱 등록** → `appkey` / `appsecret` 발급
3. 실시간 시세는 **실전투자** 앱키를 쓰세요. (모의투자로 테스트하려면 `worker/wrangler.toml` 의 `KIS_BASE` 를 모의 도메인으로)

### 4-2. Worker 배포
```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put KIS_APP_KEY       # 발급받은 appkey 입력
npx wrangler secret put KIS_APP_SECRET    # 발급받은 appsecret 입력
npm run deploy
```
배포되면 `kis-proxy.<계정>.workers.dev` 주소가 나옵니다.

### 4-3. 블로그와 연결
`src/config.ts` 의 `quoteApi` 를 Worker 주소로 바꿉니다:
```ts
quoteApi: 'https://kis-proxy.<계정>.workers.dev',
```
다시 push 하면 시세 카드가 실제 값으로 채워집니다.
보안을 위해 `worker/wrangler.toml` 의 `ALLOW_ORIGIN` 을 블로그 도메인으로 좁히는 걸 권장합니다.

## 5. 전 종목으로 확장

기본 번들에는 대표 40종목만 들어 있습니다. 코스피·코스닥 전 종목으로 늘리려면:
```bash
node scripts/fetch-krx.mjs   # src/data/krx.json 을 전 종목으로 갱신
npm run build
```

---

## SEO 체크리스트 (이미 적용됨)
- ✅ 정적 HTML 렌더링 (구글 크롤링 친화)
- ✅ 페이지별 `<title>` / `description` / canonical
- ✅ Open Graph · Twitter 카드 (공유 미리보기)
- ✅ JSON-LD 구조화 데이터 (BlogPosting / WebSite)
- ✅ `sitemap-index.xml` 자동 생성 + `robots.txt`
- ✅ RSS 피드 (`/rss.xml`)
- ✅ 종목마다 개별 URL(`/stock/코드`) → 검색 유입 창구

## 면책
본 블로그의 정보는 투자 참고용이며, 투자 판단과 그 결과의 책임은 투자자 본인에게 있습니다.
KIS API 이용은 한국투자증권의 이용약관 및 트래픽 정책을 따릅니다.
