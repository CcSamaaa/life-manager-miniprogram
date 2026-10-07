// 每日一签 —— 签库、档位与抽签/存储逻辑
// 纯本地实现，不依赖云开发，离线可用。

// ---------------- 档位（签筒） ----------------
const CATEGORIES = [
  { key: 'general', name: '综合运势', icon: '🌟', desc: '今日总体运势' },
  { key: 'career', name: '事业签', icon: '💼', desc: '打工 / 搞钱运' },
  { key: 'love', name: '桃花签', icon: '💗', desc: '爱情 / 桃花运' },
  { key: 'wealth', name: '财运签', icon: '💰', desc: '钱包鼓瘪运' },
  { key: 'health', name: '健康签', icon: '🌿', desc: '身体 / 精神运' },
  { key: 'study', name: '学业签', icon: '📚', desc: '考试 / 升学运' }
];

// 等级对应配色（暗金高级风）
const LEVEL_COLOR = {
  '上上签': '#e9c46a',
  '上签': '#2a9d8f',
  '中签': '#4a90d9',
  '下签': '#e76f51',
  '下下签': '#9aa0a6'
};

// ---------------- 签文库 ----------------
const SIGNS = {
  general: [
    { level: '上上签', poem: '云开见月路路通，今天运气像开了挂。', interpret: '诸事顺遂的一天，连走路都可能捡到灵感。把重要的事往今天堆，容易一次过。别太膨胀，低调出货，好运才稳。', yi: '主动出击、聊表心意、早睡', ji: '拖延、内耗、深夜冲动消费' },
    { level: '上签', poem: '小风拂面不费力，稳稳向前就稀奇。', interpret: '没有大惊喜但也没大坑，属于“平稳赢”的一天。把琐碎收尾，别给自己加戏，自然就顺了。', yi: '整理、复盘、回消息', ji: '钻牛角尖、临时改动计划' },
    { level: '中签', poem: '半晴半雨寻常日，凡事留三分余地。', interpret: '今天宜“看着办”。别把话说太满，别把钱包掏太空，留点余地给自己转弯。平稳过完就是胜利。', yi: '留后路、放慢节奏、多喝水', ji: '立 flag、借钱、熬夜赶工' },
    { level: '下签', poem: '鞋里进了小石子，不疼但有点烦。', interpret: '没大事，就是各种小别扭：信号差、排队长、外卖洒。建议把情绪调成“飞行模式”，明天自动恢复。', yi: '深呼吸、少争论、早点回家', ji: '较真、翻旧账、做重大决定' },
    { level: '下下签', poem: '今日宜躺平，强行营业易翻车。', interpret: '不是你不行，是今天宇宙在摸鱼。重要谈判、表白、辞职请改期。把今天当“系统维护日”，修养生息最划算。', yi: '休息、点外卖、看喜剧', ji: '硬刚、冲动发言、大额支出' }
  ],
  career: [
    { level: '上上签', poem: '贵人端着咖啡来，方案一过老板嗨。', interpret: '职场高光日。你提的想法容易被秒批，露脸机会自己接住。别忘了顺手帮同事一把，人脉利息后面领。', yi: '主动汇报、展示成果、社交', ji: '抢功、迟到、临时请假' },
    { level: '上签', poem: '手头活儿顺水流，准时下班不是梦。', interpret: '效率在线的一天，杂活能清就清。别揽太多别人的锅，专注自己的 KPI 最香。', yi: '列清单、拒绝杂活、准点走', ji: '摸鱼过度、接私活、怼领导' },
    { level: '中签', poem: '会议连轴转，脑子像待机。', interpret: '今天大概率在开会和等回复里度过。重要结论会后发文字确认，别靠记忆，记忆今天会离家出走。', yi: '写纪要、邮件确认、设提醒', ji: '口头承诺、多线程硬肝' },
    { level: '下签', poem: '需求改三遍，甲方说“还是第一版”。', interpret: '经典返工日，心累但正常。把情绪和交付分开，改就改了，别往心里去。下班奖励自己一顿好的。', yi: '保存版本、及时沟通、吃顿好的', ji: '硬怼甲方、带情绪改稿' },
    { level: '下下签', poem: '今天宜装忙，别接新锅。', interpret: '系统混乱日，新任务能推就推、能缓就缓。强行冲业绩容易背锅。保住情绪和头发最重要。', yi: '装忙、归档、保重发际线', ji: '接大项目、站队、提离职' }
  ],
  love: [
    { level: '上上签', poem: '桃花顺风来，开口就有戏。', interpret: '魅力值拉满的一天，单身者容易被搭讪，有伴者一句话就能把对方哄笑。勇敢表达，别等“完美时机”，今天就是。', yi: '主动聊天、约饭、夸 TA', ji: '冷战、翻旧情史、玩消失' },
    { level: '上签', poem: '细水慢慢流，平淡也温柔。', interpret: '没有偶像剧桥段，但关系在悄悄升温。一起做个饭、散个步，比送贵礼物更得分。', yi: '陪伴、小事用心、分享日常', ji: '查岗、翻手机、比较前任' },
    { level: '中签', poem: '信号半格飘，别急着下结论。', interpret: '对方今天可能有点闷，不是不爱你，是累了。先观察，少猜疑，问一句“怎么了”比脑补十集强。', yi: '关心、给空间、直接问', ji: '猜忌、翻旧账、阴阳怪气' },
    { level: '下签', poem: '嘴快惹人恼，话出口收不回。', interpret: '今天表达容易踩线，玩笑别开过火。想怼人的话先存草稿箱，明天再看多半不想发了。', yi: '少说、多听、发呆', ji: '抬杠、翻旧账、深夜发长语音' },
    { level: '下下签', poem: '前任别回，现任别气。', interpret: '桃花带刺日，旧人冒泡、新人有摩擦都别接招。今天谈情易翻车，把感情调成“维护模式”最稳。', yi: '不回陌生号、各自冷静', ji: '复合试探、吵架翻旧账' }
  ],
  wealth: [
    { level: '上上签', poem: '钱包咧嘴笑，进账有门道。', interpret: '财运上扬，可能报销到账、红包入手或突然省下一笔。记得“落袋为安”，别看见啥都觉得自己缺。', yi: '记账、攒下、理性下单', ji: 'all in、跟风炒、请客请大发' },
    { level: '上签', poem: '小财细水来，不乱花就涨。', interpret: '今天没什么大钱但也不漏。把自动扣费看一眼，薅到的券用掉，积少成多也是运。', yi: '薅券、查订阅、存零钱', ji: '凑满减、冲动囤货' },
    { level: '中签', poem: '账面平平过，量入也量出。', interpret: '收支打平的一天，宜守不宜攻。看中的东西先放购物车过夜，明天还想要再买。', yi: '列预算、货比三家、过夜再买', ji: '超前消费、借钱给人' },
    { level: '下签', poem: '手痒想下单，钱包在哆嗦。', interpret: '今天消费欲和理智打架，且理智常输。把支付密码改复杂点，或者干脆卸载购物软件半天。', yi: '关推送、删购物车、散步', ji: '直播下单、凑单、帮人代付' },
    { level: '下下签', poem: '今日宜装穷，破财在路中。', interpret: '破财预警日，丢东西、被坑、冲动剁手概率高。大额支出一律“明天再说”，能保住钱包就是赚。', yi: '装穷、备份、少带现金', ji: '投资、赌博、替人担保' }
  ],
  health: [
    { level: '上上签', poem: '元气满格充，动一动更轻松。', interpret: '状态在线的一天，适合把欠的运动补上、把睡错的觉调回。身体给你面子，你也对它好点。', yi: '拉伸、晒太阳、早睡', ji: '久坐、暴喝、通宵' },
    { level: '上签', poem: '平平无事儿，规律就养生。', interpret: '没毛病就是福。三餐准时、喝水到位、眼睛歇歇，普通操作反而最养人。', yi: '喝水、远眺、规律三餐', ji: '久坐不动、渴了才喝' },
    { level: '中签', poem: '半醒半困间，别硬撑。', interpret: '今天精力像信号格，时强时弱。重要事放状态好时做，累了就歇，硬撑容易感冒找上门。', yi: '小憩、通风、护眼', ji: '硬扛、憋尿、熬夜追剧' },
    { level: '下签', poem: '小恙来敲门，别装没事人。', interpret: '嗓子干、肩颈僵、胃有点闹，都是提醒。今天宜养生不宜造，奶茶换温水，沙发换床。', yi: '喝水、热敷、早点睡', ji: '冰饮、辛辣、硬扛' },
    { level: '下下签', poem: '今日宜躺平，身体在罢工。', interpret: '明显疲惫或不适的一天，强撑容易真进医院。该请假请假，该看医生看医生，面子没身体重要。', yi: '休息、就医、清淡饮食', ji: '加班、剧烈运动、硬扛' }
  ],
  study: [
    { level: '上上签', poem: '思路像开光，记啥都不忘。', interpret: '脑力巅峰日，难啃的章节今天最容易啃下。把最头疼的科目排前面，效率翻倍。', yi: '攻难点、做真题、做总结', ji: '刷短视频、无效抄写' },
    { level: '上签', poem: '稳稳往前挪，进度看得见。', interpret: '不算顿悟但稳扎稳打，今天适合按部就班刷完计划。别比进度，比“今天比昨天多懂一点”就行。', yi: '列计划、番茄钟、复习', ji: '临时换资料、焦虑攀比' },
    { level: '中签', poem: '注意力打飘，宜分段打卡。', interpret: '今天坐不住，硬坐两小时不如分四次各半小时。番茄钟用起来，手机离远点。', yi: '番茄钟、换科目、运动', ji: '长时间硬熬、边学边刷' },
    { level: '下签', poem: '一看就困，书成催眠。', interpret: '吸收率低迷的一天，硬背容易忘。先理框架、画导图，把状态养回来再冲细节。', yi: '画脑图、听课程、早睡', ji: '死记硬背、通宵突击' },
    { level: '下下签', poem: '今天宜摆烂，考试改期妙。', interpret: '脑子在休假，重要考试/答辩能调就调。实在避不开，就只复习重点，保底比冲满分现实。', yi: '抓重点、调作息、深呼吸', ji: '通宵、裸考、慌乱刷题' }
  ]
};

