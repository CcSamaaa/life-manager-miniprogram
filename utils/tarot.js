// 塔罗牌数据库 + 牌阵 + 抽牌引擎
// 设计原则：尽量还原实体塔罗的测算方式
//   1) 先选牌阵（不同问题对应不同布阵）
//   2) 抽牌前需"聚焦/默念问题"（实体仪式中的意图设定）
//   3) 逐张抽取，每张随机正位/逆位（实体洗牌切牌后的自然结果）
//   4) 自动解签 = 牌阵位置含义 + 牌面正逆位释义 的组合
// 本模块为纯本地数据，不依赖云开发。

// ============ 大阿卡纳（22 张） ============
const MAJOR = [
  { roman: '0', nameZh: '愚者', nameEn: 'The Fool',
    upright: '新的开始、自由、纯真与无限可能，带着信任踏上未知的旅程。',
    reversed: '鲁莽冒进、逃避责任、犹豫不决或计划尚不周全。' },
  { roman: 'I', nameZh: '魔术师', nameEn: 'The Magician',
    upright: '创造力与行动力具足，资源已齐，正是把意念化为现实的时机。',
    reversed: '才能未熟、自我怀疑、巧言欺瞒或潜能尚未发挥。' },
  { roman: 'II', nameZh: '女祭司', nameEn: 'The High Priestess',
    upright: '直觉与潜意识苏醒，神秘的内在智慧等待你静心聆听。',
    reversed: '忽视直觉、被表象迷惑，或藏着尚未说出口的秘密。' },
  { roman: 'III', nameZh: '皇后', nameEn: 'The Empress',
    upright: '丰盛、滋养与孕育，感官之美与创造力正在生长。',
    reversed: '过度依赖或保护、创造力受阻，内心感到空虚匮乏。' },
  { roman: 'IV', nameZh: '皇帝', nameEn: 'The Emperor',
    upright: '权威、稳定与秩序，以掌控力建立扎实的根基。',
    reversed: '专断控制、僵化固执，或缺乏应有的弹性与温度。' },
  { roman: 'V', nameZh: '教皇', nameEn: 'The Hierophant',
    upright: '传统、信仰与教导，循规蹈矩中寻求可靠的指引。',
    reversed: '墨守成规、流于教条，或遇伪善与反叛的呼唤。' },
  { roman: 'VI', nameZh: '恋人', nameEn: 'The Lovers',
    upright: '爱、结合与重要抉择，价值契合带来和谐与吸引。',
    reversed: '失衡、错误选择、价值观分歧或被诱惑带离正轨。' },
  { roman: 'VII', nameZh: '战车', nameEn: 'The Chariot',
    upright: '靠意志驾驭方向，冲过阻力赢得胜利与前进。',
    reversed: '失控、方向迷失、内在拉扯导致半途而废。' },
  { roman: 'VIII', nameZh: '力量', nameEn: 'Strength',
    upright: '以耐心与温柔克制内在，柔能克刚，勇气来自内心。',
    reversed: '自我怀疑、恐惧上头，或被情绪牵着走而失控。' },
  { roman: 'IX', nameZh: '隐者', nameEn: 'The Hermit',
    upright: '内省、独处与寻道，提灯照见属于自己的智慧。',
    reversed: '孤立逃避、固执不退，或在孤独中迷失方向。' },
  { roman: 'X', nameZh: '命运之轮', nameEn: 'Wheel of Fortune',
    upright: '命运转动、循环与转机，顺应起伏便能接住机遇。',
    reversed: '厄运、停滞或抗拒变化，感觉被坏运气缠住。' },
  { roman: 'XI', nameZh: '正义', nameEn: 'Justice',
    upright: '公平、因果与真相，承担应负的责任，自会得裁决。',
    reversed: '失衡、推诿与自欺，或遭遇不公却不愿面对。' },
  { roman: 'XII', nameZh: '倒吊人', nameEn: 'The Hanged Man',
    upright: '主动放下、换位视角，暂停中迎来顿悟与牺牲。',
    reversed: '徒劳的牺牲、固执拖延，抗拒必要的改变。' },
  { roman: 'XIII', nameZh: '死神', nameEn: 'Death',
    upright: '结束亦是重生，放下旧我，转变自然发生。',
    reversed: '抗拒改变、停滞不前，或对结束心生恐惧。' },
  { roman: 'XIV', nameZh: '节制', nameEn: 'Temperance',
    upright: '平衡、调和与耐心，中庸之道带来治愈。',
    reversed: '失衡、过度与冲突，或急于求成失了分寸。' },
  { roman: 'XV', nameZh: '恶魔', nameEn: 'The Devil',
    upright: '被欲望、执念或物质所缚，看清枷锁方能觉醒。',
    reversed: '挣脱束缚、意识觉醒，逐步摆脱控制与依赖。' },
  { roman: 'XVI', nameZh: '高塔', nameEn: 'The Tower',
    upright: '突发崩塌破除假象，震荡之后方见真实。',
    reversed: '侥幸避开灾祸、延迟的崩塌，或勉强维持表象。' },
  { roman: 'XVII', nameZh: '星星', nameEn: 'The Star',
    upright: '希望、疗愈与灵感，信念带来宁静与指引。',
    reversed: '失望、信心动摇、迷茫倦怠，暂时失去方向。' },
  { roman: 'XVIII', nameZh: '月亮', nameEn: 'The Moon',
    upright: '潜意识、幻象与未知涌动，不安中藏着直觉。',
    reversed: '迷雾散去、真相浮现，释放长久的恐惧。' },
  { roman: 'XIX', nameZh: '太阳', nameEn: 'The Sun',
    upright: '喜悦、成功与光明，清晰活力，丰收在望。',
    reversed: '光芒暂被遮蔽、过度乐观，或丰收稍有延迟。' },
  { roman: 'XX', nameZh: '审判', nameEn: 'Judgement',
    upright: '觉醒、召唤与反思，宽恕过往，迎来重生。',
    reversed: '自我批判、逃避召唤，或困在懊悔里走不出。' },
  { roman: 'XXI', nameZh: '世界', nameEn: 'The World',
    upright: '圆满、完成与整合，旅程抵达阶段性的成就。',
    reversed: '未竟、尚有缺口，或完成被延迟。' }
];

