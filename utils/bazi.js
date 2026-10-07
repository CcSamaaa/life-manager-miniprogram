// 八字（四柱）专业排盘算法 —— 纯本地计算，不联网
// 覆盖范围：公历 1901-2099 年（节气用通用寿星公式推算）
// 功能：四柱 + 十神 + 藏干 + 十二长生 + 空亡 + 纳音 + 神煞

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 天干五行 / 地支本气五行
const GAN_ELEM = ['木', '火', '土', '金', '水', '木', '火', '土', '金', '水'];
const ZHI_ELEM = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

// 天干阴阳（0=阳，1=阴）
const GAN_YANG = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

// ==================== 藏干（地支藏天干）====================
// 每个地支藏的天干，按主气→中气→余气排列
const HIDDEN_STEMS = {
  子: [{ gan: '癸', elem: '水' }],
  丑: [{ gan: '己', elem: '土' }, { gan: '癸', elem: '水' }, { gan: '辛', elem: '金' }],
  寅: [{ gan: '甲', elem: '木' }, { gan: '丙', elem: '火' }, { gan: '戊', elem: '土' }],
  卯: [{ gan: '乙', elem: '木' }],
  辰: [{ gan: '戊', elem: '土' }, { gan: '乙', elem: '木' }, { gan: '癸', elem: '水' }],
  巳: [{ gan: '丙', elem: '火' }, { gan: '庚', elem: '金' }, { gan: '戊', elem: '土' }],
  午: [{ gan: '丁', elem: '火' }, { gan: '己', elem: '土' }],
  未: [{ gan: '己', elem: '土' }, { gan: '丁', elem: '火' }, { gan: '乙', elem: '木' }],
  申: [{ gan: '庚', elem: '金' }, { gan: '壬', elem: '水' }, { gan: '戊', elem: '土' }],
  酉: [{ gan: '辛', elem: '金' }],
  戌: [{ gan: '辛', elem: '金' }, { gan: '丁', elem: '火' }, { gan: '戊', elem: '土' }],
  亥: [{ gan: '壬', elem: '水' }, { gan: '甲', elem: '木' }]
};

// ==================== 十神（相对日主）====================
// 日主天干索引 → 该天干的十神名称映射表
// key = (目标天干索引 - 日主索引 + 10) % 10 + (是否同阴阳 ? 0 : 10)
const TEN_GODS_MAP = [
  // 日主=甲(0)
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印',
  // 异阴阳
  '劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印'
];
// 以上是简化版，下面用通用函数

function getTenGod(dayGanIdx, targetGanIdx) {
  const dayElem = GAN_ELEM[dayGanIdx];
  const tgtElem = GAN_ELEM[targetGanIdx];
  const dayYang = GAN_YANG[dayGanIdx];
  const tgtYang = GAN_YANG[targetGanIdx];
  const sameYang = (dayYang === tgtYang);

  if (dayElem === tgtElem) {
    return sameYang ? '比肩' : '劫财';
  }
  // 我生
  if ((dayElem === '木' && tgtElem === '火') ||
      (dayElem === '火' && tgtElem === '土') ||
      (dayElem === '土' && tgtElem === '金') ||
      (dayElem === '金' && tgtElem === '水') ||
      (dayElem === '水' && tgtElem === '木')) {
    return sameYang ? '食神' : '伤官';
  }
  // 生我
  if ((tgtElem === '木' && dayElem === '火') ||
      (tgtElem === '火' && dayElem === '土') ||
      (tgtElem === '土' && dayElem === '金') ||
      (tgtElem === '金' && dayElem === '水') ||
      (tgtElem === '水' && dayElem === '木')) {
    return sameYang ? '偏印' : '正印';
  }
  // 我克
  if ((dayElem === '木' && tgtElem === '土') ||
      (dayElem === '火' && tgtElem === '金') ||
      (dayElem === '土' && tgtElem === '水') ||
      (dayElem === '金' && tgtElem === '木') ||
      (dayElem === '水' && tgtElem === '火')) {
    return sameYang ? '偏财' : '正财';
  }
  // 克我
  return sameYang ? '七杀' : '正官';
}

