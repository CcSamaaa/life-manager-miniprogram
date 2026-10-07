const app = getApp();
const liuyao = require('../../utils/liuyao.js');
const { syncTheme } = require('../../utils/theme');

// 五行名 → 英文映射（用于着色 class）
const ELEM_EN_MAP = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };

Page({
  data: {
    casting: false,      // 投掷动画中
    dice: [1, 1, 1],     // 动画中的三个骰子
    result: null,        // 解卦结果
    ben: [],             // 本卦六爻（上→下）
    bian: [],            // 变卦六爻（上→下，仅变卦存在）
    table: [],           // 排盘表格行（初→上）
    showDetail: false,   // 投掷明细展开
    history: []          // 历史记录
  },

  onShow() {
    syncTheme(this);
    this.loadHistory();
  },

  noop() {},

  // 点击「投卦」：三枚骰子滚动动画后起一卦
  throw() {
    if (this.data.casting) return;
    this.setData({ casting: true, result: null, ben: [], bian: [], table: [], showDetail: false, dice: [1, 1, 1] });

    let ticks = 0;
    const timer = setInterval(() => {
      ticks++;
      this.setData({
        dice: [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]
      });
      if (ticks >= 12) {
        clearInterval(timer);
        const lines = liuyao.castHexagram();
        const result = liuyao.analyze(lines, new Date());
        this.buildDisplay(result);
        this.setData({ casting: false, result });
        this.saveHistory(lines, result);
      }
    }, 70);
  },

  // 由 result 组装本卦/变卦爻象与排盘表格
  buildDisplay(result) {
    const N = 6;
    const ben = [];
    const bian = [];
    const table = [];
    const p = result.primary;

    for (let i = N - 1; i >= 0; i--) {
      const r = result.rows[i];
      ben.push({ yang: r.yang, changing: r.changing, value: r.value, type: r.type, label: r.label });
      if (result.hasChanged && result.changed) {
        const yang = result.changed.bin[i] === 1;
        bian.push({ yang, changing: r.changing, label: r.label, lineText: result.changed.lines[i] });
      }
    }

    for (let i = 0; i < N; i++) {
      const r = result.rows[i];
      const role = p.shi === i + 1 ? '世' : (p.ying === i + 1 ? '应' : '');
      table.push({
        index: i,
        label: r.label,
        role,
        roleClass: role === '世' ? 'role-shi' : (role === '应' ? 'role-ying' : ''),
        god: r.god,
        six: r.six,
        na: r.na,
        naElem: r.naElem,
        naElemEn: ELEM_EN_MAP[r.naElem] || 'wood',
        lineText: r.lineText
      });
    }

    this.setData({ ben, bian, table });
  },

  toggleDetail() {
    this.setData({ showDetail: !this.data.showDetail });
  },

  // 保存到云端历史
  saveHistory(lines, result) {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) {
      setTimeout(() => this.saveHistory(lines, result), 600);
      return;
    }
    const rec = liuyao.historyRecord(lines, result);
    const db = wx.cloud.database();
    db.collection('liuyao').add({
      data: Object.assign({}, rec, { result })
    }).then(() => {
      this.loadHistory();
    }).catch(() => {});
  },

  // 读取历史
  loadHistory() {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) {
      setTimeout(() => this.loadHistory(), 600);
      return;
    }
    const db = wx.cloud.database();
    db.collection('liuyao')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
      .then((res) => {
        const list = (res.data || []).map((d) => ({
          _id: d._id,
          primarySym: d.primarySym,
          primaryName: d.primaryName,
          changedName: d.changedName,
          changedSym: d.changedSym,
          changingCount: d.changingCount,
          rule: d.rule,
          dayGan: d.dayGan,
          createdAt: d.createdAt,
          timeText: this.fmtTime(d.createdAt)
        }));
        this.setData({ history: list });
      })
      .catch(() => {});
  },

  fmtTime(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  // 点击历史记录，重新查看该卦
  viewHistory(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.history.find((h) => h._id === id);
    if (!item) return;
    // 从云端取完整结果
    const db = wx.cloud.database();
    db.collection('liuyao').doc(id).get().then((res) => {
      const result = res.data.result;
      if (!result) return;
      this.buildDisplay(result);
      this.setData({ result, showDetail: false });
      wx.pageScrollTo({ scrollTop: 0, duration: 300 });
    }).catch(() => {});
  },

  clearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定要清空全部六爻记录吗？',
      success: (r) => {
        if (!r.confirm) return;
        const openid = app.globalData && app.globalData.openid;
        if (!openid) return;
        const db = wx.cloud.database();
        // 逐个删除（仅创建者可读写权限下安全）
        const ids = this.data.history.map((h) => h._id);
        if (!ids.length) return;
        let done = 0;
        ids.forEach((id) => {
          db.collection('liuyao').doc(id).remove().then(() => {
            done++;
            if (done === ids.length) this.loadHistory();
          }).catch(() => {
            done++;
            if (done === ids.length) this.loadHistory();
          });
        });
      }
    });
  }
});
