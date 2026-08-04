// 글 단건: 조회(GET) · 저장(PUT) · 삭제(DELETE)
//   GET    /api/admin/post?file=slug.md
//   PUT    /api/admin/post   { file|null, sha|null, slug, meta, body }
//   DELETE /api/admin/post   { file, sha }
import { getFile, putFile, deleteFile, POSTS_DIR, GhError, clientError } from '../../../src/server/github';
import {
  parsePost,
  serializePost,
  statusOf,
  isValidSlug,
  type PostMeta,
} from '../../../src/server/frontmatter';
import { json, fail, type Ctx } from '../../../src/server/http';

const pathOf = (file: string) => `${POSTS_DIR}/${file}`;

/** 오늘 날짜(한국 시간) YYYY-MM-DD */
function todayKST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export const onRequestGet = async ({ request, env }: Ctx): Promise<Response> => {
  const file = new URL(request.url).searchParams.get('file') ?? '';
  if (!file.endsWith('.md')) return fail(400, '파일명이 올바르지 않습니다');

  try {
    const { sha, text } = await getFile(env, pathOf(file));
    const { meta, body } = parsePost(text);
    return json({ file, slug: file.replace(/\.md$/, ''), sha, meta, body, status: statusOf(meta) });
  } catch (e) {
    const { status, message } = clientError(e);
    return fail(status, message);
  }
};

export const onRequestPut = async ({ request, env }: Ctx): Promise<Response> => {
  let req: any;
  try {
    req = await request.json();
  } catch {
    return fail(400, '요청 형식이 올바르지 않습니다');
  }

  const slug = String(req?.slug ?? '').trim();
  const body = String(req?.body ?? '');
  const m = req?.meta ?? {};
  const originalFile: string | null = req?.file ? String(req.file) : null;
  const originalSha: string | null = req?.sha ? String(req.sha) : null;

  // ── 검증 ──────────────────────────────────────────────
  const errs: string[] = [];
  if (!isValidSlug(slug)) errs.push('주소(슬러그)는 영소문자·숫자·하이픈만 쓸 수 있습니다');
  if (!String(m.title ?? '').trim()) errs.push('제목을 입력하세요');
  if (!String(m.description ?? '').trim()) errs.push('요약(description)을 입력하세요');
  if (!String(m.pubDate ?? '').trim() || Number.isNaN(new Date(m.pubDate).getTime())) {
    errs.push('발행일시가 올바르지 않습니다');
  }
  if (!body.trim()) errs.push('본문이 비어 있습니다');
  if (errs.length) return json({ error: errs[0], fields: errs }, 422);

  const newFile = `${slug}.md`;
  const renamed = !!originalFile && originalFile !== newFile;

  try {
    // 수정이면 원본을 다시 읽어 '우리가 모르는 필드'를 확실히 보존한다.
    let extra: Record<string, unknown> = {};
    if (originalFile) {
      const orig = await getFile(env, pathOf(originalFile));
      extra = parsePost(orig.text).meta.extra;
    }

    const meta: PostMeta = {
      title: String(m.title).trim(),
      description: String(m.description).trim(),
      pubDate: String(m.pubDate).trim(),
      updatedDate: m.updatedDate ? String(m.updatedDate) : undefined,
      tags: Array.isArray(m.tags) ? m.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
      category: m.category ? String(m.category) : undefined,
      cover: m.cover ? String(m.cover) : undefined,
      tickers: Array.isArray(m.tickers)
        ? m.tickers
            .filter((t: any) => t?.code)
            .map((t: any) => ({ code: String(t.code), name: String(t.name ?? '') }))
        : [],
      draft: m.draft === true,
      extra,
    };

    // 이미 한 번 게시된 글을 고치면 수정일을 남긴다(예약·비공개 글은 남기지 않는다).
    if (originalFile && statusOf(meta) === 'published') meta.updatedDate = todayKST();

    const text = serializePost(meta, body);
    const status = statusOf(meta);

    // 신규 또는 주소 변경이면 대상 파일이 비어 있어야 한다.
    if (!originalFile || renamed) {
      let taken = true;
      try {
        await getFile(env, pathOf(newFile));
      } catch (e: any) {
        if (e instanceof GhError && e.status === 404) taken = false;
        else throw e;
      }
      if (taken) return fail(409, `이미 "${slug}" 주소를 쓰는 글이 있습니다`);
    }

    const label = { published: '글 발행', scheduled: '예약 등록', draft: '비공개 저장' }[status];
    const put = await putFile(
      env,
      pathOf(newFile),
      text,
      renamed || !originalFile ? null : originalSha,
      `${label}: ${meta.title}`
    );

    // 주소를 바꿨으면 옛 파일을 지운다(커밋 2개 → 빌드 2회).
    if (renamed && originalFile && originalSha) {
      await deleteFile(env, pathOf(originalFile), originalSha, `주소 변경: ${originalFile} → ${newFile}`);
    }

    return json({ ok: true, file: newFile, slug, sha: put.sha, status, renamed });
  } catch (e) {
    const { status, message } = clientError(e);
    return fail(status, message);
  }
};

export const onRequestDelete = async ({ request, env }: Ctx): Promise<Response> => {
  let req: any;
  try {
    req = await request.json();
  } catch {
    return fail(400, '요청 형식이 올바르지 않습니다');
  }
  const file = String(req?.file ?? '');
  const sha = String(req?.sha ?? '');
  if (!file.endsWith('.md') || !sha) return fail(400, '삭제 대상이 올바르지 않습니다');

  try {
    await deleteFile(env, pathOf(file), sha, `글 삭제: ${file}`);
    // git 이력에는 남으므로 되돌릴 수 있다.
    return json({ ok: true, file });
  } catch (e) {
    const { status, message } = clientError(e);
    return fail(status, message);
  }
};
