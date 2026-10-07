const tarot = require('../../utils/tarot.js');
const { applyNavBar } = require('../../utils/theme');

const CATEGORIES = ['综合', '爱情', '事业', '财运', '健康'];

Page({
  data: {
    step: 'spread',            // spread | focus | draw | result
    spreads: tarot.SPREADS,
    categories: CATEGORIES,
    selectedSpread: null,
    question: '',
    category: '综合',
    plan: [],                  // 抽出的牌：{card, reversed, posName, posHint, revealed}
    drawnCount: 0,
    shuffling: false,
    interpretations: [],
    summary: '',
    // ===== AI 解读 / 追问 =====
    aiLoading: false,
    showChat: false,
    chatMessages: [],   // 展示用：[{role:'user'|'assistant', content}]
    apiMessages: [],    // 传给模型的全量对话（首条为结构化提示，不展示）
    chatInput: '',
    scrollIntoId: '',
    aiMock: false
  },

  onLoad() {
    this.setData({ spreads: tarot.SPREADS });
  },

  onShow() {
    applyNavBar('dark');
  },

  // 步骤一：选择牌阵
  selectSpread(e) {
    const spread = this.data.spreads[e.currentTarget.dataset.idx];
    this.setData({
      selectedSpread: spread,
      question: '',
      category: '综合',
      step: 'focus'
    });
  },

  backToSpread() {
    this.setData({ step: 'spread', selectedSpread: null });
  },

  onQuestion(e) {
    this.setData({ question: e.detail.value });
  },

  onCategory(e) {
    this.setData({ category: e.currentTarget.dataset.cat });
  },

  // 步骤二→三：洗牌抽牌
  startDraw() {
    const spread = this.data.selectedSpread;
    if (!spread) return;
    this.setData({ shuffling: true, drawnCount: 0, plan: [] });
    // 洗牌动画约 0.9s，贴合实体"洗牌切牌"的仪式感
    setTimeout(() => {
      const draws = tarot.shuffleAndDraw(spread.count);
      const plan = draws.map((d, i) => ({
        card: d.card,
        reversed: d.reversed,
        label: tarot.cardLabel(d.card),
        posName: spread.positions[i].name,
        posHint: spread.positions[i].hint,
        revealed: false
      }));
      this.setData({ shuffling: false, plan, step: 'draw' });
    }, 900);
  },

  // 步骤三：点击牌背，逐张抽牌翻面
  drawCard() {
    const { plan, drawnCount } = this.data;
    if (this.data.shuffling) return;
    if (drawnCount >= plan.length) return;
    plan[drawnCount].revealed = true;
    const next = drawnCount + 1;
    this.setData({ plan: plan.slice(), drawnCount: next });
    if (next >= plan.length) {
      // 最后一张翻开后，稍作停顿再进入解读
      setTimeout(() => this.buildResult(), 700);
    }
  },

  // 步骤四：生成自动解签
  buildResult() {
    const { plan, selectedSpread, question, category } = this.data;
    const interpretations = plan.map((p, i) =>
      tarot.interpretPosition(selectedSpread.positions[i], p)
    );

    // 整体总结
    const q = question ? `关于「${question}」，` : '';
    const head = `本次「${selectedSpread.name}」为${q}${category}领域所抽。`;
    const lines = interpretations.map(it =>
      `「${it.position}」抽到 ${it.cardName}${it.orient === '逆位' ? '（逆位）' : ''}`
    );
    const tail = '牌面交织出的基调，请结合自身处境从容体会。塔罗是映照内心的镜子，结果仅供娱乐与自我觉察参考。';
    const summary = head + lines.join('；') + '。' + tail;

    this.setData({
      interpretations,
      summary,
      step: 'result',
      // 每次新占卜重置 AI 对话状态
      aiLoading: false,
      showChat: false,
      chatMessages: [],
      apiMessages: [],
      chatInput: '',
      aiMock: false
    });
  },

  // ============ AI 解读 + 追问 ============
  // 打开对话框，首次用「问题 + 牌面」请求 AI 解读
  openAiChat() {
    const { question, selectedSpread, category, interpretations } = this.data;
    if (this.data.aiLoading) return;
    const cards = interpretations.map((it) => ({
      position: it.position,
      cardName: it.cardName,
      orient: it.orient,
      meaning: it.meaning
    }));
    const firstPrompt =
      `【问题】${question || '（用户未填写具体问题，请做整体指引式解读）'}\n` +
      `【牌阵】${selectedSpread.name}（领域：${category}）\n` +
      `【抽出的牌】\n` +
      cards.map((c, i) => `${i + 1}. 位置「${c.position}」：${c.cardName}（${c.orient}）\n   牌义：${c.meaning}`).join('\n') +
      `\n\n请基于以上问题、牌阵与牌面，给出一段连贯、有温度的解读，并自然地呼应用户的问题。`;
    const displayQ = question ? `我的问题：${question}` : '（未填写具体问题，请结合牌阵整体解读）';

    this.setData({
      showChat: true,
      aiLoading: true,
      aiMock: false,
      chatMessages: [{ role: 'user', content: displayQ }],
      apiMessages: [{ role: 'user', content: firstPrompt }],
      scrollIntoId: 'msg-0'
    });

    wx.cloud.callFunction({
      name: 'aiTarot',
      data: { messages: this.data.apiMessages },
      success: (r) => {
        const d = r.result || {};
        if (!d.ok) {
          this.appendAssistant(d.msg || '解读失败');
          this.setData({ aiLoading: false });
          return;
        }
        this.appendAssistant(d.answer);
        this.setData({ aiLoading: false, aiMock: !!d.mock, apiMessages: d.messages || this.data.apiMessages });
      },
      fail: (err) => {
        this.appendAssistant('调用失败：' + ((err && err.errMsg) || ''));
        this.setData({ aiLoading: false });
      }
    });
  },

  // 把 AI 回复追加到展示列表，并滚动到底
  appendAssistant(content) {
    const list = this.data.chatMessages.concat([{ role: 'assistant', content }]);
    this.setData({ chatMessages: list, scrollIntoId: 'msg-' + (list.length - 1) });
  },

  onChatInput(e) {
    this.setData({ chatInput: e.detail.value });
  },

  // 追问：把用户问题追加进对话再请求，保持完整上下文
  sendFollowUp() {
    const text = (this.data.chatInput || '').trim();
    if (!text || this.data.aiLoading) return;
    if (this.data.apiMessages.length === 0) return;

    const chat = this.data.chatMessages.concat([{ role: 'user', content: text }]);
    const api = this.data.apiMessages.concat([{ role: 'user', content: text }]);
    this.setData({
      chatMessages: chat,
      apiMessages: api,
      chatInput: '',
      aiLoading: true,
      scrollIntoId: 'msg-' + (chat.length - 1)
    });

    wx.cloud.callFunction({
      name: 'aiTarot',
      data: { messages: api },
      success: (r) => {
        const d = r.result || {};
        if (!d.ok) {
          this.appendAssistant(d.msg || '追问失败');
          this.setData({ aiLoading: false });
          return;
        }
        this.appendAssistant(d.answer);
        this.setData({ aiLoading: false, aiMock: !!d.mock, apiMessages: d.messages || this.data.apiMessages });
      },
      fail: (err) => {
        this.appendAssistant('调用失败：' + ((err && err.errMsg) || ''));
        this.setData({ aiLoading: false });
      }
    });
  },

  closeChat() {
    this.setData({ showChat: false });
  },

  stopProp() {},

  // 重新占卜
  reset() {
    this.setData({
      step: 'spread',
      selectedSpread: null,
      question: '',
      category: '综合',
      plan: [],
      drawnCount: 0,
      interpretations: [],
      summary: '',
      aiLoading: false,
      showChat: false,
      chatMessages: [],
      apiMessages: [],
      chatInput: '',
      aiMock: false
    });
  }
});
