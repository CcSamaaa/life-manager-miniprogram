// 黄历 / 农历 计算模块（自包含，无第三方依赖）
// 提供 getAlmanac(year, month, day) 返回农历日期、干支、生肖、建除十二神、宜、忌、冲煞、纳音、节气、节日

const lunarInfo = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
  0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
  0x0d520
];

const Gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const Zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const Animals = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
const solarTerm = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
// 12 节（月支分界）对应的 term 序号（1-based）与地支索引
const JIE = [
  { term: 1, zhi: 1 },   // 小寒 → 丑
  { term: 3, zhi: 2 },   // 立春 → 寅
  { term: 5, zhi: 3 },   // 惊蛰 → 卯
  { term: 7, zhi: 4 },   // 清明 → 辰
  { term: 9, zhi: 5 },   // 立夏 → 巳
  { term: 11, zhi: 6 },  // 芒种 → 午
  { term: 13, zhi: 7 },  // 小暑 → 未
  { term: 15, zhi: 8 },  // 立秋 → 申
  { term: 17, zhi: 9 },  // 白露 → 酉
  { term: 19, zhi: 10 }, // 寒露 → 戌
  { term: 21, zhi: 11 }, // 立冬 → 亥
  { term: 23, zhi: 0 }   // 大雪 → 子
];

const nStr1 = ['日','一','二','三','四','五','六','七','八','九','十'];
const nStr2 = ['初','十','廿','卅'];
const nStr3 = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];

// 农历节日
const lFestival = {
  '1-1': '春节', '1-15': '元宵节', '2-2': '龙头节', '5-5': '端午节',
  '7-7': '七夕', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节',
  '12-8': '腊八节', '12-23': '北方小年', '12-24': '南方小年'
};
// 公历节日
const sFestival = {
  '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节',
  '4-1': '愚人节', '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节',
  '7-1': '建党节', '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节',
  '12-24': '平安夜', '12-25': '圣诞节'
};

// 60 纳音五行（甲子起）
const NA_YIN = [
  '金','金','火','火','木','木','土','土','金','金',
  '火','火','水','水','土','土','金','金','木','木',
  '水','水','土','土','火','火','木','木','水','水',
  '金','金','火','火','木','木','土','土','金','金',
  '火','火','水','水','土','土','金','金','木','木',
  '水','水','土','土','火','火','木','木','水','水'
];

// 建除十二神宜忌（传统建除歌诀简化）
const JIANCHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
const JIANCHU_YI = {
  '建': '出行、祈福、动土、开市、入学',
  '除': '祭祀、解除、沐浴、疗病、扫舍',
  '满': '祭祀、祈福、开市、交易、纳财',
  '平': '修造、嫁娶、安床、出行、动土',
  '定': '祭祀、祈福、嫁娶、造屋、入学',
  '执': '捕捉、修造、祭祀、纳财',
  '破': '破屋、求医、疗病、解除',
  '危': '安床、祭祀、祈福、捕捉',
  '成': '嫁娶、开市、入学、安床、纳财',
  '收': '嫁娶、纳财、收购、藏宝',
  '开': '开市、嫁娶、求医、出行、动土',
  '闭': '安葬、筑堤、闭户、补垣'
};
const JIANCHU_JI = {
  '建': '安葬、嫁娶、迁居、开仓',
  '除': '求官、出行、签约',
  '满': '动土、安葬、入宅',
  '平': '诉讼、出行、搬迁',
  '定': '词讼、出行、医疗',
  '执': '开市、移徙、安葬',
  '破': '嫁娶、出行、签约、安葬',
  '危': '登高、出行、嫁娶',
  '成': '词讼、争斗、诉讼',
  '收': '放债、出行、安葬',
  '开': '安葬、放债、入宅',
  '闭': '开市、出行、手术、求医'
};

const sTermInfo = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];

function lYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
  return sum + leapDays(y);
}
function leapDays(y) {
  if (leapMonth(y)) return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
  return 0;
}
function leapMonth(y) {
  return lunarInfo[y - 1900] & 0xf;
}
function monthDays(y, m) {
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}
function getTerm(y, n) {
  const offDate = new Date(
    (31556925974.7 * (y - 1900) + sTermInfo[n - 1] * 60000) + Date.UTC(1900, 0, 6, 2, 5)
  );
  return offDate.getUTCDate();
}

