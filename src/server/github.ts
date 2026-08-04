// ────────────────────────────────────────────────────────────────
//  GitHub 저장소 읽기/쓰기 — 콘텐츠의 단일 진실원(SSOT)은 git 이다.
//
//  관리자 콘솔의 저장은 곧 커밋이고, 커밋은 Cloudflare Pages 의
//  자동 빌드를 깨운다. 서버에 별도 DB 를 두지 않는 이유가 이것이다.
// ────────────────────────────────────────────────────────────────

export type GhEnv = {
  GITHUB_TOKEN: string;
  GITHUB_REPO: string; // "owner/name"
  GITHUB_BRANCH?: string; // 기본 main
};

export const POSTS_DIR = 'src/content/posts';

const API = 'https://api.github.com';
const UA = 'outvest-admin';

function repoParts(env: GhEnv) {
  const [owner, name] = (env.GITHUB_REPO ?? '').split('/');
  if (!owner || !name) throw new Error('GITHUB_REPO 형식이 잘못됐습니다 (owner/name)');
  return { owner, name, branch: env.GITHUB_BRANCH || 'main' };
}

function headers(env: GhEnv) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'Content-Type': 'application/json',
  };
}

/** UTF-8 문자열 → base64 (한글 본문이 깨지지 않도록 바이트 단위로) */
export function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  const CHUNK = 0x8000; // 인자 개수 한계 회피
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export class GhError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * GitHub 의 상태코드를 그대로 브라우저에 넘기면 안 된다.
 * 특히 401/403 은 관리자 콘솔에서 "세션 만료"로 해석돼 멀쩡한 로그인이 풀린다.
 * 상류(GitHub) 인증 문제는 502 로 바꿔 "설정이 잘못됐다"고 분명히 말한다.
 */
export function clientError(e: unknown): { status: number; message: string } {
  if (e instanceof GhError) {
    if (e.status === 401 || e.status === 403) {
      return {
        status: 502,
        message: 'GitHub 토큰이 잘못됐거나 저장소 권한이 없습니다. (Pages 환경변수 GITHUB_TOKEN 확인)',
      };
    }
    if (e.status === 404 || e.status === 409 || e.status === 422) {
      return { status: e.status, message: e.message };
    }
    return { status: 502, message: `GitHub 연결 실패: ${e.message}` };
  }
  return { status: 500, message: (e as any)?.message ?? '알 수 없는 오류' };
}

/**
 * 글 전체를 한 번의 요청으로 가져온다.
 * (파일마다 REST 를 때리면 글이 늘수록 Worker 서브리퀘스트 한도에 걸린다.
 *  GraphQL 은 디렉터리 하나를 통째로, 본문까지 한 방에 준다.)
 */
export async function listPostFiles(
  env: GhEnv
): Promise<{ file: string; sha: string; raw: string }[]> {
  const { owner, name, branch } = repoParts(env);
  const query = `
    query($owner:String!, $name:String!, $expr:String!) {
      repository(owner:$owner, name:$name) {
        object(expression:$expr) {
          ... on Tree {
            entries {
              name
              type
              object { ... on Blob { oid text isTruncated } }
            }
          }
        }
      }
    }`;

  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      query,
      variables: { owner, name, expr: `${branch}:${POSTS_DIR}` },
    }),
  });

  if (!res.ok) throw new GhError(res.status, `GitHub GraphQL ${res.status}`);
  const json: any = await res.json();
  if (json.errors?.length) throw new GhError(502, json.errors[0].message);

  const entries = json.data?.repository?.object?.entries;
  if (!entries) return [];

  return entries
    .filter((e: any) => e.type === 'blob' && e.name.endsWith('.md') && e.object?.text != null)
    .map((e: any) => ({ file: e.name, sha: e.object.oid, raw: e.object.text as string }));
}

export async function getFile(env: GhEnv, path: string): Promise<{ sha: string; text: string }> {
  const { owner, name, branch } = repoParts(env);
  const res = await fetch(
    `${API}/repos/${owner}/${name}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: headers(env) }
  );
  if (res.status === 404) throw new GhError(404, '글을 찾을 수 없습니다');
  if (!res.ok) throw new GhError(res.status, `GitHub ${res.status}`);
  const json: any = await res.json();
  return { sha: json.sha, text: fromBase64(json.content) };
}

/** sha 를 넘기면 수정, 안 넘기면 신규 생성. sha 불일치는 409(다른 곳에서 먼저 수정됨). */
export async function putFile(
  env: GhEnv,
  path: string,
  text: string,
  sha: string | null,
  message: string
): Promise<{ sha: string }> {
  const { owner, name, branch } = repoParts(env);
  const res = await fetch(`${API}/repos/${owner}/${name}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers: headers(env),
    body: JSON.stringify({
      message,
      content: toBase64(text),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.status === 409 || res.status === 422) {
    throw new GhError(409, '다른 곳에서 이미 수정된 글입니다. 새로고침 후 다시 저장하세요.');
  }
  if (!res.ok) throw new GhError(res.status, `GitHub ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  return { sha: json.content.sha };
}

export async function deleteFile(
  env: GhEnv,
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const { owner, name, branch } = repoParts(env);
  const res = await fetch(`${API}/repos/${owner}/${name}/contents/${encodeURI(path)}`, {
    method: 'DELETE',
    headers: headers(env),
    body: JSON.stringify({ message, sha, branch }),
  });
  if (res.status === 409) throw new GhError(409, '다른 곳에서 이미 수정된 글입니다.');
  if (!res.ok) throw new GhError(res.status, `GitHub ${res.status}`);
}
