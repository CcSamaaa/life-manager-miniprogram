const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const { syncTheme } = require('../../utils/theme');

const CATEGORIES = [
  { key: 'food', emoji: '🍜', name: '餐饮' },
  { key: 'transport', emoji: '🚌', name: '交通' },
  { key: 'shopping', emoji: '🛒', name: '购物' },
  { key: 'fun', emoji: '🎮', name: '娱乐' },
  { key: 'medical', emoji: '🏥', name: '医疗' },
  { key: 'study', emoji: '📚', name: '学习' },
  { key: 'home', emoji: '🏠', name: '居住' },
  { key: 'income', emoji: '💰', name: '收入' },
  { key: 'other', emoji: '✏️', name: '其他' }
];

function fmt(n) {
  return (Math.round(n * 100) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

Page({
  data: {
    monthLabel: '',
    summary: { expense: 0, income: 0, balance: 0 },
    groups: [],
    categories: CATEGORIES,
    showAdd: false,
    form: { type: 'expense', catKey: 'food', amount: '', note: '' },
    loading: true
  },

  onShow() {
    syncTheme(this);
    this.loadBills();
  },

  noop() {},

  loadBills() {
    const openid = app.globalData.openid;
    if (!openid) {
      setTimeout(() => this.loadBills(), 600);
      return;
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const pad = (n) => String(n).padStart(2, '0');
    const monthLabel = `${y}年${m}月`;
    const start = `${y}-${pad(m)}-01`;
    this.setData({ monthLabel, loading: true });
    db.collection('bills')
      .where({ date: _.gte(start) })
      .orderBy('date', 'desc')
      .orderBy('createTime', 'desc')
      .get()
      .then((res) => this.process(res.data))
      .catch(() => {
        this.setData({
          loading: false,
          groups: [],
          summary: { expense: 0, income: 0, balance: 0 }
        });
      });
  },

  process(list) {
    let expense = 0;
    let income = 0;
    const map = {};
    list.forEach((b) => {
      if (b.type === 'income') income += b.amount;
      else expense += b.amount;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    const groups = Object.keys(map)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((d) => ({
        date: d,
        weekday: this.weekday(d),
        items: map[d]
      }));
    this.setData({
      loading: false,
      groups,
      summary: { expense, income, balance: income - expense }
    });
  },

  weekday(d) {
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return names[new Date(d.replace(/-/g, '/')).getDay()];
  },

  // ---- 新增 ----
  openAdd() {
    this.setData({
      showAdd: true,
      form: { type: 'expense', catKey: 'food', amount: '', note: '' }
    });
  },
  closeAdd() {
    this.setData({ showAdd: false });
  },
  pickType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type });
  },
  pickCat(e) {
    this.setData({ 'form.catKey': e.currentTarget.dataset.key });
  },
  onAmount(e) {
    this.setData({ 'form.amount': e.detail.value });
  },
  onNote(e) {
    this.setData({ 'form.note': e.detail.value });
  },

  saveBill() {
    const f = this.data.form;
    const amount = parseFloat(f.amount);
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    const cat = CATEGORIES.find((c) => c.key === f.catKey);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const record = {
      type: f.type,
      catKey: cat.key,
      emoji: cat.emoji,
      name: cat.name,
      amount: Math.round(amount * 100) / 100,
      note: (f.note || '').trim(),
      date,
      createTime: now.getTime()
    };
    wx.showLoading({ title: '保存中', mask: true });
    db.collection('bills')
      .add({ data: record })
      .then(() => {
        wx.hideLoading();
        this.setData({ showAdd: false });
        this.loadBills();
        wx.showToast({ title: '已记录', icon: 'success' });
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },

  delBill(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这笔记录？',
      success: (r) => {
        if (r.confirm) {
          db.collection('bills')
            .doc(id)
            .remove()
            .then(() => this.loadBills());
        }
      }
    });
  }
});
