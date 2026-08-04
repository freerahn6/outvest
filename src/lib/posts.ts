// ────────────────────────────────────────────────────────────────
//  글 공개 판정 · 날짜 표기 — 사이트 전체가 이 두 함수만 쓴다.
//
//  ⚠️ 새 목록/피드/사이트맵을 추가할 때 반드시 isLive 를 쓸 것.
//     한 군데라도 빼먹으면 예약 글이 그 경로로 새어나간다.
// ────────────────────────────────────────────────────────────────

type PostData = { draft?: boolean; pubDate: Date };

/**
 * 사이트에 실제로 노출되는 글인가?
 *   - draft: true      → 비공개 (관리자만 봄)
 *   - pubDate 가 미래  → 예약 (아직 때가 안 됨)
 *
 * 빌드 시점에 판정되므로, 예약 시각이 지나도 "다시 빌드되어야" 게시된다.
 * 그 재빌드는 .github/workflows/scheduled-publish.yml 의 cron 이 걸어준다.
 */
export function isLive({ data }: { data: PostData }): boolean {
  return !data.draft && data.pubDate.getTime() <= Date.now();
}

/**
 * 날짜 표기는 항상 한국 시간 기준.
 * (빌드는 UTC 서버에서 돌기 때문에 timeZone 을 명시하지 않으면
 *  새벽에 예약 발행된 글의 날짜가 하루 밀려 표시된다.)
 */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });
}
