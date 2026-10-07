// 动作库：内置常见训练动作（力量 / 徒手 / 有氧）
// group: 肌群(胸/背/腿/肩/臂/核心/有氧)
// equip: 器械(杠铃/哑铃/器械/徒手/有氧)
// tip: 一句关键技术要点
const EXERCISES = [
  // ---------- 胸 ----------
  { id: 'bench_barbell',  name: '杠铃卧推',     group: '胸', equip: '杠铃', tip: '沉肩夹背，杠铃落于乳头连线，肘部约 75° 展开。' },
  { id: 'bench_dumbbell', name: '哑铃卧推',     group: '胸', equip: '哑铃', tip: '哑铃下放至大臂与地面平行，避免耸肩。' },
  { id: 'incline_barbell',name: '上斜杠铃卧推', group: '胸', equip: '杠铃', tip: '板凳 30° 左右，侧重上胸，杠铃落于锁骨附近。' },
  { id: 'fly_dumbbell',   name: '哑铃飞鸟',     group: '胸', equip: '哑铃', tip: '肘微屈固定，靠胸肌夹拢画弧，顶峰停顿。' },
  { id: 'dip',            name: '双杠臂屈伸',   group: '胸', equip: '徒手', tip: '身体略前倾练胸，直立练三头，下放到肩不过肘。' },
  { id: 'pushup',         name: '俯卧撑',       group: '胸', equip: '徒手', tip: '核心收紧，身体成一条直线，下降时胸贴近地面。' },

  // ---------- 背 ----------
  { id: 'deadlift',       name: '硬拉',         group: '背', equip: '杠铃', tip: '杠铃贴小腿，背挺直，靠髋部前推发力。' },
  { id: 'pullup',         name: '引体向上',     group: '背', equip: '徒手', tip: '双手略宽于肩，靠背阔肌把身体拉向单杠。' },
  { id: 'row_barbell',    name: '杠铃划船',     group: '背', equip: '杠铃', tip: '躯干前倾 45°，把杠铃拉向肚脐，肘贴身体。' },
  { id: 'row_dumbbell',   name: '单臂哑铃划船', group: '背', equip: '哑铃', tip: '支撑手稳住，拉起时肘部向后上方收紧肩胛。' },
  { id: 'lat_pulldown',   name: '高位下拉',     group: '背', equip: '器械', tip: '挺胸沉肩，把横杆拉向锁骨，而非低头凑杆。' },
  { id: 'row_machine',    name: '坐姿划船',     group: '背', equip: '器械', tip: '躯干稳定，靠背阔肌后拉，顶峰挤压肩胛。' },

  // ---------- 腿 ----------
  { id: 'squat',          name: '深蹲',         group: '腿', equip: '杠铃', tip: '全脚掌踩实，膝朝脚尖，下蹲至大腿低于水平。' },
  { id: 'leg_press',      name: '腿举',         group: '腿', equip: '器械', tip: '双脚与肩同宽，下放至膝约 90°，勿塌腰。' },
  { id: 'lunge',          name: '弓步蹲',       group: '腿', equip: '哑铃', tip: '前脚踩实，下蹲时双膝约 90°，躯干竖直。' },
  { id: 'leg_curl',       name: '腿弯举',       group: '腿', equip: '器械', tip: '勾起脚跟收紧腘绳肌，慢放控制离心。' },
  { id: 'calf',           name: '站姿提踵',     group: '腿', equip: '器械', tip: '脚尖朝前，顶点停顿收紧小腿，全程慢速。' },
  { id: 'romanian_deadlift', name: '罗马尼亚硬拉', group: '腿', equip: '杠铃', tip: '微屈膝，髋后移下放杠铃至腘绳肌紧张，背挺直。' },

  // ---------- 肩 ----------
  { id: 'ohp',            name: '站姿杠铃推举', group: '肩', equip: '杠铃', tip: '收紧核心与臀，杠铃从锁骨推至头顶上方。' },
  { id: 'lateral_dumbbell', name: '哑铃侧平举', group: '肩', equip: '哑铃', tip: '小臂略内旋，靠中束把哑铃平举至肩高。' },
  { id: 'rear_delt',      name: '反向飞鸟',     group: '肩', equip: '哑铃', tip: '俯身或趴板，靠后束把哑铃向后外展。' },
  { id: 'face_pull',      name: '面拉',         group: '肩', equip: '器械', tip: '绳索拉向眉心，外旋手肘，练后束与肩袖。' },

  // ---------- 臂 ----------
  { id: 'curl_barbell',   name: '杠铃弯举',     group: '臂', equip: '杠铃', tip: '大臂贴身体，仅靠二头弯举，顶峰挤压。' },
  { id: 'curl_dumbbell',  name: '哑铃弯举',     group: '臂', equip: '哑铃', tip: '可旋腕至掌心朝上，控制离心下放。' },
  { id: 'hammer',         name: '锤式弯举',     group: '臂', equip: '哑铃', tip: '掌心相对，练肱肌与前臂，增强臂围。' },
  { id: 'tricep_pushdown',name: '三头下压',     group: '臂', equip: '器械', tip: '大臂贴身体，靠三头把绳索压向大腿。' },
  { id: 'skull_crusher',  name: '仰卧臂屈伸',   group: '臂', equip: '哑铃', tip: '躺平，弯举至额头上方再伸直，肘部稳定。' },

  // ---------- 核心 ----------
  { id: 'plank',          name: '平板支撑',     group: '核心', equip: '徒手', tip: '肩肘垂直，臀与肩同高，收紧腹与臀不塌腰。' },
  { id: 'crunch',         name: '卷腹',         group: '核心', equip: '徒手', tip: '下背贴地，靠腹卷起肩胛离地即可。' },
  { id: 'leg_raise',      name: '悬垂举腿',     group: '核心', equip: '徒手', tip: '悬吊稳定，靠下腹把腿抬至水平以上。' },
  { id: 'russian_twist',  name: '俄罗斯转体',   group: '核心', equip: '徒手', tip: '坐姿后倾，扭转躯干触碰两侧地面。' },

  // ---------- 有氧 ----------
  { id: 'run',            name: '慢跑',         group: '有氧', equip: '有氧', tip: '小步快频，落地轻柔，保持可交谈的配速。' },
  { id: 'row_erg',        name: '划船机',       group: '有氧', equip: '有氧', tip: '腿-背-臂顺序发力，回程先伸臂再屈腿。' },
  { id: 'bike',           name: '动感单车',     group: '有氧', equip: '有氧', tip: '调整座椅高度，核心收紧，匀速踩踏。' },
  { id: 'jump_rope',      name: '跳绳',         group: '有氧', equip: '有氧', tip: '前脚掌着地，手腕摇绳，节奏稳定。' }
];

// 肌群顺序（用于筛选与配色）
const GROUP_LIST = ['胸', '背', '腿', '肩', '臂', '核心', '有氧'];

// 肌群 → 主题色（用于卡片左侧色条）
const GROUP_COLOR = {
  '胸': '#ff7a7a',
  '背': '#5b8def',
  '腿': '#f5a623',
  '肩': '#36c5a8',
  '臂': '#b06bf2',
  '核心': '#ff9f43',
  '有氧': '#22c1c3'
};

// 便于按 id 查找
const BY_ID = {};
EXERCISES.forEach(e => { BY_ID[e.id] = e; });

module.exports = { EXERCISES, GROUP_LIST, GROUP_COLOR, BY_ID };