// ==================== 十二长生 ====================
// 五行（对应天干）在十二地支的长生状态
// 索引顺序：子丑寅卯辰巳午未申酉戌亥
const TWELVE_LIFE = {
  // 甲木
  0: ['绝', '养', '胎', '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓'],
  // 乙木
  1: ['墓', '死', '病', '衰', '帝旺', '临官', '冠带', '沐浴', '长生', '胎', '养', '绝'],
  // 丙火
  2: ['沐浴', '病', '衰', '帝旺', '临官', '冠带', '长生', '养', '胎', '绝', '死', '墓'],
  // 丁火
  3: ['墓', '死', '病', '衰', '帝旺', '临官', '冠带', '沐浴', '长生', '胎', '养', '绝'],
  // 戊土（同火）
  4: ['沐浴', '病', '衰', '帝旺', '临官', '冠带', '长生', '养', '胎', '绝', '死', '墓'],
  // 己土（同火）
  5: ['墓', '死', '病', '衰', '帝旺', '临官', '冠带', '沐浴', '长生', '胎', '养', '绝'],
  // 庚金
  6: ['胎', '绝', '死', '墓', '养', '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病'],
  // 辛金
  7: ['病', '衰', '帝旺', '临官', '冠带', '沐浴', '长生', '养', '胎', '绝', '死', '墓'],
  // 壬水
  8: ['临官', '帝旺', '衰', '病', '死', '墓', '绝', '养', '胎', '长生', '沐浴', '冠带'],
  // 癸水
  9: ['冠带', '沐浴', '长生', '胎', '养', '绝', '墓', '死', '病', '衰', '帝旺', '临官']
};

function getTwelveLife(ganIdx, zhiIdx) {
  return TWELVE_LIFE[ganIdx][zhiIdx];
}

// 十二长生中英映射（用于 CSS 类名，KOSS 不支持中文选择器）
const LIFE_EN_MAP = {
  '绝': 'dead', '养': 'nurture', '胎': 'fetus', '长生': 'birth',
  '沐浴': 'bath', '冠带': 'crown', '临官': 'official', '帝旺': 'peak',
  '衰': 'decline', '病': 'sick', '死': 'die', '墓': 'tomb'
};

// ==================== 纳音（六十甲子纳音）====================
// 按 60 甲子顺序排列的纳音
const NAYIN_LIST = [
  '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木',
  '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火',
  '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金',
  '杨柳木', '杨柳木', '泉中水', '泉中水', '屋上土', '屋上土',
  '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
  '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木',
  '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火',
  '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金',
  '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土',
  '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
];

function getNayin(ganIdx, zhiIdx) {
  // 计算 60 甲子序号
  let idx = ganIdx; // 天干决定起始
  // 找到该干支配对在 60 甲子中的位置
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIdx && i % 12 === zhiIdx) {
      return NAYIN_LIST[i];
    }
  }
  return '';
}

// ==================== 空亡 ====================
// 日柱/年柱地支推算空亡
function getVoid(yearZhiIdx, dayZhiIdx) {
  // 用年柱推算
  const voidPairs = [
    [0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11] // 子丑, 寅卯, ...
  ];
  const voidStart = (yearZhiIdx % 12);
  // 空亡从 (12 - 年支) % 12 开始数两支... 实际算法：
  // 以年柱地支起子，逆数至日柱地支，再顺数两位即为空亡
  // 简化版：用日柱地支找空亡
  const voidBase = (dayZhiIdx + 1) % 12;
  return [voidBase, (voidBase + 1) % 12];
}

