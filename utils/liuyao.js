// 六爻核心算法：投骰起卦、本卦/变卦、断卦选辞、纳甲六亲六神
const HEXAGRAMS = require('./liuyao-data.js');
const EXPLAIN = require('./liuyao-explain.js');

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI_ELEM = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
// 六神固定顺序
const SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

// 根据日期算日干（用于六神起例）
function dayGanIndex(date) {
  const d = date || new Date();
  const base = Date.UTC(2000, 0, 1); // 2000-01-01 为戊(4)日
  const diff = Math.floor((d.getTime() - base) / 86400000);
  return ((diff + 4) % 10 + 10) % 10;
}

// 一次投掷：三枚骰子，数阳(奇)个数
// 3阳->老阳(9,变) 2阳->少阴(8) 1阳->少阳(7) 0阳->老阴(6,变)
function castOnce() {
  const dice = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
  const odd = dice.filter(d => d % 2 === 1).length;
  let value, type, yang, changing;
  if (odd === 3) { value = 9; type = '老阳'; yang = true; changing = true; }
  else if (odd === 2) { value = 8; type = '少阴'; yang = false; changing = false; }
  else if (odd === 1) { value = 7; type = '少阳'; yang = true; changing = false; }
  else { value = 6; type = '老阴'; yang = false; changing = true; }
  return { dice, odd, value, type, yang, changing };
}

// 投一卦：6 次，自下而上
function castHexagram() {
  const lines = [];
  for (let i = 0; i < 6; i++) lines.push(castOnce());
  return lines;
}

// 爻位名称：初九/初六 ... 上九/上六
function lineLabel(index, yang) {
  const pos = index + 1;
  const name = yang ? '九' : '六';
  if (pos === 1) return '初' + name;   // 初九 / 初六
  if (pos === 6) return '上' + name;   // 上九 / 上六
  const posNames = ['', '', '二', '三', '四', '五'];
  return name + posNames[pos];         // 九二 / 九三 / 六四 ...（名在前、位在后）
}

function toBin(lines) {
  return lines.map(l => (l.yang ? 1 : 0));
}

function matchHexagram(bin) {
  return HEXAGRAMS.find(h => h.bin.join('') === bin.join(''));
}

// 变卦二进制：老阳->阳(1)，老阴->阴(0)
function changedBin(lines) {
  return lines.map(l => {
    if (l.value === 9) return 1;
    if (l.value === 6) return 0;
    return l.yang ? 1 : 0;
  });
}

// 六神：由日干定初爻所起之神，逐爻顺排
function sixGods(date) {
  const gi = dayGanIndex(date);
  // 甲乙青龙起 丙丁朱雀 戊勾陈 己螣蛇 庚辛白虎 壬癸玄武
  let start;
  if (gi === 0 || gi === 1) start = 0;       // 甲乙 -> 青龙
  else if (gi === 2 || gi === 3) start = 1;  // 丙丁 -> 朱雀
  else if (gi === 4) start = 2;              // 戊 -> 勾陈
  else if (gi === 5) start = 3;              // 己 -> 螣蛇
  else if (gi === 6 || gi === 7) start = 4;  // 庚辛 -> 白虎
  else start = 5;                            // 壬癸 -> 玄武
  const arr = [];
  for (let i = 0; i < 6; i++) arr.push(SHEN[(start + i) % 6]);
  return arr;
}

