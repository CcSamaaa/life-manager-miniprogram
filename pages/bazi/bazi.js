const app = getApp();
const db = wx.cloud.database();
const bazi = require('../../utils/bazi.js');
const { syncTheme } = require('../../utils/theme');

// 地支对应生肖（用于天干地支旁的小标注）
const ZODIAC_ANIMALS = ['🐀', '🐂', '🐯', '🐰', '🐲', '🐍', '🐴', '🐏', '🐵', '🐔', '🐶', '🐘'];

// 五行名 → 英文映射
const ELEM_EN_MAP = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };

Page({
  data: {
    date: '',
    time: '12:00',
    gender: '男',
    result: null,
    showResult: false,
    savedId: '',
    activeTab: 'chart',
    maxDate: ''
  },

  onShow() {
    syncTheme(this);
    // 设置日期选择器最大值为今天
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    this.setData({ maxDate: y + '-' + m + '-' + d });
    this.loadSaved();
  },

  noop() {},

  loadSaved() {
    const openid = app.globalData.openid;
    if (!openid) {
      setTimeout(() => this.loadSaved(), 600);
      return;
    }
    db.collection('bazi')
      .get()
      .then((res) => {
        if (res.data && res.data.length) {
          const r = res.data[0];
          this.doCompute(r.date, r.time, r.gender, r._id);
        }
      })
      .catch(() => {});
  },

  doCompute(date, time, gender, savedId) {
    if (!date) return;
    const result = bazi.compute({
      year: +date.slice(0, 4),
      month: +date.slice(5, 7),
      day: +date.slice(8, 10),
      hour: +time.slice(0, 2),
      minute: +time.slice(3, 5),
      gender
    });

    // 预处理数据供模板使用
    // 日主五行英文
    result.dayMasterElemEn = ELEM_EN_MAP[result.pillars[2].ganElem] || 'wood';

    // 每柱天干/地支的五行英文
    result.pillars.forEach(p => {
      p.ganElemEn = ELEM_EN_MAP[p.ganElem] || 'wood';
      p.zhiElemEn = ELEM_EN_MAP[p.zhiElem] || 'wood';
    });

    // 藏干五行英文
    result.hiddenData.forEach(hd => {
      hd.forEach(h => {
        h.elemEn = ELEM_EN_MAP[h.elem] || 'wood';
      });
    });

    // 生肖动物数组
    this.setData({ zodiacAnimals: ZODIAC_ANIMALS });

    // 空亡标记：每柱是否落空亡
    const isVoid = [false, false, false, false];
    result.voidPair.forEach(vZhi => {
      result.pillars.forEach((p, i) => {
        if (p.zhiIdx === vZhi) isVoid[i] = true;
      });
    });
    result.isVoid = isVoid;

    // 神煞按柱位置分组
    const shaByPos = [[], [], [], []];
    result.shenSha.forEach(s => {
      if (s.pos >= 0 && s.pos < 4) shaByPos[s.pos].push(s);
    });
    result.shaByPos = shaByPos;

    this.setData({
      savedId: savedId || '',
      date,
      time,
      gender,
      result,
      showResult: true,
      activeTab: 'chart'
    });
  },

  onDate(e) {
    this.setData({ date: e.detail.value });
  },
  onTime(e) {
    this.setData({ time: e.detail.value });
  },
  onGender(e) {
    this.setData({ gender: e.detail.value });
  },

  calc() {
    const { date, time, gender } = this.data;
    if (!date) {
      wx.showToast({ title: '请选择出生日期', icon: 'none' });
      return;
    }
    this.doCompute(date, time, gender, this.data.savedId);
  },

  save() {
    const { date, time, gender, savedId } = this.data;
    if (!date) {
      wx.showToast({ title: '请选择出生日期', icon: 'none' });
      return;
    }
    const data = { date, time, gender };
    wx.showLoading({ title: '保存中', mask: true });
    const done = () => {
      wx.hideLoading();
      this.loadSaved();
      wx.showToast({ title: '已保存', icon: 'success' });
    };
    if (savedId) {
      db.collection('bazi').doc(savedId).update({ data }).then(done).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
    } else {
      db.collection('bazi').add({ data }).then(done).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  edit() {
    this.setData({ showResult: false });
  }
});
