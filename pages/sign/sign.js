const signLib = require('../../utils/sign.js');
const { applyNavBar } = require('../../utils/theme');

Page({
  data: {
    categories: signLib.CATEGORIES,
    selectedKey: '',
    hasDrawn: false,
    drawing: false,
    result: null,        // { level, poem, interpret, yi, ji, color }
    categoryName: '',
    today: ''
  },

  onLoad() {
    const rec = signLib.loadTodaySign();
    const today = signLib.todayKey();
    if (rec) {
      const cat = signLib.categoryByKey(rec.category);
      this.setData({
        hasDrawn: true,
        drawing: false,
        result: rec.sign,
        selectedKey: rec.category,
        categoryName: cat.name,
        today
      });
    } else {
      this.setData({ hasDrawn: false, drawing: false, result: null, selectedKey: '', today });
    }
  },

  onShow() {
    applyNavBar('dark');
    // 跨日进入时刷新（次日自动可再抽）
    const rec = signLib.loadTodaySign();
    if (!rec && this.data.hasDrawn) {
      this.setData({ hasDrawn: false, drawing: false, result: null, selectedKey: '' });
    }
  },

  // 选档位（仅未抽时有效）
  selectCategory(e) {
    if (this.data.hasDrawn || this.data.drawing) return;
    const key = e.currentTarget.dataset.key;
    this.setData({ selectedKey: key });
  },

  // 求签
  draw() {
    if (this.data.hasDrawn) {
      wx.showToast({ title: '今日已抽签，明日再来', icon: 'none' });
      return;
    }
    if (this.data.drawing) return;
    const key = this.data.selectedKey || 'general';
    this.setData({ drawing: true });
    // 签筒晃动动画后揭晓
    setTimeout(() => {
      const s = signLib.drawSign(key);
      signLib.saveTodaySign(key, s);
      const cat = signLib.categoryByKey(key);
      this.setData({
        drawing: false,
        hasDrawn: true,
        result: s,
        categoryName: cat.name
      });
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    }, 850);
  },

  // 长按标题：清除今日签（便于测试，界面不显示按钮）
  resetForTest() {
    signLib.clearTodaySign();
    this.setData({ hasDrawn: false, drawing: false, result: null, selectedKey: '' });
    wx.showToast({ title: '已清除（测试）', icon: 'none' });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
