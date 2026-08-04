// GET /api/admin/posts → 전체 글 목록 (draft·예약 포함)
import { listPostFiles, clientError } from '../../../src/server/github';
import { parsePost, statusOf } from '../../../src/server/frontmatter';
import { json, fail, type Ctx } from '../../../src/server/http';

export const onRequestGet = async ({ env }: Ctx): Promise<Response> => {
  try {
    const files = await listPostFiles(env);

    const posts = files.map(({ file, sha, raw }) => {
      try {
        const { meta } = parsePost(raw);
        return {
          file,
          slug: file.replace(/\.md$/, ''),
          sha,
          title: meta.title,
          description: meta.description,
          pubDate: meta.pubDate,
          updatedDate: meta.updatedDate ?? null,
          category: meta.category ?? null,
          tags: meta.tags,
          cover: meta.cover ?? null,
          tickers: meta.tickers,
          draft: meta.draft,
          status: statusOf(meta),
          broken: false as const,
        };
      } catch (e: any) {
        // frontmatter 가 깨진 파일도 목록에는 보여준다(고칠 수 있게).
        return {
          file,
          slug: file.replace(/\.md$/, ''),
          sha,
          title: file,
          description: e?.message ?? '읽을 수 없는 글',
          pubDate: '',
          updatedDate: null,
          category: null,
          tags: [] as string[],
          cover: null,
          tickers: [] as { code: string; name: string }[],
          draft: true,
          status: 'draft' as const,
          broken: true as const,
        };
      }
    });

    posts.sort((a, b) => (a.pubDate < b.pubDate ? 1 : a.pubDate > b.pubDate ? -1 : 0));
    return json({ posts, now: new Date().toISOString() });
  } catch (e) {
    const { status, message } = clientError(e);
    return fail(status, message);
  }
};
