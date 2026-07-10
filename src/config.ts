// ────────────────────────────────────────────────────────────────
//  블로그 기본 설정 — 여기만 바꾸면 사이트 전체에 반영됩니다.
// ────────────────────────────────────────────────────────────────
export const SITE = {
  title: '아웃베스트의 투자로그',          // 블로그 이름
  description: '국내 주식 20년차, 아직도 주식은 어렵습니다.',
  author: '아웃베스트',                   // 작성자 이름
  // astro.config.mjs 의 site 와 동일하게 맞추세요 (배포 도메인).
  url: 'https://outvest.pages.dev',
  lang: 'ko',
  locale: 'ko_KR',
  // 종목 시세 카드가 호출할 Cloudflare Worker 주소.
  // Worker 배포 후 실제 주소로 교체하세요. (예: https://kis-proxy.내계정.workers.dev)
  quoteApi: '/api/quote', // 로컬 개발 시 프록시. 배포 시 Worker URL 로 교체.
};

export const NAV = [
  { label: '홈', href: '/' },
  { label: '소개', href: '/about' },
];
