// ────────────────────────────────────────────────────────────────
//  마크다운 frontmatter 파싱 / 직렬화
//
//  원칙: 파싱은 관대하게(js-yaml), 직렬화는 이 저장소의 기존 글과
//        똑같은 모양으로. 우리가 모르는 필드는 절대 버리지 않는다.
// ────────────────────────────────────────────────────────────────
import * as yaml from 'js-yaml';

export type Ticker = { code: string; name: string };

export type PostMeta = {
  title: string;
  description: string;
  /** 원문 그대로의 문자열. '2026-04-18' 또는 '2026-08-05T09:00:00+09:00' */
  pubDate: string;
  updatedDate?: string;
  tags: string[];
  category?: string;
  cover?: string;
  tickers: Ticker[];
  draft: boolean;
  /** 위 목록에 없는 필드(미래 확장분)는 여기 담아 원문 보존한다. */
  extra: Record<string, unknown>;
};

const KNOWN = [
  'title',
  'description',
  'pubDate',
  'updatedDate',
  'tags',
  'category',
  'cover',
  'tickers',
  'draft',
];

const FM_RE = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** 마크다운 원문 → { meta, body } */
export function parsePost(raw: string): { meta: PostMeta; body: string } {
  const m = FM_RE.exec(raw);
  if (!m) throw new Error('frontmatter 를 찾을 수 없습니다 (--- 로 시작해야 합니다)');

  // CORE_SCHEMA: 날짜를 Date 객체로 바꾸지 않는다 → 원문 문자열이 그대로 남는다.
  const data = (yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) ?? {}) as Record<string, any>;
  const body = raw.slice(m[0].length);

  const extra: Record<string, unknown> = {};
  for (const k of Object.keys(data)) if (!KNOWN.includes(k)) extra[k] = data[k];

  return {
    meta: {
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      pubDate: String(data.pubDate ?? ''),
      updatedDate: data.updatedDate == null ? undefined : String(data.updatedDate),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      category: data.category == null ? undefined : String(data.category),
      cover: data.cover == null ? undefined : String(data.cover),
      tickers: Array.isArray(data.tickers)
        ? data.tickers
            .filter((t: any) => t && t.code)
            .map((t: any) => ({ code: String(t.code), name: String(t.name ?? '') }))
        : [],
      draft: data.draft === true,
      extra,
    },
    body,
  };
}

/** 큰따옴표 스칼라. YAML 이 오해할 여지를 없앤다. */
function q(s: string): string {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/** { meta, body } → 마크다운 원문 (기존 글과 동일한 서식) */
export function serializePost(meta: PostMeta, body: string): string {
  const L: string[] = ['---'];
  L.push(`title: ${q(meta.title)}`);
  L.push(`description: ${q(meta.description)}`);
  // 날짜는 따옴표 없는 스칼라 (기존 글 서식과 동일)
  L.push(`pubDate: ${meta.pubDate}`);
  if (meta.updatedDate) L.push(`updatedDate: ${meta.updatedDate}`);
  if (meta.tickers.length) {
    L.push('tickers:');
    for (const t of meta.tickers) L.push(`  - { code: ${q(t.code)}, name: ${q(t.name)} }`);
  }
  if (meta.tags.length) L.push(`tags: [${meta.tags.map(q).join(', ')}]`);
  if (meta.category) L.push(`category: ${q(meta.category)}`);
  if (meta.cover) L.push(`cover: ${q(meta.cover)}`);
  // 게시 여부는 항상 명시한다 — 파일만 봐도 상태를 알 수 있도록.
  L.push(`draft: ${meta.draft ? 'true' : 'false'}`);

  // 우리가 모르는 필드 원문 보존
  const extraKeys = Object.keys(meta.extra ?? {});
  if (extraKeys.length) {
    const dumped = yaml.dump(meta.extra, { lineWidth: -1, noRefs: true }).trimEnd();
    if (dumped && dumped !== '{}') L.push(dumped);
  }

  L.push('---');
  // 본문은 frontmatter 뒤 빈 줄 하나로 시작 (기존 글 서식).
  // 줄바꿈은 항상 LF — 저장소의 blob 이 LF 이므로 CRLF 로 쓰면 전체 줄이 diff 로 잡힌다.
  const clean = body.replace(/\r\n/g, '\n').replace(/^\s*\n+/, '').replace(/\s*$/, '');
  return L.join('\n') + '\n\n' + clean + '\n';
}

export type PostStatus = 'published' | 'scheduled' | 'draft';

/**
 * 글의 상태는 별도 필드가 아니라 draft + pubDate 에서 파생된다.
 * (사이트의 isLive() 와 같은 판정 규칙이어야 한다.)
 */
export function statusOf(meta: { draft: boolean; pubDate: string }): PostStatus {
  if (meta.draft) return 'draft';
  const t = new Date(meta.pubDate).getTime();
  if (Number.isNaN(t)) return 'draft';
  return t > Date.now() ? 'scheduled' : 'published';
}

/** 파일명(슬러그) 규칙: 영소문자·숫자·하이픈 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug);
}