// ============ 小阿卡纳（56 张） ============
// 花色：权杖(火/行动) 圣杯(水/情感) 宝剑(风/思维) 星币(土/现实)
const MINOR = [
  // ---- 权杖 Wands（🔥） ----
  { suit: 'wands', rankZh: '王牌', suitZh: '权杖', symbol: '🔥',
    upright: '新灵感与行动的起点，创造力正要迸发。', reversed: '热情受阻、计划搁浅，动力迟迟燃不起来。' },
  { suit: 'wands', rankZh: '2', suitZh: '权杖', symbol: '🔥',
    upright: '规划与抉择，远见在胸、蓄势待发。', reversed: '犹豫不决、视野受限，害怕做决定。' },
  { suit: 'wands', rankZh: '3', suitZh: '权杖', symbol: '🔥',
    upright: '向外扩张、等待成果，探索与贸易开启。', reversed: '延迟受阻、错失机会，进展不如预期。' },
  { suit: 'wands', rankZh: '4', suitZh: '权杖', symbol: '🔥',
    upright: '稳定、庆祝与归属，根基渐牢。', reversed: '动荡不安、处于过渡，还未安定下来。' },
  { suit: 'wands', rankZh: '5', suitZh: '权杖', symbol: '🔥',
    upright: '竞争与冲突，在力争上游中前行。', reversed: '内耗与无谓争执，选择让位更明智。' },
  { suit: 'wands', rankZh: '6', suitZh: '权杖', symbol: '🔥',
    upright: '胜利、认可与领先，荣耀加身。', reversed: '受阻被超、虚假的胜利，风光难维持。' },
  { suit: 'wands', rankZh: '7', suitZh: '权杖', symbol: '🔥',
    upright: '以寡敌众、坚守防线，韧性十足。', reversed: '压力过载、防线将溃，考虑适时退守。' },
  { suit: 'wands', rankZh: '8', suitZh: '权杖', symbol: '🔥',
    upright: '迅速流动、消息频传，能量畅达。', reversed: '延误混乱、速度失控，节奏乱了。' },
  { suit: 'wands', rankZh: '9', suitZh: '权杖', symbol: '🔥',
    upright: '警惕戒备、接近成功，靠韧性守住。', reversed: '疲惫偏执、不堪重负，弦绷得太紧。' },
  { suit: 'wands', rankZh: '10', suitZh: '权杖', symbol: '🔥',
    upright: '重担在肩、责任临界，已到承受的顶点。', reversed: '学会卸下、寻找分担，别再过度承担。' },
  { suit: 'wands', rankZh: '侍从', suitZh: '权杖', symbol: '🔥',
    upright: '探索欲与热情初现，冒出新鲜点子。', reversed: '三分钟热度、拖延浮躁，难落地。' },
  { suit: 'wands', rankZh: '骑士', suitZh: '权杖', symbol: '🔥',
    upright: '行动力强、热情奔放，一往无前。', reversed: '冲动鲁莽、半途而废，方向太急。' },
  { suit: 'wands', rankZh: '王后', suitZh: '权杖', symbol: '🔥',
    upright: '自信温暖、感染力强，创造力丰沛。', reversed: '控制欲重、情绪化或陷入倦怠。' },
  { suit: 'wands', rankZh: '国王', suitZh: '权杖', symbol: '🔥',
    upright: '远见与魄力兼具，开拓型的领导者。', reversed: '专断急躁、滥用权力，失了格局。' },

  // ---- 圣杯 Cups（🍷） ----
  { suit: 'cups', rankZh: '王牌', suitZh: '圣杯', symbol: '🍷',
    upright: '爱的开始、情感丰盈，直觉被温柔打开。', reversed: '情感封闭、错失温情，内心空荡。' },
  { suit: 'cups', rankZh: '2', suitZh: '圣杯', symbol: '🍷',
    upright: '吸引、联结与合作，一段新关系萌芽。', reversed: '失衡误解、关系渐淡，温度在降。' },
  { suit: 'cups', rankZh: '3', suitZh: '圣杯', symbol: '🍷',
    upright: '欢聚、友谊与庆祝，在团体中感到温暖。', reversed: '表面热闹、过度社交，实则疏离。' },
  { suit: 'cups', rankZh: '4', suitZh: '圣杯', symbol: '🍷',
    upright: '反思与不满足，重新评估手中的一切。', reversed: '觉醒接纳、新机会出现，不再挑剔。' },
  { suit: 'cups', rankZh: '5', suitZh: '圣杯', symbol: '🍷',
    upright: '失落与遗憾，目光停在缺失之处。', reversed: '释怀走出低谷，开始修补与和解。' },
  { suit: 'cups', rankZh: '6', suitZh: '圣杯', symbol: '🍷',
    upright: '回忆、纯真与怀旧，带着安全感。', reversed: '沉溺过去、不愿成长，天真误事。' },
  { suit: 'cups', rankZh: '7', suitZh: '圣杯', symbol: '🍷',
    upright: '幻想纷呈、选择过多，容易迷惑。', reversed: '幻灭落地、看清现实，不再飘着。' },
  { suit: 'cups', rankZh: '8', suitZh: '圣杯', symbol: '🍷',
    upright: '舍弃离开、追寻更深的意义。', reversed: '犹豫留下、恐惧改变，困在原地。' },
  { suit: 'cups', rankZh: '9', suitZh: '圣杯', symbol: '🍷',
    upright: '满足、情感丰盛，心愿渐圆。', reversed: '空虚、过度依赖外在，期待落空。' },
  { suit: 'cups', rankZh: '10', suitZh: '圣杯', symbol: '🍷',
    upright: '圆满、家庭和睦与幸福，找到归宿。', reversed: '关系紧张、不完美，或家中失和。' },
  { suit: 'cups', rankZh: '侍从', suitZh: '圣杯', symbol: '🍷',
    upright: '情感流露、浪漫与敏感，带来消息。', reversed: '情绪化、多愁善感，显得不成熟。' },
  { suit: 'cups', rankZh: '骑士', suitZh: '圣杯', symbol: '🍷',
    upright: '浪漫追求、温柔而理想主义。', reversed: '优柔寡断、陷于幻想，情绪过头。' },
  { suit: 'cups', rankZh: '王后', suitZh: '圣杯', symbol: '🍷',
    upright: '共情包容、直觉强，情感丰沛而暖。', reversed: '情绪依赖、过度付出，界限模糊。' },
  { suit: 'cups', rankZh: '国王', suitZh: '圣杯', symbol: '🍷',
    upright: '情商高、包容而平衡的情感领导。', reversed: '情绪操控、回避冷漠，理性失温。' },

  // ---- 宝剑 Swords（⚔️） ----
  { suit: 'swords', rankZh: '王牌', suitZh: '宝剑', symbol: '⚔️',
    upright: '思路清晰、新突破，真相被一剑挑明。', reversed: '混乱误判、言辞锋利，反而伤人。' },
  { suit: 'swords', rankZh: '2', suitZh: '宝剑', symbol: '⚔️',
    upright: '权衡僵局、逃避决定，两难悬而未决。', reversed: '压力释放、学会妥协，仍待落地。' },
  { suit: 'swords', rankZh: '3', suitZh: '宝剑', symbol: '⚔️',
    upright: '心碎、痛苦与割裂，却也带来清醒。', reversed: '开始疗愈、释怀，伤口慢慢愈合。' },
  { suit: 'swords', rankZh: '4', suitZh: '宝剑', symbol: '⚔️',
    upright: '休整静养、暂停恢复，养精蓄锐。', reversed: '寝食难安、急于行动，静不下来。' },
  { suit: 'swords', rankZh: '5', suitZh: '宝剑', symbol: '⚔️',
    upright: '冲突得失、以退为进的智慧。', reversed: '放下输赢、走向和解，余波渐平。' },
  { suit: 'swords', rankZh: '6', suitZh: '宝剑', symbol: '⚔️',
    upright: '过渡离开、释然启程，向前走。', reversed: '暂缓不前、不愿放下，困在旧处。' },
  { suit: 'swords', rankZh: '7', suitZh: '宝剑', symbol: '⚔️',
    upright: '谋略谨慎、出其不意，智取为上。', reversed: '算计暴露、得不偿失，小心被看穿。' },
  { suit: 'swords', rankZh: '8', suitZh: '宝剑', symbol: '⚔️',
    upright: '自我设限、受困焦虑，画地为牢。', reversed: '觉醒挣脱、看清束缚，重获自由。' },
  { suit: 'swords', rankZh: '9', suitZh: '宝剑', symbol: '⚔️',
    upright: '深夜忧惧、焦虑缠身，思虑过重。', reversed: '释然平静、担忧将尽，睡得着了。' },
  { suit: 'swords', rankZh: '10', suitZh: '宝剑', symbol: '⚔️',
    upright: '跌至谷底、阵痛终结，重生前夜。', reversed: '出现转机、痛苦将逝，开始恢复。' },
  { suit: 'swords', rankZh: '侍从', suitZh: '宝剑', symbol: '⚔️',
    upright: '求知敏锐、带来新消息与思路。', reversed: '多疑八卦、浮躁不定，易听信谣言。' },
  { suit: 'swords', rankZh: '骑士', suitZh: '宝剑', symbol: '⚔️',
    upright: '迅速决断、直率冲劲，干脆利落。', reversed: '鲁莽尖刻、冲动伤人，少了分寸。' },
  { suit: 'swords', rankZh: '王后', suitZh: '宝剑', symbol: '⚔️',
    upright: '理性洞察、独立判断，思维清晰。', reversed: '冷酷苛责、过度批判，伤人也伤己。' },
  { suit: 'swords', rankZh: '国王', suitZh: '宝剑', symbol: '⚔️',
    upright: '公正智慧、原则清晰的权威思维。', reversed: '专断冷峻、滥用理智，失了人情。' },

  // ---- 星币 Pentacles（🪙） ----
  { suit: 'pentacles', rankZh: '王牌', suitZh: '星币', symbol: '🪙',
    upright: '新机会、物质基础与丰盛的开端。', reversed: '错失机会、财务不稳，行动拖延。' },
  { suit: 'pentacles', rankZh: '2', suitZh: '星币', symbol: '🪙',
    upright: '灵活平衡、多线并行，游刃有余。', reversed: '顾此失彼、失衡混乱，难以兼顾。' },
  { suit: 'pentacles', rankZh: '3', suitZh: '星币', symbol: '🪙',
    upright: '协作学习、技艺打磨，团队给力。', reversed: '敷衍配合、缺乏投入，质量打折。' },
  { suit: 'pentacles', rankZh: '4', suitZh: '星币', symbol: '🪙',
    upright: '守住、节约与积累，稳握当下。', reversed: '吝啬固执、紧抓不放，反成束缚。' },
  { suit: 'pentacles', rankZh: '5', suitZh: '星币', symbol: '🪙',
    upright: '匮乏困境、物质紧张与孤立感。', reversed: '出现转机、懂得求助，走出匮乏。' },
  { suit: 'pentacles', rankZh: '6', suitZh: '星币', symbol: '🪙',
    upright: '给予与互助、施受平衡，良性循环。', reversed: '关系不对等、依赖或施舍心态。' },
  { suit: 'pentacles', rankZh: '7', suitZh: '星币', symbol: '🪙',
    upright: '长期耕耘、耐心等待，评估投入。', reversed: '急于求成、回报未显，信心动摇。' },
  { suit: 'pentacles', rankZh: '8', suitZh: '星币', symbol: '🪙',
    upright: '精进专注、踏实磨炼技艺。', reversed: '敷衍分心、陷入倦怠，质量下滑。' },
  { suit: 'pentacles', rankZh: '9', suitZh: '星币', symbol: '🪙',
    upright: '丰足独立、成果安稳，自给自足。', reversed: '虚饰不安、外强中干，底气不足。' },
  { suit: 'pentacles', rankZh: '10', suitZh: '星币', symbol: '🪙',
    upright: '富足传承、家庭财富与长久安稳。', reversed: '财务压力、物质羁绊，平衡被打破。' },
  { suit: 'pentacles', rankZh: '侍从', suitZh: '星币', symbol: '🪙',
    upright: '踏实学习、稳健的新机会出现。', reversed: '拖延不务实、易分心，难见进展。' },
  { suit: 'pentacles', rankZh: '骑士', suitZh: '星币', symbol: '🪙',
    upright: '负责稳健、可靠前行，重效率。', reversed: '保守迟缓、固执不变，进度偏慢。' },
  { suit: 'pentacles', rankZh: '王后', suitZh: '星币', symbol: '🪙',
    upright: '务实丰盛、滋养踏实，接地气。', reversed: '过度操心、物质焦虑，失衡劳碌。' },
  { suit: 'pentacles', rankZh: '国王', suitZh: '星币', symbol: '🪙',
    upright: '稳健富足、可靠而有成就。', reversed: '贪婪固执、守财不舍，失了格局。' }
];

