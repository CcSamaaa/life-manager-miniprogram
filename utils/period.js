// 经期记录计算工具
// 输入：periods = [{ start:'YYYY-MM-DD', end:'YYYY-MM-DD'|null, note? }]
//      settings = { cycleLength: 默认周期天数, periodLength: 默认经期天数 }

const { addDays } = require('./date');

// 两个日期字符串相差天数（b - a）
function dateDiffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// 单次经期实际天数（进行中返回 0，由调用方按今天补全）
function lengthOf(p) {
  if (!p.end) return 0;
  return dateDiffDays(p.start, p.end) + 1;
}

// 根据历史记录与设置，推算统计与预测
function computeStats(periods, settings) {
  const cycleLength = (settings && settings.cycleLength) || 28;
  const periodLength = (settings && settings.periodLength) || 5;
  const sorted = periods.slice().sort((a, b) => (a.start < b.start ? -1 : 1));

  // 平均周期：取最近最多 6 个间隔
  let avgCycle = cycleLength;
  if (sorted.length >= 2) {
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = dateDiffDays(sorted[i - 1].start, sorted[i].start);
      if (diff > 0) intervals.push(diff);
    }
    if (intervals.length) {
      const recent = intervals.slice(-6);
      avgCycle = Math.round(recent.reduce((s, x) => s + x, 0) / recent.length);
    }
  }

  // 平均经期天数（仅统计已结束的）
  const lengths = sorted.map(lengthOf).filter(x => x > 0);
  const avgLength = lengths.length
    ? Math.round(lengths.reduce((s, x) => s + x, 0) / lengths.length) || periodLength
    : periodLength;

  const last = sorted[sorted.length - 1];
  const lastStart = last ? last.start : null;

  let nextStart = null, ovulation = null, fertileStart = null, fertileEnd = null, predictedEnd = null;
  if (lastStart) {
    nextStart = addDays(lastStart, avgCycle);          // 下次经期预计开始
    ovulation = addDays(nextStart, -14);               // 排卵日≈下次经期前 14 天
    fertileStart = addDays(ovulation, -4);             // 易孕期开始
    fertileEnd = addDays(ovulation, 1);                // 易孕期结束
    predictedEnd = addDays(nextStart, avgLength - 1);  // 下次经期预计结束
  }

  return {
    avgCycle, avgLength, lastStart,
    nextStart, ovulation, fertileStart, fertileEnd, predictedEnd
  };
}

// 判断某天在日历中的状态（用于着色）
// todayStr 用于补全进行中的经期
function dayState(dateStr, periods, stats, todayStr) {
  // 1) 已记录经期
  for (const p of periods) {
    const end = p.end || todayStr;
    if (dateStr >= p.start && dateStr <= end) return 'period';
  }
  // 2) 预测经期 / 易孕期
  if (stats.nextStart) {
    if (dateStr >= stats.fertileStart && dateStr <= stats.fertileEnd) return 'fertile';
    if (dateStr >= stats.nextStart && dateStr <= stats.predictedEnd) return 'predicted';
  }
  return '';
}

// 今天的整体状态
function todayStatus(todayStr, periods, stats) {
  for (const p of periods) {
    const end = p.end || todayStr;
    if (todayStr >= p.start && todayStr <= end) {
      return { onPeriod: true, periodDay: dateDiffDays(p.start, todayStr) + 1 };
    }
  }
  if (stats.nextStart) {
    const toNext = dateDiffDays(todayStr, stats.nextStart);
    const inFertile = todayStr >= stats.fertileStart && todayStr <= stats.fertileEnd;
    return { onPeriod: false, inFertile, daysToNext: toNext };
  }
  return { onPeriod: false };
}

// 历史列表（按开始日期升序），附带间隔天数
function buildHistories(periods) {
  const sorted = periods.slice().sort((a, b) => (a.start < b.start ? -1 : 1));
  return sorted.map((p, i) => {
    const len = p.end ? dateDiffDays(p.start, p.end) + 1 : null;
    let interval = null;
    if (i > 0) interval = dateDiffDays(sorted[i - 1].start, p.start);
    return Object.assign({}, p, { len, interval });
  });
}

module.exports = { computeStats, dayState, todayStatus, buildHistories, dateDiffDays, lengthOf };
