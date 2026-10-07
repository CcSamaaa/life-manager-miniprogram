const { todayStr, addDays } = require('./date');

// 连续打卡天数：从今天（或昨天）往前数连续有记录的自然日
function calcDailyStreak(dates) {
  if (!dates || !dates.length) return 0;
  const set = new Set(dates);
  const today = todayStr();
  let cursor = set.has(today)
    ? today
    : (set.has(addDays(today, -1)) ? addDays(today, -1) : null);
  if (!cursor) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// 连续达标周数：weeklyMetFlags 为布尔数组，index 0 = 当前周，1 = 上一周……（时间倒序）
function calcWeeklyStreak(weeklyMetFlags) {
  let streak = 0;
  for (let i = 0; i < weeklyMetFlags.length; i++) {
    if (weeklyMetFlags[i]) streak++;
    else break;
  }
  return streak;
}

module.exports = { calcDailyStreak, calcWeeklyStreak };
