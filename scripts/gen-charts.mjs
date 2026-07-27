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

// ── 10) [그림1] 순환 논증 vs 독립 신호 판별 (좌우 개념도) ──────
function peakSignals() {
  const W = 800, H = 470, pad = 24, gap = 20;
  const pw = (W - pad * 2 - gap) / 2;
  const px1 = pad, px2 = pad + pw + gap;
  const py = 84, phh = H - py - pad;
  let body = `<text class="title" x="${pad}" y="34">반도체 '고점'은 어떻게 판별하나</text>`;
  body += `<text class="sub" x="${pad}" y="56">주가로 고점을 말하면 순환 논증(왼쪽). 고점은 밸류체인 위 독립 신호로 판별한다(오른쪽).</text>`;

  // ── 왼쪽 패널: 순환 논증 (X) ──
  body += `<rect x="${px1}" y="${py}" width="${pw}" height="${phh}" rx="12" fill="var(--red)" opacity="0.06"/>`;
  body += `<rect x="${px1}" y="${py}" width="${pw}" height="${phh}" rx="12" fill="none" stroke="var(--axis)" stroke-width="1"/>`;
  body += `<text class="lbl" x="${px1 + pw / 2}" y="${py + 30}" text-anchor="middle" style="fill:var(--red)">순환 논증 (X)</text>`;
  const bx = px1 + 44, bw = pw - 88, bhh = 60;
  const topY = py + 70, botY = py + phh - 100;
  const rTop = topY + bhh, rBot = botY;
  // 두 박스
  body += `<rect x="${bx}" y="${topY}" width="${bw}" height="${bhh}" rx="10" fill="var(--surface)" stroke="var(--red)" stroke-width="1.5"/>`;
  body += `<text class="lbl" x="${bx + bw / 2}" y="${topY + bhh / 2 + 5}" text-anchor="middle">주가 하락 (셀온)</text>`;
  body += `<rect x="${bx}" y="${botY}" width="${bw}" height="${bhh}" rx="10" fill="var(--surface)" stroke="var(--red)" stroke-width="1.5"/>`;
  body += `<text class="lbl" x="${bx + bw / 2}" y="${botY + bhh / 2 + 5}" text-anchor="middle">반도체 고점</text>`;
  // 순환 화살표(오른쪽 아래로, 왼쪽 위로)
  const rx = bx + bw;
  body += `<path d="M${rx} ${rTop + 6} C ${rx + 40} ${rTop + 24}, ${rx + 40} ${rBot - 24}, ${rx} ${rBot - 6}" fill="none" stroke="var(--red)" stroke-width="2"/>`;
  body += `<polygon points="${rx - 6},${rBot - 16} ${rx + 6},${rBot - 16} ${rx},${rBot - 4}" fill="var(--red)"/>`;
  body += `<path d="M${bx} ${rBot - 6} C ${bx - 40} ${rBot - 24}, ${bx - 40} ${rTop + 24}, ${bx} ${rTop + 6}" fill="none" stroke="var(--red)" stroke-width="2"/>`;
  body += `<polygon points="${bx - 6},${rTop + 16} ${bx + 6},${rTop + 16} ${bx},${rTop + 4}" fill="var(--red)"/>`;
  // 중앙 무한루프 표시
  const cy = (rTop + rBot) / 2;
  body += `<text x="${bx + bw / 2}" y="${cy + 4}" text-anchor="middle" style="fill:var(--red);font:700 34px system-ui;opacity:0.55">↻</text>`;
  body += `<text class="sub" x="${bx + bw / 2}" y="${cy + 26}" text-anchor="middle" style="fill:var(--red)">닫힌 순환 = 동어반복</text>`;

  // ── 오른쪽 패널: 독립 신호 판별 (O) ──
  body += `<rect x="${px2}" y="${py}" width="${pw}" height="${phh}" rx="12" fill="var(--green)" opacity="0.06"/>`;
  body += `<rect x="${px2}" y="${py}" width="${pw}" height="${phh}" rx="12" fill="none" stroke="var(--axis)" stroke-width="1"/>`;
  body += `<text class="lbl" x="${px2 + pw / 2}" y="${py + 30}" text-anchor="middle" style="fill:var(--green)">독립 신호 판별 (O)</text>`;
  const sig = [
    { n: '①', t: '현물가·고정거래가', a: '↑', s: '상승', c: 'green' },
    { n: '②', t: '재고(DIO)', a: '↓', s: '타이트', c: 'green' },
    { n: '③', t: '가동률·CAPEX', a: '↑', s: '주의', c: 'orange' },
    { n: '④', t: 'HBM 수급', a: '↑', s: '타이트', c: 'green' },
    { n: '⑤', t: 'AI 수요', a: '↑', s: '급증', c: 'green' },
  ];
  const ry0 = py + 76, rgap = (phh - 106) / 4;
  sig.forEach((g, i) => {
    const yy = ry0 + i * rgap;
    body += `<circle cx="${px2 + 30}" cy="${yy - 4}" r="15" fill="var(--surface)" stroke="var(--axis)" stroke-width="1"/>`;
    body += `<text class="lbl" x="${px2 + 30}" y="${yy + 1}" text-anchor="middle">${g.n}</text>`;
    body += `<text class="lbl" x="${px2 + 56}" y="${yy}" >${g.t}</text>`;
    body += `<text class="val" x="${px2 + pw - 18}" y="${yy}" text-anchor="end" style="fill:var(--${g.c})">${g.a} ${g.s}</text>`;
  });
  body += `<text class="sub" x="${px2 + 18}" y="${py + phh - 14}">③ CAPEX만 '주의'(양날의 칼) · 나머지는 확장 국면</text>`;

  return svg(W, H, body, '반도체 고점 판별의 두 접근 대비 개념도',
    "왼쪽은 '주가 하락(셀온)'과 '반도체 고점'이 서로를 근거로 삼는 닫힌 순환 논증을 보여주고, 오른쪽은 ①현물가·고정거래가 상승 ②재고(DIO) 타이트 ③가동률·CAPEX 주의 ④HBM 수급 타이트 ⑤AI 수요 급증이라는 5개 독립 신호로 사이클 국면을 판별하는 신호판을 보여준다. CAPEX만 주의(노랑), 나머지는 확장 국면(녹색).");
}

