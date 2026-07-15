import { defineConfig } from 'astro/config';

// ⚠️ 배포 전 반드시 실제 도메인으로 바꾸세요 (SEO/sitemap의 기준 주소).
//   - 커스텀 도메인 있으면: 'https://내도메인.com'
//   - 없으면 임시로: 'https://stock-blog.pages.dev'
// 사이트맵은 단일 flat 파일을 src/pages/sitemap.xml.ts 가 직접 생성한다
// (@astrojs/sitemap 의 인덱스 2단 구조 대신).
export default defineConfig({
  site: 'https://outvest.kr',
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});