// 更准确的空亡算法：以日柱为准
function calcVoid(dayGanIdx, dayZhiOrIdx) {
  const dayZhiIdx = typeof dayZhiOrIdx === 'number' ? dayZhiOrIdx : ZHI.indexOf(dayZhiOrIdx);
  // 十个天干配十二地支，缺的两支就是空亡
  // 从日柱天干对应的"旬首"算起
  const xunStart = (Math.floor(dayGanIdx / 2)) * 2; // 旬首天干索引（甲/己/乙/庚/丙/辛/丁/壬/戊/癸 → 0/0/2/2/4/4/6/6/8/8）
  const xunZhiStart = (xunStart % 12); // 旬首地支近似
  // 60 甲子每旬管 10 个干支，缺 2 支
  // 旬首地支 = (旬首天干 - 旬内序号 + 12) % 12 ... 太复杂，直接查表
  // 60 甲子六旬：
  // 甲子旬(空 戌亥), 甲戌旬(空 申酉), 甲申旬(空 午未),
  // 甲午旬(空 辰巳), 甲辰旬(空 寅卯), 甲寅旬(空 子丑)
  const xunIdx = Math.floor(((dayGanIdx * 6 - dayZhiIdx * 5) % 60 + 60) % 60 / 10);
  const voidMap = [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]]; // 戌亥, 申酉, 午未, 辰巳, 寅卯, 子丑
  return voidMap[xunIdx % 6];
}

