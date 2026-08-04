// ────────────────────────────────────────────────────────────────
//  예약 발행 체크 — 10분마다 GitHub Actions 가 실행한다.
//
//  정적 사이트라 "예약 시각이 됐다"는 사실만으로는 아무 일도 안 일어난다.
//  누군가 빌드를 다시 돌려야 한다. 그 '누군가'가 이 스크립트다.
//
//  판정 방식(상태 저장 없음):
//    저장소에서 "지금 나가야 할 글"을 추리고, 라이브 사이트맵과 대조한다.
//    사이트맵에 없으면 아직 안 나간 것 → Cloudflare Deploy Hook 을 호출한다.
//
//  필요한 것:
//    env SITE_URL         (예: https://outvest.kr)
//    env CF_DEPLOY_HOOK   Cloudflare Pages 의 Deploy Hook URL (GitHub Secret)
// ────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

const POSTS_DIR = 'src/content/posts';
const SITE = (process.env.SITE_URL || 'https://outvest.kr').replace(/\/$/, '');
const HOOK = process.env.CF_DEPLOY_HOOK || '';

/** frontmatter 에서 필요한 두 줄만 뽑는다 (의존성 없이 돌리기 위해). */
function readMeta(file) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!m) return null;
  const fm = m[1];
  const pub = /^pubDate:\s*(.+?)\s*$/m.exec(fm);
  const draft = /^draft:\s*(true|false)\s*$/m.exec(fm);
  if (!pub) return null;
  return {
    slug: file.replace(/\.md$/, ''),
    pubDate: pub[1].replace(/^["']|["']$/g, ''),
    draft: draft ? draft[1] === 'true' : false,
  };
}

// process.exit() 은 쓰지 않는다 — fetch 핸들이 열린 채 종료하면
// 일부 환경에서 비정상 종료코드가 나와 워크플로가 실패로 잡힌다.
async function main() {
  const now = Date.now();
  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(readMeta)
    .filter(Boolean);

  const timeOf = (p) => new Date(p.pubDate).getTime();
  const live = posts.filter((p) => !p.draft && !Number.isNaN(timeOf(p)));
  const due = live.filter((p) => timeOf(p) <= now);
  const pending = live.filter((p) => timeOf(p) > now);

  console.log(`글 ${posts.length}편 · 게시돼야 할 글 ${due.length}편 · 예약 대기 ${pending.length}편`);
  for (const p of pending) console.log(`  대기: ${p.slug} → ${p.pubDate}`);

  // 라이브 사이트맵과 대조
  let sitemap;
  try {
    const res = await fetch(`${SITE}/sitemap.xml`, { headers: { 'User-Agent': 'outvest-scheduler' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sitemap = await res.text();
  } catch (e) {
    // 사이트맵을 못 읽으면 판단 근거가 없다 — 함부로 빌드를 돌리지 않는다.
    console.log(`사이트맵을 읽지 못했습니다 (${e.message}). 이번 회차는 건너뜁니다.`);
    return 0;
  }

  const missing = due.filter((p) => !sitemap.includes(`${SITE}/posts/${p.slug}/`));
  if (!missing.length) {
    console.log('사이트가 최신입니다. 할 일 없음.');
    return 0;
  }

  console.log(`아직 사이트에 없는 글 ${missing.length}편: ${missing.map((p) => p.slug).join(', ')}`);

  if (!HOOK) {
    console.error('CF_DEPLOY_HOOK 시크릿이 없어 재빌드를 걸 수 없습니다.');
    return 1;
  }

  const res = await fetch(HOOK, { method: 'POST' });
  if (!res.ok) {
    console.error(`Deploy Hook 호출 실패: HTTP ${res.status}`);
    return 1;
  }
  console.log('재빌드를 요청했습니다. 1~3분 뒤 게시됩니다.');
  return 0;
}

process.exitCode = await main();