// 朱熹《启蒙》断卦：按变爻数选辞
// 返回 { rule, texts:[{source, title, text}] }
function selectInterpretation(primary, changed, lines) {
  const changingIdx = lines.map((l, i) => (l.changing ? i : -1)).filter(i => i >= 0);
  const n = changingIdx.length;
  const texts = [];
  let rule = '';

  if (n === 0) {
    rule = '六爻不变，以本卦卦辞断之';
    texts.push({ source: '本卦卦辞', title: primary.name + '·卦辞', text: primary.judgment, plain: EXPLAIN.explain[primary.n] });
  } else if (n === 1) {
    rule = '一爻变，以本卦变爻爻辞断之';
    const i = changingIdx[0];
    texts.push({ source: '本卦爻辞', title: primary.name + '·' + lineLabel(i, lines[i].yang), text: primary.lines[i], plain: EXPLAIN.line[primary.n][i] });
  } else if (n === 2) {
    rule = '两爻变，以本卦两变爻爻辞断之，以上者为主';
    // 以上爻(索引大)为主，先列下后列上
    const sorted = changingIdx.slice().sort((a, b) => a - b);
    sorted.forEach(i => {
      texts.push({ source: '本卦爻辞', title: primary.name + '·' + lineLabel(i, lines[i].yang), text: primary.lines[i], plain: EXPLAIN.line[primary.n][i] });
    });
    texts[texts.length - 1].primary = true;
  } else if (n === 3) {
    rule = '三爻变，以本卦与变卦卦辞断之，本卦为贞、变卦为悔';
    texts.push({ source: '本卦卦辞', title: primary.name + '·卦辞', text: primary.judgment, plain: EXPLAIN.explain[primary.n] });
    texts.push({ source: '变卦卦辞', title: changed.name + '·卦辞', text: changed.judgment, plain: EXPLAIN.explain[changed.n] });
  } else if (n === 4) {
    rule = '四爻变，以变卦两不变爻辞断之，以下者为主';
    const staticIdx = [0, 1, 2, 3, 4, 5].filter(i => !lines[i].changing);
    staticIdx.sort((a, b) => a - b);
    staticIdx.forEach(i => {
      texts.push({ source: '变卦爻辞', title: changed.name + '·' + lineLabel(i, changed.bin[i] === 1), text: changed.lines[i], plain: EXPLAIN.line[changed.n][i] });
    });
    texts[0].primary = true;
  } else if (n === 5) {
    rule = '五爻变，以变卦不变爻辞断之';
    const i = [0, 1, 2, 3, 4, 5].find(idx => !lines[idx].changing);
    texts.push({ source: '变卦爻辞', title: changed.name + '·' + lineLabel(i, changed.bin[i] === 1), text: changed.lines[i], plain: EXPLAIN.line[changed.n][i] });
  } else {
    rule = '六爻变，以变卦卦辞断之';
    let txt = changed.judgment;
    if (changed.n === 1) txt = '用九：见群龙无首，吉。';
    if (changed.n === 2) txt = '用六：利永贞。';
    texts.push({ source: '变卦卦辞', title: changed.name + '·卦辞', text: txt, plain: EXPLAIN.explain[changed.n] });
  }
  return { rule, texts, changingCount: n };
}

// 组装完整解卦结果
function analyze(lines, date) {
  const bin = toBin(lines);
  const primary = matchHexagram(bin);
  const cBin = changedBin(lines);
  const changed = matchHexagram(cBin);
  const gods = sixGods(date);

  // 每行展示数据
  const rows = lines.map((l, i) => {
    const yang = l.yang;
    return {
      index: i,
      label: lineLabel(i, yang),
      yang,
      value: l.value,
      type: l.type,
      changing: l.changing,
      dice: l.dice,
      na: primary.na[i],
      naElem: ZHI_ELEM[primary.na[i]],
      six: primary.six[i],
      god: gods[i],
      lineText: primary.lines[i],
    };
  });

  const interp = changed ? selectInterpretation(primary, changed, lines) : selectInterpretation(primary, primary, lines);

  return {
    primary,
    changed,
    hasChanged: !!changed && changingCount(lines) > 0,
    primaryPlain: EXPLAIN.explain[primary.n] || '',
    changedPlain: changed ? (EXPLAIN.explain[changed.n] || '') : '',
    lines,
    rows,
    interp,
    dayGan: GAN[dayGanIndex(date)],
  };
}

function changingCount(lines) {
  return lines.filter(l => l.changing).length;
}

function historyRecord(lines, result) {
  const p = result.primary;
  const c = result.changed;
  return {
    bin: toBin(lines),
    primaryName: p.name,
    primarySym: p.upSym + p.loSym,
    primaryUp: p.up, primaryLo: p.lo,
    changedName: c ? c.name : '',
    changedSym: c ? c.upSym + c.loSym : '',
    changingCount: changingCount(lines),
    rule: result.interp.rule,
    createdAt: new Date().getTime(),
  };
}

module.exports = {
  HEXAGRAMS,
  castOnce,
  castHexagram,
  lineLabel,
  toBin,
  matchHexagram,
  changedBin,
  sixGods,
  selectInterpretation,
  analyze,
  changingCount,
  historyRecord,
  dayGanIndex,
};