// ── 11) [그림2] DRAM 고정거래가 & 하이퍼스케일러 CAPEX (이중 차트) ─
function dramPriceAiCapex() {
  const W = 820, H = 430, T = 110, B = 64;
  const ph = H - T - B, base = T + ph;
  const half = W / 2;
  const defs = `<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
    + `<rect width="8" height="8" fill="var(--mute)"/><line x1="0" y1="0" x2="0" y2="8" stroke="var(--blue)" stroke-width="3"/></pattern></defs>`;
  let body = defs;
  body += `<text class="title" x="24" y="34">가격은 여전히 상승 방향, 전방 수요는 폭발</text>`;
  body += `<text class="sub" x="24" y="56">두 독립 신호(현물가·AI CAPEX) 모두 '중간 조정' 쪽을 가리킨다.</text>`;

  // ── 왼쪽: DRAM 고정거래가 QoQ ──
  const L1 = 52, R1 = half - 24, maxV1 = 60, k1 = ph / maxV1;
  body += `<text class="lbl" x="${L1}" y="88">DRAM 고정거래가 (QoQ %)</text>`;
  for (let v = 0; v <= 60; v += 20) {
    const y = base - v * k1;
    body += `<line class="grid" x1="${L1}" y1="${y}" x2="${R1}" y2="${y}"/>`;
    body += `<text class="ax" x="${L1 - 8}" y="${y + 4}" text-anchor="end">+${v}</text>`;
  }
  body += `<line class="base" x1="${L1}" y1="${base}" x2="${R1}" y2="${base}"/>`;
  const bars1 = [
    { label: '2025 4Q', sub: '실적', v: 50, t: '+50%', hatch: false },
    { label: '2026 3Q', sub: '전망', v: 15, t: '+10~20%', hatch: true },
  ];
  const pw1 = R1 - L1, bw1 = 96;
  bars1.forEach((b, i) => {
    const cx = L1 + pw1 * (i + 0.5) / bars1.length;
    const h = b.v * k1;
    if (b.hatch) {
      body += `<path fill="url(#hatch)" stroke="var(--blue)" stroke-width="1.5" stroke-dasharray="5 4" d="M${cx - bw1 / 2} ${base} V${base - h + 4} q0 -4 4 -4 h${bw1 - 8} q4 0 4 4 V${base} Z"/>`;
    } else {
      body += vbar(cx - bw1 / 2, base - h, bw1, h, 's-blue');
    }
    body += `<text class="val" x="${cx}" y="${base - h - 10}" text-anchor="middle">${b.t}</text>`;
    body += `<text class="lbl" x="${cx}" y="${base + 26}" text-anchor="middle">${b.label}</text>`;
    body += `<text class="sub" x="${cx}" y="${base + 44}" text-anchor="middle">${b.sub}</text>`;
  });
  // 상반기 상승 지속 주석(두 막대 사이)
  body += `<text class="sub" x="${L1 + pw1 / 2}" y="${T + 30}" text-anchor="middle" style="fill:var(--aqua)">↗ 2026 상반기도 상승 지속</text>`;

  // ── 오른쪽: 하이퍼스케일러 CAPEX ──
  const L2 = half + 56, R2 = W - 24, maxV2 = 700, k2 = ph / maxV2;
  body += `<text class="lbl" x="${L2}" y="88">하이퍼스케일러 CAPEX 합계 ($B)</text>`;
  for (let v = 0; v <= 600; v += 200) {
    const y = base - v * k2;
    body += `<line class="grid" x1="${L2}" y1="${y}" x2="${R2}" y2="${y}"/>`;
    body += `<text class="ax" x="${L2 - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  body += `<line class="base" x1="${L2}" y1="${base}" x2="${R2}" y2="${base}"/>`;
  const bars2 = [
    { label: '2025', sub: '실적(record)', v: 388, t: '$388B', cls: 's-mute' },
    { label: '2026', sub: '전망', v: 630, t: '$630B', cls: 's-aqua' },
  ];
  const pw2 = R2 - L2, bw2 = 96;
  const cxs = [];
  const tops = [];
  bars2.forEach((b, i) => {
    const cx = L2 + pw2 * (i + 0.5) / bars2.length;
    const h = b.v * k2;
    body += vbar(cx - bw2 / 2, base - h, bw2, h, b.cls);
    body += `<text class="val" x="${cx}" y="${base - h - 10}" text-anchor="middle">${b.t}</text>`;
    body += `<text class="lbl" x="${cx}" y="${base + 26}" text-anchor="middle">${b.label}</text>`;
    body += `<text class="sub" x="${cx}" y="${base + 44}" text-anchor="middle">${b.sub}</text>`;
    cxs.push(cx); tops.push(base - h);
  });
  // +60% 증가율 브래킷
  const by = Math.min(...tops) - 34;
  body += `<path d="M${cxs[0]} ${by + 10} V${by} H${cxs[1]} V${by + 10}" fill="none" stroke="var(--aqua)" stroke-width="1.5"/>`;
  body += `<text class="val" x="${(cxs[0] + cxs[1]) / 2}" y="${by - 6}" text-anchor="middle" style="fill:var(--aqua)">약 +60%</text>`;

  body += `<text class="sub" x="24" y="${H - 16}">※ 2026년 수치는 전망치·추정이며 재확인 필요 · 출처: 시장조사기관·업계 집계</text>`;

  return svg(W, H, body, 'DRAM 고정거래가와 하이퍼스케일러 AI CAPEX 이중 차트',
    'DRAM 고정거래가는 2025년 4분기 전분기 대비 +50% 급등(실적)한 데 이어 2026년 3분기에도 +10~20% 상승(전망)이 예상된다. 글로벌 하이퍼스케일러 CAPEX 합계는 2025년 약 3,880억 달러에서 2026년 약 6,300억 달러로 약 +60% 증가할 전망이다. 두 신호 모두 사이클 중간 조정 쪽을 가리킨다. 2026년 수치는 추정치.');
}