// ==================== 神煞 ====================
function calcShenSha(pillars, dayGanIdx, gender) {
  const shaList = [];
  const dayGan = GAN[dayGanIdx];
  const dayElem = GAN_ELEM[dayGanIdx];
  const yearGan = pillars[0].gan;
  const yearZhi = pillars[0].zhi;
  const monthZhi = pillars[1].zhi;
  const dayZhi = pillars[2].zhi;
  const hourZhi = pillars[3].zhi;

  const allZhi = [yearZhi, monthZhi, dayZhi, hourZhi];
  const allGan = [pillars[0].gan, pillars[1].gan, pillars[2].gan, pillars[3].gan];

  // --- 天乙贵人 ---
  const tianyiTable = {
    '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '戊': ['丑', '未'], '己': ['子', '申'], '庚': ['丑', '未'], '辛': ['寅', '午'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳']
  };
  const tianyi = tianyiTable[dayGan] || [];
  allZhi.forEach((z, i) => {
    if (tianyi.indexOf(z) >= 0) shaList.push({ name: '天乙贵人', pos: i });
  });

  // --- 德秀贵人 ---
  // 春季出生(寅卯月)天干为德，夏季为秀...
  // 简化：天德贵人
  const tiandeTable = {
    '甲': ['丁'], '乙': ['申'], '丙': ['亥'], '丁': ['壬'],
    '戊': ['癸'], '己': ['寅'], '庚': ['丙'], '辛': ['亥'],
    '壬': ['巳'], '癸': ['申']
  };
  allGan.forEach((g, i) => {
    const td = tiandeTable[g] || [];
    // 月支中有对应天德
    if (td.some(t => HIDDEN_STEMS[monthZhi] && HIDDEN_STEMS[monthZhi].some(h => h.gan === t))) {
      shaList.push({ name: '德秀贵人', pos: i });
    }
  });

  // --- 文昌贵人 ---
  const wenchangTable = {
    '甲': ['巳'], '乙': ['午'], '丙': ['申'], '丁': ['酉'],
    '戊': ['申'], '己': ['酉'], '庚': ['亥'], '辛': ['子'],
    '壬': ['寅'], '癸': ['卯']
  };
  const wc = wenchangTable[dayGan] || [];
  allZhi.forEach((z, i) => {
    if (wc.indexOf(z) >= 0) shaList.push({ name: '文昌贵人', pos: i });
  });

  // --- 驿马 ---
  // 申子辰马在寅, 寅午戌马在申, 巳酉丑马在亥, 亥卯未马在巳
  const yimaRules = [
    { targets: ['申', '子', '辰'], ma: '寅' },
    { targets: ['寅', '午', '戌'], ma: '申' },
    { targets: ['巳', '酉', '丑'], ma: '亥' },
    { targets: ['亥', '卯', '未'], ma: '巳' }
  ];
  yimaRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      // 时柱为驿马
      if (hourZhi === rule.ma) shaList.push({ name: '驿马', pos: 3 });
    }
  });

  // --- 桃花 ---
  const taohuaRules = [
    { targets: ['申', '子', '辰'], flower: '酉' },
    { targets: ['寅', '午', '戌'], flower: '卯' },
    { targets: ['巳', '酉', '丑'], flower: '午' },
    { targets: ['亥', '卯', '未'], flower: '子' }
  ];
  taohuaRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      allZhi.forEach((z, i) => {
        if (z === rule.flower) shaList.push({ name: '桃花', pos: i });
      });
    }
  });

  // --- 华盖 ---
  const huagaiRules = [
    { targets: ['申', '子', '辰'], gai: '辰' },
    { targets: ['寅', '午', '戌'], gai: '戌' },
    { targets: ['巳', '酉', '丑'], gai: '丑' },
    { targets: ['亥', '卯', '未'], gai: '未' }
  ];
  huagaiRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      allZhi.forEach((z, i) => {
        if (z === rule.gai) shaList.push({ name: '华盖', pos: i });
      });
    }
  });

  // --- 羊刃 ---
  const yangrenTable = {
    '甲': ['卯'], '乙': ['辰'], '丙': ['午'], '丁': ['未'],
    '戊': ['午'], '己': '未', '庚': ['酉'], '辛': ['戌'],
    '壬': ['子'], '癸': ['丑']
  };
  const yr = yangrenTable[dayGan];
  if (yr) {
    const yrArr = Array.isArray(yr) ? yr : [yr];
    allZhi.forEach((z, i) => {
      if (yrArr.indexOf(z) >= 0) shaList.push({ name: '羊刃', pos: i });
    });
  }

  // --- 红鸾 ---
  const hongluanTable = { '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌', '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰' };
  const hl = hongluanTable[yearZhi];
  if (hl) {
    allZhi.forEach((z, i) => {
      if (z === hl) shaList.push({ name: '红鸾', pos: i });
    });
  }

  // --- 天医 ---
  const tianyiMed = { '子': '丑', '丑': '寅', '寅': '卯', '卯': '辰', '辰': '巳', '巳': '午', '午': '未', '未': '申', '申': '酉', '酉': '戌', '戌': '亥', '亥': '子' };
  const ty = tianyiMed[monthZhi];
  if (ty) {
    allZhi.forEach((z, i) => {
      if (z === ty) shaList.push({ name: '天医', pos: i });
    });
  }

  // --- 血刃（羊刃变体）---
  allZhi.forEach((z, i) => {
    if (yr && (Array.isArray(yr) ? yr.indexOf(z) >= 0 : z === yr)) {
      if (i === 2) shaList.push({ name: '血刃', pos: i }); // 日柱
    }
  });

  // --- 金舆 ---
  const jinyuTable = { '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未', '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅' };
  const jy = jinyuTable[dayGan];
  if (jy) {
    allZhi.forEach((z, i) => {
      if (z === jy) shaList.push({ name: '金舆', pos: i });
    });
  }

  // --- 天厨贵人 ---
  const tianchuTable = { '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' };
  const tc = tianchuTable[dayGan];
  if (tc) {
    allZhi.forEach((z, i) => {
      if (z === tc) shaList.push({ name: '天厨贵人', pos: i });
    });
  }

  // --- 太极贵人 ---
  const taijiTable = {
    '甲': ['子', '午'], '乙': ['子', '午'], '丙': ['卯', '酉'],
    '丁': ['卯', '酉'], '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
    '庚': ['亥', '未'], '辛': ['亥', '未'], '壬': ['寅', '申'], '癸': ['寅', '申']
  };
  const tj = taijiTable[dayGan] || [];
  allZhi.forEach((z, i) => {
    if (tj.indexOf(z) >= 0) shaList.push({ name: '太极贵人', pos: i });
  });

  // --- 孤鸾煞 ---
  const gulyanStems = ['甲', '丙', '戊', '庚', '壬']; // 阳干
  const gulyanZhis = ['寅', '午', '卯', '丑', '戌'];
  if (gulyanStems.indexOf(dayGan) >= 0) {
    const idx = gulyanStems.indexOf(dayGan);
    if (dayZhi === gulyanZhis[idx]) shaList.push({ name: '孤鸾煞', pos: 2 });
  } else {
    const yinStems = ['乙', '丁', '己', '辛', '癸'];
    const yinZhis = ['申', '酉', '戌', '亥', '巳'];
    const idx2 = yinStems.indexOf(dayGan);
    if (idx2 >= 0 && dayZhi === yinZhis[idx2]) shaList.push({ name: '孤鸾煞', pos: 2 });
  }

  // --- 十灵日 ---
  const shilingDays = ['甲辰', '丁亥', '庚辰', '辛巳', '壬寅', '癸未', '乙丑', '丙戌', '戊申', '己卯'];
  const dayPillar = dayGan + dayZhi;
  if (shilingDays.indexOf(dayPillar) >= 0) shaList.push({ name: '十灵日', pos: 2 });

  // --- 将星 ---
  const jiangxingRules = [
    { targets: ['申', '子', '辰'], star: '子' },
    { targets: ['寅', '午', '戌'], star: '午' },
    { targets: ['巳', '酉', '丑'], star: '酉' },
    { targets: ['亥', '卯', '未'], star: '卯' }
  ];
  jiangxingRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      allZhi.forEach((z, i) => {
        if (z === rule.star) shaList.push({ name: '将星', pos: i });
      });
    }
  });

  // --- 披麻 ---
  const pimaRules = [
    { targets: ['申', '子', '辰'], pi: '寅' },
    { targets: ['寅', '午', '戌'], pi: '申' },
    { targets: ['巳', '酉', '丑'], pi: '亥' },
    { targets: ['亥', '卯', '未'], pi: '巳' }
  ];
  pimaRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      allZhi.forEach((z, i) => {
        if (z === rule.pi) shaList.push({ name: '披麻', pos: i });
      });
    }
  });

  // --- 吊客 ---
  const diaokeRules = [
    { targets: ['申', '子', '辰'], diao: '戌' },
    { targets: ['寅', '午', '戌'], diao: '辰' },
    { targets: ['巳', '酉', '丑'], diao: '丑' },
    { targets: ['亥', '卯', '未'], diao: '未' }
  ];
  diaokeRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      allZhi.forEach((z, i) => {
        if (z === rule.diao) shaList.push({ name: '吊客', pos: i });
      });
    }
  });

  // --- 寡宿 ---
  const guasuRules = [
    { targets: ['申', '子', '辰'], gua: '丑' },
    { targets: ['寅', '午', '戌'], gua: '未' },
    { targets: ['巳', '酉', '丑'], gua: '辰' },
    { targets: ['亥', '卯', '未'], gua: '戌' }
  ];
  guasuRules.forEach(rule => {
    if ([yearZhi, monthZhi, dayZhi].some(z => rule.targets.indexOf(z) >= 0)) {
      allZhi.forEach((z, i) => {
        if (z === rule.gua) shaList.push({ name: '寡宿', pos: i });
      });
    }
  });

  // --- 六秀日 ---
  const liuxiuDays = ['子', '午', '卯', '酉', '辰', '戌', '丑', '未', '寅', '申', '巳', '亥'];
  // 六秀日即日支在某些组合下
  // 简化：子午卯酉为四正之地，辰戌丑未为四库
  if (['子', '午', '卯', '酉'].indexOf(dayZhi) >= 0) {
    shaList.push({ name: '六秀日', pos: 2 });
  }

  // --- 九丑日 ---
  const jiuchouDays = ['乙丑', '乙未', '戊子', '戊午', '癸丑', '癸未', '甲子', '甲午', '己丑', '己未'];
  if (jiuchouDays.indexOf(dayPillar) >= 0) shaList.push({ name: '九丑日', pos: 2 });

  // --- 地转日 ---
  // 日柱特定组合
  const dizhuanDays = ['戊午', '癸亥', '壬戌', '丁卯'];
  if (dizhuanDays.indexOf(dayPillar) >= 0) shaList.push({ name: '地转日', pos: 2 });

  // --- 空亡标记 ---
  const voidPair = calcVoid(GAN.indexOf(dayGan), ZHI.indexOf(dayZhi));
  allZhi.forEach((z, i) => {
    if (voidPair.indexOf(ZHI.indexOf(z)) >= 0) shaList.push({ name: '空亡', pos: i });
  });

  return shaList;
}

