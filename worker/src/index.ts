/**
 * KIS(한국투자증권) 실시간 시세 프록시 — Cloudflare Worker
 *
 * 블로그(정적 사이트)에서 /api/quote?code=005930 로 호출하면
 * 이 Worker 가 KIS API 에 앱키를 붙여 대신 조회하고 JSON 으로 돌려줍니다.
 * 앱키/시크릿은 절대 브라우저로 나가지 않습니다 (Worker Secret 으로 보관).
 *
 * 필요한 Secret (wrangler secret put ... 로 등록):
 *   KIS_APP_KEY, KIS_APP_SECRET
 * 선택 var:
 *   KIS_BASE  : 실전 https://openapi.koreainvestment.com:9443 (기본)
 *               모의 https://openapivts.koreainvestment.com:29443
 *   ALLOW_ORIGIN : CORS 허용 도메인 (기본 *). 배포 후 블로그 도메인으로 좁히세요.
 */

export interface Env {
  KIS_APP_KEY: string;
  KIS_APP_SECRET: string;
  KIS_BASE?: string;
  ALLOW_ORIGIN?: string;
  KIS_TOKEN?: KVNamespace; // 선택: 토큰 캐시용 KV (없어도 동작)
}

// 접근토큰 메모리 캐시 (isolate 단위). KV 가 있으면 KV 도 함께 사용.
let memToken: { token: string; exp: number } | null = null;

async function getAccessToken(env: Env): Promise<string> {
  const base = env.KIS_BASE ?? 'https://openapi.koreainvestment.com:9443';
  const now = Date.now();

  if (memToken && memToken.exp > now + 60_000) return memToken.token;

  if (env.KIS_TOKEN) {
    const cached = await env.KIS_TOKEN.get('access_token', 'json') as { token: string; exp: number } | null;
    if (cached && cached.exp > now + 60_000) {
      memToken = cached;
      return cached.token;
    }
  }

  const res = await fetch(`${base}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  const exp = now + (data.expires_in ?? 86400) * 1000;
  memToken = { token: data.access_token, exp };
  if (env.KIS_TOKEN) {
    await env.KIS_TOKEN.put('access_token', JSON.stringify(memToken), {
      expiration: Math.floor(exp / 1000),
    });
  }
  return data.access_token;
}

async function fetchQuote(env: Env, code: string) {
  const base = env.KIS_BASE ?? 'https://openapi.koreainvestment.com:9443';
  const token = await getAccessToken(env);
  const url = new URL(`${base}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
  url.searchParams.set('FID_INPUT_ISCD', code);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
      tr_id: 'FHKST01010100',
      custtype: 'P',
    },
  });
  if (!res.ok) throw new Error(`quote ${res.status}`);
  const j = (await res.json()) as any;
  const o = j.output;
  if (!o) throw new Error('no output');

  const num = (v: string) => (v == null || v === '' ? null : Number(v));
  // prdy_vrss_sign: 1↑상한 2↑상승 3 보합 4↓하한 5↓하락
  const sign = o.prdy_vrss_sign;
  const change = num(o.prdy_vrss) ?? 0;
  const signedChange = sign === '4' || sign === '5' ? -Math.abs(change) : Math.abs(change);
  const rate = num(o.prdy_ctrt) ?? 0;

  return {
    code,
    name: o.hts_kor_isnm ?? '',
    price: num(o.stck_prpr),
    change: signedChange,
    changeRate: sign === '4' || sign === '5' ? -Math.abs(rate) : Math.abs(rate),
    open: num(o.stck_oprc),
    high: num(o.stck_hgpr),
    low: num(o.stck_lwpr),
    volume: num(o.acml_vol),
    time: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOW_ORIGIN ?? '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code || !/^\d{6}$/.test(code)) {
      return Response.json({ error: 'invalid code' }, { status: 400, headers: cors });
    }

    try {
      const quote = await fetchQuote(env, code);
      return Response.json(quote, {
        headers: { ...cors, 'Cache-Control': 'public, max-age=10' },
      });
    } catch (e: any) {
      return Response.json({ error: String(e?.message ?? e) }, { status: 502, headers: cors });
    }
  },
};
