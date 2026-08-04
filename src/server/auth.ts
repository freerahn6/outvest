// ────────────────────────────────────────────────────────────────
//  관리자 인증 — 비밀번호 1회 확인 → 서명된 세션 토큰
//
//  비밀번호는 Cloudflare 환경변수(ADMIN_PASSWORD)에만 있고
//  브라우저로 내려가지 않는다. 토큰은 HMAC 서명이라 위조 불가이며,
//  별도 저장소(KV/D1) 없이 검증된다.
// ────────────────────────────────────────────────────────────────

const enc = new TextEncoder();

/** 세션 유효기간 12시간 */
const TTL_MS = 12 * 60 * 60 * 1000;

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const p = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(p + '='.repeat((4 - (p.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, msg: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}

/** 길이·내용 노출을 줄이는 상수시간 비교 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  // 해시를 떠서 비교하면 길이 차이도 타이밍으로 새지 않는다.
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function issueToken(secret: string): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + TTL_MS;
  const payload = b64urlEncode(enc.encode(JSON.stringify({ exp: expiresAt })));
  const sig = b64urlEncode(await hmac(secret, payload));
  return { token: `${payload}.${sig}`, expiresAt };
}

export async function verifyToken(secret: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = b64urlEncode(await hmac(secret, payload));
  if (!(await safeEqual(sig, expected))) return false;

  try {
    const { exp } = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Authorization: Bearer <token> 에서 토큰만 뽑는다. */
export function bearerOf(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}