// ==================== 基础计算（原有）====================

// 12 个「节」（每月起始节气）对应公历月份（0-based）
const TERM_MONTH = {
  小寒: 0, 立春: 1, 惊蛰: 2, 清明: 3, 立夏: 4,
  芒种: 5, 小暑: 6, 立秋: 7, 白露: 8, 寒露: 9, 立冬: 10, 大雪: 11
};
// 寿星公式 C 值（21 世纪 / 20 世纪）
const TERM_C_21 = { 小寒: 5.4055, 立春: 3.87, 惊蛰: 5.63, 清明: 4.81, 立夏: 5.52, 芒种: 5.678, 小暑: 7.108, 立秋: 7.5, 白露: 7.646, 寒露: 8.318, 立冬: 7.438, 大雪: 7.18 };
const TERM_C_20 = { 小寒: 6.11, 立春: 4.6295, 惊蛰: 6.3826, 清明: 5.59, 立夏: 6.318, 芒种: 6.5, 小暑: 7.928, 立秋: 8.35, 白露: 8.44, 寒露: 9.098, 立冬: 8.218, 大雪: 7.9 };

// 计算某年某「节」落在几号（返回 Date）
function termDate(year, name) {
  const Y = year % 100;
  const C = year >= 2000 ? TERM_C_21[name] : TERM_C_20[name];
  const L = Math.floor(Y / 4);
  const day = Math.floor(Y * 0.2422 + C) - L;
  return new Date(year, TERM_MONTH[name], day);
}

