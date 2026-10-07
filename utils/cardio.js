// 有氧训练类型与热量计算工具
// 热量 = MET × 体重(kg) × 时间(小时)

const CARDIO_TYPES = [
  { key: 'run', name: '跑步', icon: '🏃', fields: ['speed', 'time', 'distance'], unit: 'km/h',
    hasSpeed: true, hasGrade: false, hasTime: true, hasDistance: true },
  { key: 'walk-incline', name: '爬坡', icon: '🏔️', fields: ['speed', 'grade', 'time'], unit: 'km/h',
    hasSpeed: true, hasGrade: true, hasTime: true, hasDistance: false },
  { key: 'stair', name: '爬楼机', icon: '🪜', fields: ['speed', 'time'], unit: '级/分',
    hasSpeed: true, hasGrade: false, hasTime: true, hasDistance: false },
  { key: 'cycle', name: '骑行', icon: '🚴', fields: ['speed', 'time', 'distance'], unit: 'km/h',
    hasSpeed: true, hasGrade: false, hasTime: true, hasDistance: true },
  { key: 'elliptical', name: '椭圆机', icon: '🛸', fields: ['speed', 'time'], unit: '级/分',
    hasSpeed: true, hasGrade: false, hasTime: true, hasDistance: false },
  { key: 'row', name: '划船机', icon: '🚣', fields: ['speed', 'time'], unit: '划/分',
    hasSpeed: true, hasGrade: false, hasTime: true, hasDistance: false }
];

const TYPE_MAP = {};
CARDIO_TYPES.forEach(t => { TYPE_MAP[t.key] = t; });

// 根据类型与参数计算 MET
function calcMET(type, speed, grade) {
  const s = parseFloat(speed) || 0;
  const g = parseFloat(grade) || 0;
  switch (type) {
    case 'run':
      // 跑步：8 km/h 约 8.3 MET，速度每快 1 km/h 加约 0.8
      return Math.max(6, 8.3 + Math.max(0, s - 8) * 0.8);
    case 'walk-incline':
      // 爬坡走：基础 3.5 + 速度×0.5 + 坡度×0.12
      return Math.max(3, 3.5 + s * 0.5 + g * 0.12);
    case 'stair':
      return 8.0;
    case 'cycle':
      // 骑行：休闲约 5.5，速度每快 1 km/h 加 0.3
      return Math.max(4, 5.5 + s * 0.3);
    case 'elliptical':
      return Math.max(4, 5.0 + s * 0.1);
    case 'row':
      return Math.max(5, 7.0 + s * 0.1);
    default:
      return 5.0;
  }
}

// 计算一次有氧的热量（kcal）
// opts: { type, speed, grade, timeMin, weight }
function calcCardioKcal(opts) {
  opts = opts || {};
  const timeMin = parseFloat(opts.timeMin) || 0;
  if (timeMin <= 0) return 0;
  const weight = parseFloat(opts.weight) || 60;
  const met = calcMET(opts.type, opts.speed, opts.grade);
  return Math.round(met * weight * (timeMin / 60));
}

// 格式化时长：分 → "xx 分" 或 "x 小时 x 分"
function fmtCardioDuration(timeMin) {
  const m = parseInt(timeMin, 10) || 0;
  if (m < 60) return `${m} 分`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} 小时 ${rm} 分` : `${h} 小时`;
}

module.exports = {
  CARDIO_TYPES,
  TYPE_MAP,
  calcMET,
  calcCardioKcal,
  fmtCardioDuration
};
