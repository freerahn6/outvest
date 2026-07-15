// 단일 flat 사이트맵 — /sitemap.xml 하나에 전체 URL을 직접 담는다.
// (@astrojs/sitemap 의 인덱스(sitemap-index.xml → sitemap-0.xml) 2단 구조를 대체)
// 글·종목이 늘면 빌드 때 자동 반영된다. 라우트 소스는 실제 페이지와 동일하게 맞춘다:
//   [...page].astro(pageSize 15) · [slug].astro · stock/[code].astro(krx.json)
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import krx from '../data/krx.json';
import type { APIContext } from 'astro';

const PAGE_SIZE = 15;

export async function GET(context: APIContext) {
  const base = (context.site?.href ?? SITE.url).replace(/\/$/, '');

  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );

  const urls: { loc: string; lastmod?: string }[] = [];

  // 정적 페이지
  urls.push({ loc: `${base}/` });
  urls.push({ loc: `${base}/about/` });

  // 전체글 목록 페이지네이션 (/posts/, /posts/2/, ...)
  const lastPage = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  for (let n = 1; n <= lastPage; n++) {
    urls.push({ loc: n === 1 ? `${base}/posts/` : `${base}/posts/${n}/` });
  }

  // 개별 글
  for (const p of posts) {
    urls.push({ loc: `${base}/posts/${p.id}/`, lastmod: p.data.pubDate.toISOString().slice(0, 10) });
  }

  // 종목 페이지 — 글이 실제로 다룬 종목만 색인(빈 종목 페이지는 noindex라 제외).
  const coveredCodes = new Set(posts.flatMap((p) => p.data.tickers.map((t) => t.code)));
  for (const s of krx) {
    if (coveredCodes.has(s.code)) urls.push({ loc: `${base}/stock/${s.code}/` });
  }

  // 태그(토픽) 허브 — 2편 이상 달린 태그만 색인(1편짜리는 thin-content 라 noindex → 제외).
  const tagCount = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  for (const [tag, n] of tagCount) {
    if (n >= 2) urls.push({ loc: `${base}/tag/${encodeURIComponent(tag)}/` });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