// 五虎遁：年干 → 寅月天干索引
function yearGanToYinGan(yearGan) {
  const map = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
  return map[yearGan];
}
// 五鼠遁：日干 → 子时天干索引
function dayGanToZiGan(dayGan) {
  const map = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 };
  return map[dayGan];
}

// 儒略日数（用于日柱）
function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function compute(input) {
  const { year, month, day, hour, gender } = input;
  const birth = new Date(year, month - 1, day, hour || 0, input.minute || 0);

  // —— 年柱（立春为界）——
  const lichun = termDate(year, '立春');
  const effYear = birth < lichun ? year - 1 : year;
  const yearGan = ((effYear - 4) % 10 + 10) % 10;
  const yearZhi = ((effYear - 4) % 12 + 12) % 12;

  // —— 月柱 ——
  const seq = [
    { zhi: 2, term: termDate(effYear, '立春') },
    { zhi: 3, term: termDate(effYear, '惊蛰') },
    { zhi: 4, term: termDate(effYear, '清明') },
    { zhi: 5, term: termDate(effYear, '立夏') },
    { zhi: 6, term: termDate(effYear, '芒种') },
    { zhi: 7, term: termDate(effYear, '小暑') },
    { zhi: 8, term: termDate(effYear, '立秋') },
    { zhi: 9, term: termDate(effYear, '白露') },
    { zhi: 10, term: termDate(effYear, '寒露') },
    { zhi: 11, term: termDate(effYear, '立冬') },
    { zhi: 0, term: termDate(effYear, '大雪') },
    { zhi: 1, term: termDate(effYear + 1, '小寒') }
  ];
  let monthZhi = 1;
  for (let i = seq.length - 1; i >= 0; i--) {
    if (birth >= seq[i].term) { monthZhi = seq[i].zhi; break; }
  }
  const monthGan = (yearGanToYinGan(yearGan) + ((monthZhi - 2 + 12) % 12)) % 10;

  // —— 日柱 ——
  const idx = ((jdn(year, month, day) + 49) % 60 + 60) % 60;
  const dayGan = idx % 10;
  const dayZhi = idx % 12;

  // —— 时柱 ——
  const h = hour || 0;
  const hourZhi = Math.floor((h + 1) / 2) % 12;
  const hourGan = (dayGanToZiGan(dayGan) + hourZhi) % 10;

  // —— 构建四柱数组 ——
  const ganIdxs = [yearGan, monthGan, dayGan, hourGan];
  const zhiIdxs = [yearZhi, monthZhi, dayZhi, hourZhi];

  const pillars = ganIdxs.map((gi, i) => ({
    label: ['年', '月', '日', '时'][i],
    gan: GAN[gi],
    zhi: ZHI[zhiIdxs[i]],
    ganIdx: gi,
    zhiIdx: zhiIdxs[i],
    ganElem: GAN_ELEM[gi],
    zhiElem: ZHI_ELEM[zhiIdxs[i]]
  }));

  // —— 十神（每柱天干+藏干各算十神）——
  const mainGods = ganIdxs.map(gi => getTenGod(dayGan, gi));

  // —— 藏干 + 藏干十神 ——
  const hiddenData = zhiIdxs.map(zi => {
    const branch = ZHI[zi];
    const hidden = HIDDEN_STEMS[branch] || [];
    return hidden.map(h => ({
      gan: h.gan,
      elem: h.elem,
      god: getTenGod(dayGan, GAN.indexOf(h.gan))
    }));
  });

  // —— 副星（藏干十神的汇总展示）——
  const subStars = hiddenData.map(hd =>
    hd.map(h => h.god).filter((v, i, arr) => arr.indexOf(v) === i)
  );

  // —— 十二长生（星运）——
  const twelveLife = ganIdxs.map(gi => getTwelveLife(gi, zhiIdxs[ganIdxs.indexOf(gi)]));
  // 修正：每柱用自己的天干和地支
  const starFortune = ganIdxs.map((gi, i) => {
    const name = getTwelveLife(gi, zhiIdxs[i]);
    return { name, en: LIFE_EN_MAP[name] || 'unknown' };
  });

  // —— 自坐（日干在日支的长生状态）——
  const selfSitName = getTwelveLife(dayGan, dayZhi);
  const selfSit = selfSitName;
  const selfSitEn = LIFE_EN_MAP[selfSitName] || 'unknown';

  // —— 空亡 ——
  const voidPair = calcVoid(dayGan, dayZhi); // dayGan/dayZhi here are already indices (numbers)

  // —— 纳音 ——
  const nayin = ganIdxs.map((gi, i) => getNayin(gi, zhiIdxs[i]));

  // —— 神煞 ——
  const shenSha = calcShenSha(pillars, dayGan, gender);

  // —— 五行统计 ——
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  ganIdxs.forEach(g => { counts[GAN_ELEM[g]]++; });
  zhiIdxs.forEach(z => { counts[ZHI_ELEM[z]]++; });
  const elemList = [
    { name: '木', en: 'wood' }, { name: '火', en: 'fire' },
    { name: '土', en: 'earth' }, { name: '金', en: 'metal' }, { name: '水', en: 'water' }
  ].map(e => ({ ...e, count: counts[e.name] }));

  const text = pillars.map(p => p.gan + p.zhi).join(' ');

  return {
    pillars,
    text,
    dayMaster: GAN[dayGan],
    dayMasterIdx: dayGan,
    zodiac: ZODIAC[yearZhi],
    elemList,
    gender: gender || '',
    // 新增专业字段
    mainGods,           // 四柱天干十神
    hiddenData,         // 四柱藏干（含五行、十神）
    subStars,           // 副星（藏干十神去重）
    starFortune,        // 十二长生（星运）
    selfSit,            // 自坐
    selfSitEn,           // 自坐（英文，用于 CSS 类名）
    voidPair,           // 空亡地支
    nayin,              // 纳音
    shenSha             // 神煞列表 [{name, pos}]
  };
}

module.exports = { compute };