// 组装完整 78 张牌
const CARDS = [];
MAJOR.forEach((m, i) => {
  CARDS.push({
    id: 'M' + i,
    arcana: 'major',
    nameZh: m.nameZh,
    nameEn: m.nameEn,
    roman: m.roman,
    upright: m.upright,
    reversed: m.reversed
  });
});
MINOR.forEach((m, i) => {
  CARDS.push({
    id: 'm' + i,
    arcana: 'minor',
    suit: m.suit,
    rankZh: m.rankZh,
    suitZh: m.suitZh,
    symbol: m.symbol,
    nameZh: m.rankZh + '·' + m.suitZh,
    nameEn: m.rankZh + ' of ' + m.suitZh,
    upright: m.upright,
    reversed: m.reversed
  });
});

// 牌面显示标签
function cardLabel(card) {
  if (card.arcana === 'major') {
    return { top: card.roman, name: card.nameZh, sub: card.nameEn, symbol: '✦' };
  }
  return { top: card.symbol, name: card.nameZh, sub: card.suitZh, symbol: card.symbol };
}

// ============ 牌阵 ============
// 每个 position: { name 位置名, hint 该位置的象征含义 }
const SPREADS = [
  {
    key: 'one',
    name: '单张指引',
    count: 1,
    desc: '为当下一个问题，求一张指引牌。',
    positions: [
      { name: '指引', hint: '当下最需要处理、或最想被提醒的能量' }
    ]
  },
  {
    key: 'time',
    name: '时间之流',
    count: 3,
    desc: '过去 · 现在 · 未来，看清事情的发展脉络。',
    positions: [
      { name: '过去', hint: '已经流过、仍在影响你的能量' },
      { name: '现在', hint: '此刻所处的核心状态' },
      { name: '未来', hint: '顺势发展可能走向的结果' }
    ]
  },
  {
    key: 'love',
    name: '关系牌阵',
    count: 5,
    desc: '看清一段关系里双方的感受与走向。',
    positions: [
      { name: '你的感受', hint: '你在这段关系中的真实状态' },
      { name: '对方的感受', hint: '对方当下的心思与态度' },
      { name: '关系现状', hint: '两人之间的连接本质' },
      { name: '面临的挑战', hint: '需要一起面对的课题' },
      { name: '未来走向', hint: '关系可能发展的方向' }
    ]
  },
  {
    key: 'choice',
    name: '抉择牌阵',
    count: 5,
    desc: '面对两难，对比两条路的结果再做决定。',
    positions: [
      { name: '现状', hint: '做选择前所处的局面' },
      { name: '选择 A', hint: '第一条路的特质' },
      { name: '选择 B', hint: '第二条路的特质' },
      { name: 'A 的结果', hint: '走 A 可能带来的结局' },
      { name: 'B 的结果', hint: '走 B 可能带来的结局' }
    ]
  },
  {
    key: 'celtic',
    name: '凯尔特十字',
    count: 10,
    desc: '经典十张牌阵，深入剖析一件事的全貌。',
    positions: [
      { name: '1 现状', hint: '当下核心议题' },
      { name: '2 挑战', hint: '横在你面前的阻碍' },
      { name: '3 过去', hint: '造就现状的过往' },
      { name: '4 未来', hint: '近期将发生的事' },
      { name: '5 理想', hint: '你意识里的目标' },
      { name: '6 根源', hint: '潜意识里的动因' },
      { name: '7 你的态度', hint: '你面对此事的方式' },
      { name: '8 环境影响', hint: '外界他人的作用' },
      { name: '9 希望与恐惧', hint: '你心底的期待与担忧' },
      { name: '10 结果', hint: '事情可能的最终结局' }
    ]
  }
];

// ============ 抽牌引擎 ============
// Fisher–Yates 洗牌（无放回），返回 n 张 { card, reversed }
function shuffleAndDraw(n) {
  const pool = CARDS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  const picked = pool.slice(0, n);
  return picked.map(card => ({
    card,
    reversed: Math.random() < 0.42 // 约 42% 概率为逆位，贴近实体抽牌手感
  }));
}

// 自动解签：把牌阵位置与牌面正逆位释义组合成文本
function interpretPosition(pos, drawn) {
  const orient = drawn.reversed ? '逆位' : '正位';
  const meaning = drawn.reversed ? drawn.card.reversed : drawn.card.upright;
  return {
    position: pos.name,
    hint: pos.hint,
    cardName: drawn.card.nameZh,
    orient,
    meaning
  };
}

module.exports = {
  CARDS,
  SPREADS,
  cardLabel,
  shuffleAndDraw,
  interpretPosition
};
