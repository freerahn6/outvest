// /api/admin/* 전체 인증 게이트. 로그인만 열어둔다.
import { verifyToken, bearerOf } from '../../../src/server/auth';
import { fail, signingSecret, missingEnv, type Ctx } from '../../../src/server/http';

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  const path = new URL(request.url).pathname;

  const miss = missingEnv(env);
  if (miss) return fail(500, miss);

  if (path === '/api/admin/login') return ctx.next();

  const ok = await verifyToken(signingSecret(env), bearerOf(request));
  if (!ok) return fail(401, '로그인이 필요합니다');

  return ctx.next();
};
