// 热量计算工具
// BMR 采用 Mifflin-St Jeor 方程；训练消耗采用 MET 估算法

// 基础代谢率 BMR（静息状态下每日消耗）
function calcBMR(p) {
  if (!p || !p.age || !p.height || !p.weight) return null;
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return Math.round(p.gender === '女' ? base - 161 : base + 5);
}

// 活动系数
const ACTIVITY = {
  sedentary: 1.2,    // 久坐少动
  light: 1.375,      // 轻度活动（每周 1-3 次）
  moderate: 1.55,   // 中度活动（每周 3-5 次）
  high: 1.725,      // 高强度（每周 6-7 次）
  athlete: 1.9      // 运动员级别
};

// 每日总消耗 TDEE = BMR × 活动系数
function calcTDEE(bmr, level) {
  if (!bmr) return null;
  const f = ACTIVITY[level] || ACTIVITY.light;
  return Math.round(bmr * f);
}

// 训练热量消耗估算（MET 法 + 容量修正）
// duration: 训练时长(秒)；volume: Σ(重量kg×次数)；weight: 用户体重(kg)
function estimateTrainingCalories({ duration, volume, weight }) {
  let cal = 0;
  if (duration && duration > 0) {
    const hours = duration / 3600;
    const w = weight || 60; // 未知体重时按 60kg 估算
    cal += 5.5 * w * hours; // 抗阻训练 MET≈5.5
  }
  if (volume && volume > 0) {
    cal += volume * 0.05; // 容量修正项（每 kg·次 ≈ 0.05 kcal）
  }
  return Math.round(cal);
}

// 净平衡分析：摄入 - 消耗
// intake: 今日摄入(kcal)；burned: 今日运动消耗(kcal)；bmr: 基础代谢(kcal)
// dailyActivity: 日常活动消耗（由活动系数推算，不含已记录的训练）
function analyzeBalance({ intake, burned, bmr, dailyActivity = 0 }) {
  const totalBurned = (bmr || 0) + (dailyActivity || 0) + (burned || 0);
  const net = (intake || 0) - totalBurned;
  let status = 'balance';
  if (net > 0) status = 'surplus';       // 盈余
  else if (net < 0) status = 'deficit';  // 缺口
  return {
    intake: intake || 0,
    burned: burned || 0,
    bmr: bmr || 0,
    dailyActivity: dailyActivity || 0,
    totalBurned,
    net,
    status,
    absNet: Math.abs(net)
  };
}

// 由活动系数推算「日常活动消耗」(不含训练)：TDEE 与 BMR 的差额
function dailyActivityFromBMR(bmr, activity) {
  if (!bmr) return 0;
  const f = (ACTIVITY[activity] || ACTIVITY.light) - 1;
  return Math.round(bmr * f);
}

// 活动系数中文标签（我的页与热量卡共用）
const ACTIVITY_LABELS = {
  sedentary: '久坐',
  light: '轻度',
  moderate: '中度',
  high: '高强度',
  athlete: '运动员'
};

module.exports = { calcBMR, calcTDEE, estimateTrainingCalories, analyzeBalance, dailyActivityFromBMR, ACTIVITY, ACTIVITY_LABELS };
