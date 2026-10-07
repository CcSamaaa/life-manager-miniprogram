// 首次打开小程序、习惯表为空时预置的起步习惯集
const SEED_HABITS = [
  { emoji: '💧', name: '喝水 2000ml', targetType: 'daily', targetCount: 1 },
  { emoji: '🏃', name: '运动 30 分钟', targetType: 'weekly', targetCount: 4 },
  { emoji: '🌙', name: '23 点前睡觉', targetType: 'daily', targetCount: 1 },
  { emoji: '🧘', name: '冥想 10 分钟', targetType: 'daily', targetCount: 1 },
  { emoji: '📚', name: '读书 20 分钟', targetType: 'daily', targetCount: 1 },
  { emoji: '🔤', name: '学英语', targetType: 'weekly', targetCount: 3 },
  { emoji: '✍️', name: '写日记', targetType: 'daily', targetCount: 1 },
  { emoji: '💰', name: '记账', targetType: 'daily', targetCount: 1 },
  { emoji: '🧹', name: '整理房间', targetType: 'weekly', targetCount: 2 },
  { emoji: '📞', name: '给爸妈打电话', targetType: 'weekly', targetCount: 1 }
];

module.exports = { SEED_HABITS };
