/**
 * 글 카드 썸네일(커버) SVG 생성기. 실행: node scripts/gen-covers.mjs
 * 엘리펀트 스타일(밝은 배경·초록 강조·깔끔) 참고. public/images/cover-*.svg
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/images/', import.meta.url));
const W = 1200, H = 675;

function cover({ eyebrow, titleLines, ticker, brand = '아웃베스트의 투자로그' }) {
  // 상승 라인 모티프 (좌하 → 우상)
  const pts = [
    [0, 540], [150, 500], [300, 520], [450, 440], [600, 470],
    [750, 380], [900, 410], [1050, 300], [1200, 260],
  ];
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const area = `${line} L1200 ${H} L0 ${H} Z`;
  const titleSvg = titleLines
    .map((t, i) => `<text x="80" y="${292 + i * 82}" class="ttl">${t}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${titleLines.join(' ')}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3fa05e" stop-opacity="0.16"/>
    <stop offset="1" stop-color="#3fa05e" stop-opacity="0.02"/>
  </linearGradient>
</defs>
<style>
  .bg{fill:#f5f8f6} .blob{fill:#3fa05e;opacity:0.10}
  .eye{fill:#2f8f57;font:700 27px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:1px}
  .ttl{fill:#1b1d20;font:800 62px system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-1.5px}
  .brand{fill:#8a8f8b;font:600 24px system-ui,sans-serif}
  .tkr{fill:#2f8f57;font:700 26px system-ui,sans-serif;font-variant-numeric:tabular-nums}
  .tkrbox{fill:none;stroke:#3fa05e;stroke-width:2}
  .line{fill:none;stroke:#3fa05e;stroke-width:4;stroke-linejoin:round;stroke-linecap:round}
</style>
<rect class="bg" width="${W}" height="${H}"/>
<circle class="blob" cx="1040" cy="130" r="250"/>
<path d="${area}" fill="url(#g)"/>
<path d="${line}" class="line"/>
<text x="80" y="132" class="eye">${eyebrow}</text>
${titleSvg}
<rect class="tkrbox" x="80" y="556" width="${58 + ticker.length * 17}" height="44" rx="22"/>
<text x="104" y="585" class="tkr">${ticker}</text>
<text x="1120" y="620" text-anchor="end" class="brand">${brand}</text>
</svg>`;
}

const covers = {
  'cover-skhynix.svg': cover({
    eyebrow: '종목 분석 · ADR',
    titleLines: ['SK하이닉스', '나스닥 ADR 상장'],
    ticker: '000660',
  }),
  'cover-samsung.svg': cover({
    eyebrow: '실적 분석',
    titleLines: ['삼성전자', '영업이익 89.4조'],
    ticker: '005930',
  }),
  'cover-sobujang.svg': cover({
    eyebrow: '산업 분석',
    titleLines: ['반도체 소부장', '대장주는 어디?'],
    ticker: '042700',
  }),
  'cover-perpbr.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['PER · PBR', '5분 완전정리'],
    ticker: '밸류에이션',
  }),
  'cover-short.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['공매도란', '무엇인가'],
    ticker: '공매도',
  }),
  'cover-adr.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['ADR이란', '무엇인가'],
    ticker: 'ADR',
  }),
  'cover-dividend.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['배당투자', '기초'],
    ticker: '배당',
  }),
  'cover-etf.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['ETF vs', '개별주'],
    ticker: 'ETF',
  }),
  'cover-kdiscount.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['코리아', '디스카운트'],
    ticker: '밸류업',
  }),
  'cover-orderbook.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['호가창과 주문', '체결의 원리'],
    ticker: '호가창',
  }),
  'cover-rate.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['금리가 오르면', '주가는 왜 빠지나'],
    ticker: '금리',
  }),
  'cover-dilution.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['유상증자 · 물적분할', '희석이란'],
    ticker: '희석',
  }),
  'cover-leverage.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['레버리지 · 인버스', 'ETF의 함정'],
    ticker: '음의 복리',
  }),
  'cover-tax.svg': cover({
    eyebrow: '기초 강의',
    titleLines: ['주식 세금', '총정리'],
    ticker: '세금',
  }),
  'cover-hyundai.svg': cover({
    eyebrow: '종목 분석',
    titleLines: ['현대차 주가', '저점을 지났나'],
    ticker: '005380',
  }),
  'cover-ssb.svg': cover({
    eyebrow: '종목 분석',
    titleLines: ['전고체배터리', '대장주는 어디?'],
    ticker: '전고체',
  }),
  'cover-naver.svg': cover({
    eyebrow: '종목 분석',
    titleLines: ['네이버 주가에도', '봄은 오는가'],
    ticker: '035420',
  }),
  'cover-mideast.svg': cover({
    eyebrow: '시황 · 거시',
    titleLines: ['중동 긴장 고조,', '한국 증시 영향은?'],
    ticker: '지정학',
  }),
  'cover-semco.svg': cover({
    eyebrow: '종목 분석',
    titleLines: ['삼성전기는 왜', '오르고 떨어졌나'],
    ticker: '009150',
  }),
  'cover-blackmonday.svg': cover({
    eyebrow: '시황 · 긴급',
    titleLines: ['검은 월요일,', '하락장인가 기회인가'],
    ticker: '반도체',
  }),
  'cover-rebound.svg': cover({
    eyebrow: '시황 · 속편',
    titleLines: ['하루 만의 반등,', '무엇이 증명됐나'],
    ticker: 'V자 반등',
  }),
  'cover-adr-outlook.svg': cover({
    eyebrow: '시황 · ADR',
    titleLines: ['하이닉스 ADR 급등,', '오늘 한국장은?'],
    ticker: 'HBM4',
  }),
  'cover-hlb.svg': cover({
    eyebrow: '시황 · 바이오',
    titleLines: ['HLB 무더기 상한가,', '폭락 뒤 반등의 정체'],
    ticker: 'HLB',
  }),
};

await mkdir(OUT, { recursive: true });
for (const [name, svg] of Object.entries(covers)) await writeFile(OUT + name, svg);
console.log(`✅ 커버 ${Object.keys(covers).length}종 생성:`, Object.keys(covers).join(', '));
