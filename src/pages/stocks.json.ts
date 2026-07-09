import type { APIRoute } from 'astro';
import krx from '../data/krx.json';

// 종목 입력창 자동완성이 이 엔드포인트에서 종목 목록을 불러옵니다.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(krx), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