// ── 12) [커버] 반도체 고점 논란 (기존 cover-* 규격 1200×675) ────
function coverPeak() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="반도체 고점 논란 — 셀온은 고점의 증거가 아니다">
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
<rect class="bg" width="1200" height="675"/>
<circle class="blob" cx="1040" cy="130" r="250"/>
<path d="M0 470 L150 430 L300 500 L450 360 L600 520 L750 300 L900 470 L1050 250 L1200 330 L1200 675 L0 675 Z" fill="url(#g)"/>
<path d="M0 470 L150 430 L300 500 L450 360 L600 520 L750 300 L900 470 L1050 250 L1200 330" class="line"/>
<text x="80" y="132" class="eye">산업 분석 · 반도체 사이클</text>
<text x="80" y="292" class="ttl">반도체 고점 논란</text><text x="80" y="374" class="ttl">셀온은 고점의 증거가 아니다</text>
<rect class="tkrbox" x="80" y="556" width="160" height="44" rx="22"/>
<text x="104" y="585" class="tkr">000660</text>
<rect class="tkrbox" x="256" y="556" width="160" height="44" rx="22"/>
<text x="280" y="585" class="tkr">005930</text>
<text x="1120" y="620" text-anchor="end" class="brand">아웃베스트의 투자로그</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
await writeFile(OUT + 'peak-signals.svg', peakSignals());
await writeFile(OUT + 'dram-price-aicapex.svg', dramPriceAiCapex());
await writeFile(OUT + 'cover-peak.svg', coverPeak());
await writeFile(OUT + 'pe-gap.svg', peGap());
await writeFile(OUT + 'rerating-upside.svg', upside());
await writeFile(OUT + 'tsmc-premium.svg', tsmc());
await writeFile(OUT + 'samsung-surprise.svg', samsungSurprise());
await writeFile(OUT + 'hbm-share.svg', hbmShare());
await writeFile(OUT + 'samsung-scenarios.svg', samsungScenarios());
await writeFile(OUT + 'hanmi-order.svg', hanmiOrder());
await writeFile(OUT + 'sobujang-opm.svg', sobujangOpm());
await writeFile(OUT + 'hanmi-target.svg', hanmiTarget());
console.log('✅ SVG 생성 완료 (SK하이닉스3·삼성3·소부장3 + 반도체고점 그림2·커버1)');
