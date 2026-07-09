/**
 * KRX 전 종목(코스피+코스닥) 목록을 받아 src/data/krx.json 을 갱신합니다.
 * 실행:  node scripts/fetch-krx.mjs
 *
 * 데이터 출처: 한국거래소 정보데이터시스템(data.krx.co.kr) 공개 JSON.
 * (구조가 바뀌면 아래 필드명을 조정하세요.)
 */
import { writeFile } from 'node:fs/promises';

const URL = 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';

async function fetchMarket(mktId, marketName) {
  const body = new URLSearchParams({
    bld: 'dbms/MDC/STAT/standard/MDCSTAT01901',
    mktId, // STK=코스피, KSQ=코스닥
    share: '1',
    csvxls_isNo: 'false',
  });
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'http://data.krx.co.kr/',
    },
    body,
  });
  if (!res.ok) throw new Error(`${marketName} ${res.status}`);
  const json = await res.json();
  const rows = json.OutBlock_1 ?? json.output ?? [];
  return rows.map((r) => ({
    code: r.ISU_SRT_CD,      // 단축 종목코드 (6자리)
    name: r.ISU_ABBRV,       // 한글 종목약명
    market: marketName,
  }));
}

const kospi = await fetchMarket('STK', 'KOSPI');
const kosdaq = await fetchMarket('KSQ', 'KOSDAQ');
const all = [...kospi, ...kosdaq]
  .filter((s) => /^\d{6}$/.test(s.code) && s.name)
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

await writeFile(
  new URL('../src/data/krx.json', import.meta.url),
  JSON.stringify(all, null, 0) + '\n',
  'utf-8'
);
console.log(`✅ ${all.length}개 종목 저장 (KOSPI ${kospi.length} + KOSDAQ ${kosdaq.length})`);
console.log('   → src/data/krx.json 갱신 완료. npm run build 로 반영하세요.');
