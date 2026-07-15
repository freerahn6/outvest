import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ⚠️ 배포 전 반드시 실제 도메인으로 바꾸세요 (SEO/sitemap의 기준 주소).
//   - 커스텀 도메인 있으면: 'https://내도메인.com'
//   - 없으면 임시로: 'https://stock-blog.pages.dev'
export default defineConfig({
  site: 'https://outvest.kr',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});