// ---------------- 工具函数 ----------------
function todayKey() {
  const d = new Date();
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function categoryByKey(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}

// 随机抽一条（无种子，纯随机）
function drawSign(categoryKey) {
  const list = SIGNS[categoryKey] || SIGNS.general;
  const idx = Math.floor(Math.random() * list.length);
  return Object.assign({ color: LEVEL_COLOR[list[idx].level] || '#e9c46a' }, list[idx]);
}

// 本地存储：每天限抽一次
const STORAGE_KEY = 'daily_sign_v1';

function loadTodaySign() {
  try {
    const rec = wx.getStorageSync(STORAGE_KEY);
    if (rec && rec.date === todayKey()) return rec;
  } catch (e) {}
  return null;
}

function saveTodaySign(categoryKey, sign) {
  try {
    wx.setStorageSync(STORAGE_KEY, {
      date: todayKey(),
      category: categoryKey,
      sign: sign
    });
  } catch (e) {}
}

function clearTodaySign() {
  try { wx.removeStorageSync(STORAGE_KEY); } catch (e) {}
}

module.exports = {
  CATEGORIES,
  LEVEL_COLOR,
  SIGNS,
  todayKey,
  categoryByKey,
  drawSign,
  loadTodaySign,
  saveTodaySign,
  clearTodaySign
};
