/**
 * 블로그 본문용 SEO 도표(SVG) 생성기.
 * 실행: node scripts/gen-charts.mjs  → public/images/*.svg
 * 테마 대응(prefers-color-scheme), 검증된 팔레트(blue/orange) 사용.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/images/', import.meta.url));

// 공통 스타일(테마 대응). SVG를 <img>로 불러도 @media가 동작한다.
const style = `
  :root{
    --surface:#fcfcfb; --ink:#0b0b0b; --sub:#52514e; --muted:#898781;
    --grid:#e1e0d9; --axis:#c3c2b7; --blue:#2a78d6; --orange:#eb6834; --aqua:#1baf7a;
    --red:#e34948; --green:#008300; --mute:#b7d3f6;
  }
  @media (prefers-color-scheme:dark){
    :root{ --surface:#1a1a19; --ink:#ffffff; --sub:#c3c2b7; --muted:#898781;
      --grid:#2c2c2a; --axis:#383835; --blue:#3987e5; --orange:#d95926; --aqua:#199e70;
      --red:#e66767; --green:#31a531; --mute:#2f4b6e; }
  }
  .bg{fill:var(--surface)}
  .title{fill:var(--ink);font:700 20px system-ui,-apple-system,"Segoe UI",sans-serif}
  .sub{fill:var(--sub);font:400 13px system-ui,sans-serif}
  .lbl{fill:var(--ink);font:600 14px system-ui,sans-serif}
  .ax{fill:var(--muted);font:500 13px system-ui,sans-serif;font-variant-numeric:tabular-nums}
  .val{fill:var(--ink);font:700 15px system-ui,sans-serif;font-variant-numeric:tabular-nums}
  .grid{stroke:var(--grid);stroke-width:1}
  .base{stroke:var(--axis);stroke-width:1.5}
  .s-blue{fill:var(--blue)} .s-orange{fill:var(--orange)} .s-aqua{fill:var(--aqua)}
  .s-red{fill:var(--red)} .s-green{fill:var(--green)} .s-mute{fill:var(--mute)}
  .refline{stroke:var(--orange);stroke-width:1.5;stroke-dasharray:5 4}
  .nowline{stroke:var(--ink);stroke-width:1.5;stroke-dasharray:4 3}
`;

const svg = (w, h, body, title, desc) =>
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">
<title>${title}</title><desc>${desc}</desc>
<style>${style}</style>
<rect class="bg" x="0" y="0" width="${w}" height="${h}" rx="14"/>
${body}
</svg>`;

// 둥근 위 모서리 막대(세로)
const vbar = (x, y, w, h, cls) =>
  `<path class="${cls}" d="M${x} ${y + h} V${y + 4} q0 -4 4 -4 h${w - 8} q4 0 4 4 V${y + h} Z"/>`;
// 둥근 오른쪽 모서리 막대(가로)
const hbar = (x, y, w, h, cls) =>
  `<path class="${cls}" d="M${x} ${y} h${w - 4} q4 0 4 4 v${h - 8} q0 4 -4 4 h${w - 4} Z"/>`;

// ── 1) P/E 갭: 하이닉스 vs 마이크론 (그룹 막대) ──────────────
function peGap() {
  const W = 760, H = 470, L = 40, R = 24, T = 96, B = 56;
  const pw = W - L - R, ph = H - T - B, base = T + ph, maxV = 30, k = ph / maxV;
  const groups = [
    { label: '2025년 예상', hy: 11, mc: 29 },
    { label: '2026년 예상', hy: 7.8, mc: 12.6 },
  ];
  const bw = 76, gap = 14;
  let body = `<text class="title" x="${L}" y="34">SK하이닉스 vs 마이크론 — 주가수익비율(P/E)</text>`;
  body += `<text class="sub" x="${L}" y="56">같은 업황·같은 제품군인데 하이닉스가 절반 이하 — '코리아 디스카운트'의 크기</text>`;
  // 범례
  body += `<rect class="s-blue" x="${W - R - 210}" y="26" width="12" height="12" rx="3"/><text class="sub" x="${W - R - 192}" y="36">SK하이닉스</text>`;
  body += `<rect class="s-orange" x="${W - R - 110}" y="26" width="12" height="12" rx="3"/><text class="sub" x="${W - R - 92}" y="36">마이크론</text>`;
  // 그리드
  for (let v = 0; v <= 30; v += 10) {
    const y = base - v * k;
    body += `<line class="grid" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/>`;
    body += `<text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  body += `<line class="base" x1="${L}" y1="${base}" x2="${W - R}" y2="${base}"/>`;
  groups.forEach((g, i) => {
    const cx = L + pw * (i + 0.5) / groups.length;
    const x1 = cx - bw - gap / 2, x2 = cx + gap / 2;
    const h1 = g.hy * k, h2 = g.mc * k;
    body += vbar(x1, base - h1, bw, h1, 's-blue');
    body += vbar(x2, base - h2, bw, h2, 's-orange');
    body += `<text class="val" x="${x1 + bw / 2}" y="${base - h1 - 8}" text-anchor="middle">${g.hy}배</text>`;
    body += `<text class="val" x="${x2 + bw / 2}" y="${base - h2 - 8}" text-anchor="middle">${g.mc}배</text>`;
    body += `<text class="lbl" x="${cx}" y="${base + 26}" text-anchor="middle">${g.label}</text>`;
  });
  return svg(W, H, body,
    'SK하이닉스와 마이크론의 주가수익비율(P/E) 비교 막대그래프',
    '2025년 예상 기준 하이닉스 11배·마이크론 29배, 2026년 예상 기준 하이닉스 7.8배·마이크론 12.6배로, 하이닉스가 마이크론의 절반 이하 배수에 거래되고 있음을 보여준다.');
}

// ── 2) 재평가 상방 시나리오 (가로 막대) ─────────────────────
function upside() {
  const W = 760, H = 300, L = 150, R = 90, T = 92, B = 30;
  const pw = W - L - R, maxV = 70, k = pw / maxV;
  const rows = [
    { label: '절반 수렴', sub: '(현실적)', v: 26.5, txt: '+25~28%', cls: 's-blue' },
    { label: '완전 수렴', sub: '(이론상 최대)', v: 62, txt: '+62%', cls: 's-aqua' },
  ];
  const bh = 44, ry = T, gapY = 70;
  let body = `<text class="title" x="${L - 110}" y="34">ADR 재평가 상방 — 마이크론 배수에 수렴한다면</text>`;
  body += `<text class="sub" x="${L - 110}" y="56">2026년 예상 EPS 고정·희석 반영 가정. 실제는 가정에 따라 달라지는 추정치</text>`;
  // 눈금
  for (let v = 0; v <= 70; v += 20) {
    const x = L + v * k;
    body += `<line class="grid" x1="${x}" y1="${T - 10}" x2="${x}" y2="${T + gapY + bh}"/>`;
    body += `<text class="ax" x="${x}" y="${T + gapY + bh + 20}" text-anchor="middle">+${v}%</text>`;
  }
  rows.forEach((r, i) => {
    const y = ry + i * gapY;
    body += hbar(L, y, r.v * k, bh, r.cls);
    body += `<text class="lbl" x="${L - 12}" y="${y + bh / 2 - 2}" text-anchor="end">${r.label}</text>`;
    body += `<text class="sub" x="${L - 12}" y="${y + bh / 2 + 15}" text-anchor="end">${r.sub}</text>`;
    body += `<text class="val" x="${L + r.v * k + 10}" y="${y + bh / 2 + 5}">${r.txt}</text>`;
  });
  body += `<text class="sub" x="${L - 110}" y="${H - 8}">※ 비관 시나리오(과거 한국 ADR처럼 본주와 등가 수렴)에서는 오히려 하방 위험</text>`;
  return svg(W, H, body,
    'ADR 상장 후 밸류에이션 재평가 상방 시나리오 막대그래프',
    '마이크론과의 밸류에이션 갭이 절반만 좁혀지면 약 +25~28%, 완전히 수렴하면 이론상 +62%의 상방이 계산된다. 다만 비관 시나리오에서는 하방 위험이 있다.');
}

// ── 3) TSMC ADR 프리미엄 추이 (수렴) ───────────────────────
function tsmc() {
  const W = 760, H = 340, L = 44, R = 30, T = 92, B = 56;
  const pw = W - L - R, ph = H - T - B, base = T + ph, maxV = 30, k = ph / maxV;
  const pts = [
    { label: '2025년 12월', v: 26 },
    { label: '2026년 5월', v: 13.7 },
  ];
  const avg = 16;
  let body = `<text class="title" x="${L}" y="34">참고: TSMC ADR 프리미엄은 '좁혀지는' 중</text>`;
  body += `<text class="sub" x="${L}" y="56">본주 대비 프리미엄(%). 하이닉스 ADR도 결국 수렴할지가 관전 포인트</text>`;
  for (let v = 0; v <= 30; v += 10) {
    const y = base - v * k;
    body += `<line class="grid" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/>`;
    body += `<text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${v}%</text>`;
  }
  // 역사 평균 기준선
  const ay = base - avg * k;
  body += `<line class="refline" x1="${L}" y1="${ay}" x2="${W - R}" y2="${ay}"/>`;
  body += `<text class="sub" x="${W - R}" y="${ay - 8}" text-anchor="end">역사적 평균 ≈ 16%</text>`;
  body += `<line class="base" x1="${L}" y1="${base}" x2="${W - R}" y2="${base}"/>`;
  const bw = 120;
  pts.forEach((p, i) => {
    const cx = L + pw * (i + 0.5) / pts.length;
    const h = p.v * k;
    body += vbar(cx - bw / 2, base - h, bw, h, 's-blue');
    body += `<text class="val" x="${cx}" y="${base - h - 8}" text-anchor="middle">${p.v}%</text>`;
    body += `<text class="lbl" x="${cx}" y="${base + 26}" text-anchor="middle">${p.label}</text>`;
  });
  return svg(W, H, body,
    'TSMC ADR 프리미엄 추이 막대그래프',
    'TSMC의 미국 ADR은 타이베이 본주 대비 2025년 12월 약 26%에서 2026년 5월 약 13.7%로 프리미엄이 축소됐으며, 역사적 평균은 약 16%다.');
}

// ── 4) 삼성 영업이익 서프라이즈 (세로 막대) ──────────────────
function samsungSurprise() {
  const W = 760, H = 420, L = 44, R = 24, T = 92, B = 56;
  const pw = W - L - R, ph = H - T - B, base = T + ph, maxV = 110, k = ph / maxV;
  const bars = [
    { label: '컨센서스', v: 84.2, cls: 's-mute', t: '84.2조' },
    { label: '실제 2Q', v: 89.4, cls: 's-blue', t: '89.4조' },
    { label: '성과급 제외(실질)', v: 100, cls: 's-aqua', t: '100조+' },
  ];
  let body = `<text class="title" x="${L}" y="34">삼성전자 2026년 2분기 영업이익</text>`;
  body += `<text class="sub" x="${L}" y="56">시장 예상을 6% 웃돈 '어닝 서프라이즈' — 성과급을 빼면 실질 100조 초과</text>`;
  for (let v = 0; v <= 100; v += 25) {
    const y = base - v * k;
    body += `<line class="grid" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/>`;
    body += `<text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  body += `<line class="base" x1="${L}" y1="${base}" x2="${W - R}" y2="${base}"/>`;
  const bw = 150;
  bars.forEach((b, i) => {
    const cx = L + pw * (i + 0.5) / bars.length;
    const h = b.v * k;
    body += vbar(cx - bw / 2, base - h, bw, h, b.cls);
    body += `<text class="val" x="${cx}" y="${base - h - 8}" text-anchor="middle">${b.t}</text>`;
    body += `<text class="lbl" x="${cx}" y="${base + 26}" text-anchor="middle">${b.label}</text>`;
  });
  return svg(W, H, body, '삼성전자 2026년 2분기 영업이익 막대그래프',
    '시장 컨센서스 84.2조원 대비 실제 영업이익은 89.4조원으로 약 6% 상회했고, 성과급 충당금을 제외한 실질 영업이익은 100조원을 초과한 것으로 추정된다.');
}

// ── 5) HBM 점유율 3사 (가로 막대, 삼성 강조) ─────────────────
function hbmShare() {
  const W = 760, H = 300, L = 130, R = 70, T = 88, B = 26;
  const pw = W - L - R, maxV = 70, k = pw / maxV;
  const rows = [
    { label: 'SK하이닉스', v: 62, cls: 's-mute', t: '62%' },
    { label: '마이크론', v: 21, cls: 's-mute', t: '21%' },
    { label: '삼성전자', v: 17, cls: 's-orange', t: '17%' },
  ];
  const bh = 40, gapY = 58;
  let body = `<text class="title" x="${L - 90}" y="34">HBM 시장 점유율 — 삼성은 3위</text>`;
  body += `<text class="sub" x="${L - 90}" y="56">89조는 'HBM 승리'가 아니다. 삼성의 HBM 서열은 3위(2025년 기준·기관별 편차)</text>`;
  for (let v = 0; v <= 70; v += 20) {
    const x = L + v * k;
    body += `<line class="grid" x1="${x}" y1="${T - 8}" x2="${x}" y2="${T + gapY * 2 + bh}"/>`;
    body += `<text class="ax" x="${x}" y="${T + gapY * 2 + bh + 20}" text-anchor="middle">${v}%</text>`;
  }
  rows.forEach((r, i) => {
    const y = T + i * gapY;
    body += hbar(L, y, r.v * k, bh, r.cls);
    body += `<text class="lbl" x="${L - 12}" y="${y + bh / 2 + 5}" text-anchor="end">${r.label}</text>`;
    body += `<text class="val" x="${L + r.v * k + 10}" y="${y + bh / 2 + 5}">${r.t}</text>`;
  });
  return svg(W, H, body, 'HBM 시장 점유율 3사 비교 막대그래프',
    'HBM 시장 점유율은 SK하이닉스 약 62%, 마이크론 약 21%, 삼성전자 약 17%로 삼성전자가 3위다. 삼성의 2분기 실적은 HBM 주도가 아니라 범용 메모리 가격 급등이 이끌었다.');
}

// ── 6) 삼성 주가 시나리오 목표가 범위 (가로 레인지 막대) ──────
function samsungScenarios() {
  const W = 760, H = 340, L = 150, R = 70, T = 96, B = 44;
  const pw = W - L - R, maxV = 45, k = pw / maxV; // 만원
  const now = 30; // 현재가 ~30만
  const rows = [
    { label: '약세', sub: '다운사이클', lo: 12, hi: 18, cls: 's-red' },
    { label: '기본', sub: '박스권', lo: 25, hi: 33, cls: 's-blue' },
    { label: '강세', sub: '리레이팅', lo: 36, hi: 40, cls: 's-green' },
  ];
  const bh = 40, gapY = 62;
  let body = `<text class="title" x="${L - 110}" y="34">삼성전자 주가 시나리오별 목표가 범위</text>`;
  body += `<text class="sub" x="${L - 110}" y="56">밸류에이션 기반 추정(만원). 현재가는 '기본' 범위 안 — 안전마진 얇음</text>`;
  for (let v = 0; v <= 45; v += 10) {
    const x = L + v * k;
    body += `<line class="grid" x1="${x}" y1="${T - 10}" x2="${x}" y2="${T + gapY * 2 + bh + 6}"/>`;
    body += `<text class="ax" x="${x}" y="${T + gapY * 2 + bh + 24}" text-anchor="middle">${v}만</text>`;
  }
  rows.forEach((r, i) => {
    const y = T + i * gapY;
    const x0 = L + r.lo * k, x1 = L + r.hi * k;
    body += `<rect class="${r.cls}" x="${x0}" y="${y}" width="${x1 - x0}" height="${bh}" rx="8"/>`;
    body += `<text class="lbl" x="${L - 12}" y="${y + bh / 2 - 2}" text-anchor="end">${r.label}</text>`;
    body += `<text class="sub" x="${L - 12}" y="${y + bh / 2 + 15}" text-anchor="end">${r.sub}</text>`;
    body += `<text class="val" x="${x1 + 10}" y="${y + bh / 2 + 5}">${r.lo}~${r.hi}만</text>`;
  });
  // 현재가 기준선
  const nx = L + now * k;
  body += `<line class="nowline" x1="${nx}" y1="${T - 10}" x2="${nx}" y2="${T + gapY * 2 + bh + 6}"/>`;
  body += `<text class="sub" x="${nx}" y="${T - 16}" text-anchor="middle">현재가 ~30만</text>`;
  return svg(W, H, body, '삼성전자 주가 시나리오별 목표가 범위 막대그래프',
    '밸류에이션 기반 추정으로 약세(다운사이클) 12~18만원, 기본(박스권) 25~33만원, 강세(리레이팅) 36~40만원의 목표가 범위를 제시한다. 현재가 약 30만원은 기본 시나리오 범위 안에 있다.');
}

// ── 7) 한미 vs 한화세미텍 2025 수주 (세로 막대, 역전) ────────
function hanmiOrder() {
  const W = 760, H = 400, L = 50, R = 24, T = 92, B = 56;
  const pw = W - L - R, ph = H - T - B, base = T + ph, maxV = 900, k = ph / maxV;
  const bars = [
    { label: '한미반도체', v: 536, cls: 's-blue', t: '536억' },
    { label: '한화세미텍', v: 805, cls: 's-orange', t: '805억' },
  ];
  let body = `<text class="title" x="${L}" y="34">TC본더 2025년 수주 — 왕좌가 흔들린다</text>`;
  body += `<text class="sub" x="${L}" y="56">세계 1위 한미반도체를 경쟁사 한화세미텍이 수주에서 역전한 사례</text>`;
  for (let v = 0; v <= 900; v += 300) {
    const y = base - v * k;
    body += `<line class="grid" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/>`;
    body += `<text class="ax" x="${L - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  body += `<line class="base" x1="${L}" y1="${base}" x2="${W - R}" y2="${base}"/>`;
  const bw = 150;
  bars.forEach((b, i) => {
    const cx = L + pw * (i + 0.5) / bars.length;
    const h = b.v * k;
    body += vbar(cx - bw / 2, base - h, bw, h, b.cls);
    body += `<text class="val" x="${cx}" y="${base - h - 8}" text-anchor="middle">${b.t}</text>`;
    body += `<text class="lbl" x="${cx}" y="${base + 26}" text-anchor="middle">${b.label}</text>`;
  });
  body += `<text class="sub" x="${W - R}" y="${base + 26}" text-anchor="end">단위: 억원</text>`;
  return svg(W, H, body, 'TC본더 2025년 수주 한미반도체 대 한화세미텍 막대그래프',
    '2025년 TC본더 수주에서 한미반도체는 536억원, 경쟁사 한화세미텍은 805억원을 기록해 한화세미텍이 한미반도체를 역전했다.');
}

// ── 8) 소부장 영업이익률 비교 (가로 막대) ────────────────────
function sobujangOpm() {
  const W = 760, H = 340, L = 130, R = 70, T = 88, B = 26;
  const pw = W - L - R, maxV = 60, k = pw / maxV;
  const rows = [
    { label: 'HPSP', v: 54.8, cls: 's-aqua', t: '54.8%' },
    { label: '한미반도체', v: 50, cls: 's-mute', t: '약 50%' },
    { label: '리노공업', v: 49.2, cls: 's-mute', t: '49.2%' },
    { label: 'ISC', v: 25.7, cls: 's-mute', t: '25.7%' },
  ];
  const bh = 34, gapY = 50;
  let body = `<text class="title" x="${L - 90}" y="34">소부장 영업이익률 — 수익성 대장은 HPSP</text>`;
  body += `<text class="sub" x="${L - 90}" y="56">2026년 예상 영업이익률(%). '대장'과 '가장 수익성 좋은 회사'는 다르다</text>`;
  for (let v = 0; v <= 60; v += 20) {
    const x = L + v * k;
    body += `<line class="grid" x1="${x}" y1="${T - 8}" x2="${x}" y2="${T + gapY * 3 + bh}"/>`;
    body += `<text class="ax" x="${x}" y="${T + gapY * 3 + bh + 20}" text-anchor="middle">${v}%</text>`;
  }
  rows.forEach((r, i) => {
    const y = T + i * gapY;
    body += hbar(L, y, r.v * k, bh, r.cls);
    body += `<text class="lbl" x="${L - 12}" y="${y + bh / 2 + 5}" text-anchor="end">${r.label}</text>`;
    body += `<text class="val" x="${L + r.v * k + 10}" y="${y + bh / 2 + 5}">${r.t}</text>`;
  });
  return svg(W, H, body, '반도체 소부장 4개사 영업이익률 비교 막대그래프',
    '2026년 예상 영업이익률은 HPSP 54.8%, 한미반도체 약 50%, 리노공업 49.2%, ISC 25.7%로 HPSP가 가장 높다.');
}

// ── 9) 한미반도체 목표주가 편차 (레인지) ─────────────────────
function hanmiTarget() {
  const W = 760, H = 260, L = 60, R = 70, T = 110, B = 40;
  const pw = W - L - R, maxV = 45, k = pw / maxV; // 만원
  const lo = 18, hi = 42;
  let body = `<text class="title" x="${L}" y="38">한미반도체 목표주가 — 증권사끼리도 2.3배 차이</text>`;
  body += `<text class="sub" x="${L}" y="62">LS증권 18만 ~ 메릴린치 42만. '확실한 가치'가 아니라 'HBM4 발주 베팅'이라는 신호</text>`;
  const y = T + 8, bh = 40;
  for (let v = 0; v <= 45; v += 10) {
    const x = L + v * k;
    body += `<line class="grid" x1="${x}" y1="${T - 6}" x2="${x}" y2="${y + bh + 10}"/>`;
    body += `<text class="ax" x="${x}" y="${y + bh + 30}" text-anchor="middle">${v}만</text>`;
  }
  const x0 = L + lo * k, x1 = L + hi * k;
  body += `<rect class="s-mute" x="${x0}" y="${y}" width="${x1 - x0}" height="${bh}" rx="8"/>`;
  body += `<circle class="s-blue" cx="${x0}" cy="${y + bh / 2}" r="9"/>`;
  body += `<circle class="s-green" cx="${x1}" cy="${y + bh / 2}" r="9"/>`;
  body += `<text class="val" x="${x0}" y="${y - 12}" text-anchor="middle">18만 (LS증권)</text>`;
  body += `<text class="val" x="${x1}" y="${y - 12}" text-anchor="middle">42만 (메릴린치)</text>`;
  return svg(W, H, body, '한미반도체 증권사 목표주가 편차 그래프',
    '한미반도체 목표주가는 증권사에 따라 LS증권 18만원부터 메릴린치 42만원까지 약 2.3배 차이가 난다.');
}

await mkdir(OUT, { recursive: true });
await writeFile(OUT + 'pe-gap.svg', peGap());
await writeFile(OUT + 'rerating-upside.svg', upside());
await writeFile(OUT + 'tsmc-premium.svg', tsmc());
await writeFile(OUT + 'samsung-surprise.svg', samsungSurprise());
await writeFile(OUT + 'hbm-share.svg', hbmShare());
await writeFile(OUT + 'samsung-scenarios.svg', samsungScenarios());
await writeFile(OUT + 'hanmi-order.svg', hanmiOrder());
await writeFile(OUT + 'sobujang-opm.svg', sobujangOpm());
await writeFile(OUT + 'hanmi-target.svg', hanmiTarget());
console.log('✅ SVG 9종 생성 완료 (SK하이닉스3·삼성3·소부장3)');
