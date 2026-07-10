import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 글은 src/content/posts/*.md 에 마크다운으로 작성합니다.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // 이 글에서 다루는 종목들. code 는 6자리 종목코드(예: 삼성전자 005930).
    // 시세 카드와 종목별 페이지가 이 값으로 연결됩니다.
    tickers: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
        })
      )
      .default([]),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // 카드 썸네일(커버) 이미지 경로. 없으면 기본 커버 사용.
    cover: z.string().optional(),
  }),
});

export const collections = { posts };
