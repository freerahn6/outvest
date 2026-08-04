// ────────────────────────────────────────────────────────────────
//  Pages Functions 공통 — 환경변수 타입 · 응답 헬퍼
// ────────────────────────────────────────────────────────────────

export type Env = {
  /** 관리자 비밀번호 (Cloudflare Pages 환경변수, Secret 권장) */
  ADMIN_PASSWORD: string;
  /** 세션 토큰 서명키. 안 넣으면 ADMIN_PASSWORD 로 대체된다. */
  SESSION_SECRET?: string;
  /** contents:write 권한의 fine-grained PAT */
  GITHUB_TOKEN: string;
  /** "freerahn6/outvest" */
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string;
};

/** Pages Functions 핸들러 컨텍스트 (필요한 필드만 최소로 선언) */
export type Ctx = {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
};

export const signingSecret = (env: Env) => env.SESSION_SECRET || env.ADMIN_PASSWORD || '';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function fail(status: number, message: string): Response {
  return json({ error: message }, status);
}

/** 설정이 빠졌으면 500 대신 "무엇이 빠졌는지"를 알려준다. */
export function missingEnv(env: Env): string | null {
  const need: (keyof Env)[] = ['ADMIN_PASSWORD', 'GITHUB_TOKEN', 'GITHUB_REPO'];
  const miss = need.filter((k) => !env[k]);
  return miss.length ? `환경변수 미설정: ${miss.join(', ')}` : null;
}
