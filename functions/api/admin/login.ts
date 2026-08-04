// POST /api/admin/login  { password } → { token, expiresAt }
import { issueToken, safeEqual } from '../../../src/server/auth';
import { json, fail, signingSecret, type Ctx } from '../../../src/server/http';

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  let password = '';
  try {
    password = String(((await request.json()) as any)?.password ?? '');
  } catch {
    return fail(400, '요청 형식이 올바르지 않습니다');
  }

  if (!password || !(await safeEqual(password, env.ADMIN_PASSWORD))) {
    // 무차별 대입을 조금이라도 비싸게 만든다.
    await new Promise((r) => setTimeout(r, 600));
    return fail(401, '비밀번호가 올바르지 않습니다');
  }

  const { token, expiresAt } = await issueToken(signingSecret(env));
  return json({ token, expiresAt });
};