// 公历 → 农历
function solar2lunar(y, m, d) {
  const baseDate = Date.UTC(1900, 0, 31);
  const objDate = Date.UTC(y, m - 1, d);
  let offset = Math.round((objDate - baseDate) / 86400000);
  let lunarYear = 1900;
  let temp = 0;
  for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
    temp = lYearDays(lunarYear);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    lunarYear--;
  }
  const lm = leapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth;
  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    if (lm > 0 && lunarMonth === (lm + 1) && !isLeap) {
      lunarMonth--;
      isLeap = true;
      temp = leapDays(lunarYear);
    } else {
      temp = monthDays(lunarYear, lunarMonth);
    }
    if (isLeap && lunarMonth === (lm + 1)) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && lm > 0 && lunarMonth === lm + 1) {
    if (isLeap) { isLeap = false; } else { isLeap = true; lunarMonth--; }
  }
  if (offset < 0) { offset += temp; lunarMonth--; }
  const lunarDay = offset + 1;
  return { lunarYear, lunarMonth, lunarDay, isLeap };
}

function toChinaMonth(m) {
  return (m === 1 ? '正' : nStr3[m - 1]) + '月';
}
function toChinaDay(d) {
  let s;
  switch (d) {
    case 10: s = '初十'; break;
    case 20: s = '二十'; break;
    case 30: s = '三十'; break;
    default:
      s = nStr2[Math.floor(d / 10)];
      s += nStr1[d % 10];
  }
  return s;
}

function ganZhiYear(y) {
  const g = (y - 4) % 10;
  const z = (y - 4) % 12;
  return Gan[(g + 10) % 10] + Zhi[(z + 12) % 12];
}
function ganZhiMonth(lunarYear, lunarMonth) {
  const gy = ganZhiYear(lunarYear);
  const ganYearIdx = Gan.indexOf(gy[0]);
  const gan = (ganYearIdx * 2 + lunarMonth + 1) % 10;
  const zhiIdx = (lunarMonth + 1) % 12; // 正月→寅(2)
  return Gan[gan] + Zhi[zhiIdx];
}
function dayGanZhiIndex(y, m, d) {
  const base = Date.UTC(2000, 0, 7); // 甲子日
  const cur = Date.UTC(y, m - 1, d);
  let diff = Math.round((cur - base) / 86400000);
  return ((diff % 60) + 60) % 60;
}
function dayGanZhi(y, m, d) {
  const idx = dayGanZhiIndex(y, m, d);
  return Gan[idx % 10] + Zhi[idx % 12];
}

// 月支索引（节气月）
function monthZhiIndex(y, m, d) {
  const termNo = 2 * m - 1; // 本月“节”的 term 序号（1-based）
  let j;
  if (d >= getTerm(y, termNo)) {
    j = m - 1;
  } else if (m === 1) {
    return 11; // 小寒前 → 子（上一年大雪月）
  } else {
    j = m - 2;
  }
  return (j + 1) % 12;
}

// 冲煞：日支冲生肖 + 煞方
function chongSha(dayZhiIdx) {
  const chongIdx = (dayZhiIdx + 6) % 12;
  const shaMap = {
    0: '南', 1: '东', 2: '北', 3: '西', 4: '南', 5: '东',
    6: '南', 7: '东', 8: '北', 9: '西', 10: '南', 11: '东'
  };
  return '冲' + Animals[chongIdx] + '煞' + shaMap[dayZhiIdx];
}

function getAlmanac(y, m, d) {
  const lunar = solar2lunar(y, m, d);
  const gzYear = ganZhiYear(lunar.lunarYear);
  const gzMonth = ganZhiMonth(lunar.lunarYear, lunar.lunarMonth);
  const gzDay = dayGanZhi(y, m, d);
  const dayIdx = dayGanZhiIndex(y, m, d);
  const dayZhiIdx = dayIdx % 12;

  const animal = Animals[(lunar.lunarYear - 4) % 12];
  const lunarDateText = (lunar.isLeap ? '闰' : '') + toChinaMonth(lunar.lunarMonth) + toChinaDay(lunar.lunarDay);

  // 建除十二神
  const monthZhi = monthZhiIndex(y, m, d);
  const jcIdx = (dayZhiIdx - monthZhi + 12) % 12;
  const jianchu = JIANCHU[jcIdx];

  // 节气
  let term = '';
  for (let t = 1; t <= 24; t++) {
    if (getTerm(y, t) === d && Math.floor((t + 1) / 2) === m) {
      term = solarTerm[t - 1];
      break;
    }
  }

  // 节日
  const lKey = lunar.lunarMonth + '-' + lunar.lunarDay;
  const sKey = m + '-' + d;
  let festival = '';
  if (lFestival[lKey]) festival = lFestival[lKey];
  else if (sFestival[sKey]) festival = sFestival[sKey];

  const naYin = NA_YIN[dayIdx];

  return {
    lunarYear: lunar.lunarYear,
    lunarDateText,
    isLeap: lunar.isLeap,
    gzYear, gzMonth, gzDay,
    animal,
    jianchu,
    yi: JIANCHU_YI[jianchu],
    ji: JIANCHU_JI[jianchu],
    chongSha: chongSha(dayZhiIdx),
    naYin,
    term,
    festival
  };
}

module.exports = { getAlmanac, solar2lunar };
