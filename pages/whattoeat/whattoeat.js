const { db, serverDate } = require('../../utils/cloud');
const { todayStr, toStr } = require('../../utils/date');
const { syncTheme } = require('../../utils/theme');

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

// 常用食物示例（点击即可加入当天计划）
const PRESET = [
  '火锅', '烧烤', '烤肉', '蛋包饭', '炒鸡', '板面',
  '麻辣烫', '黄焖鸡', '炸鸡', '汉堡', '披萨', '寿司',
  '螺蛳粉', '水饺', '拉面', '牛排', '沙拉', '麻辣香锅',
  '煲仔饭', '煎饼果子'
];

Page({
  data: {
    weekHeaders: WEEK,
    year: 2026,
    month: 1,
    cells: [],
    selectedDate: '',
    today: '',
    presetView: [],     // 常用食物 {name, active}
    customView: [],     // 我的收藏 {name, active}
    dayFoods: [],       // 选中日已安排的食物
    newCustom: '',
    adding: false
  },

  onLoad() {
    const now = new Date();
    this._plans = {};    // date -> [foodName]
    this._planIds = {};  // date -> doc _id
    this._customAll = [];
    this._lpGuard = false;
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: todayStr()
    });
    this.loadData();
  },

  onShow() {
    syncTheme(this);
    this.loadData();
  },

  // 读取当天安排 + 我的收藏
  async loadData() {
    const dbc = db();
    try {
      const r = await dbc.collection('eat_plan').orderBy('date', 'asc').get();
      this._plans = {};
      this._planIds = {};
      r.data.forEach(d => { this._plans[d.date] = d.foods || []; this._planIds[d.date] = d._id; });
    } catch (e) { /* eat_plan 未创建时静默忽略 */ }
    try {
      const r2 = await dbc.collection('eat_custom').orderBy('createdAt', 'asc').get();
      this._customAll = r2.data.map(x => x.name);
    } catch (e) { /* eat_custom 未创建时静默忽略 */ }

    this.setData({ adding: false, newCustom: '' }, () => {
      this.renderCalendar();
      this.renderSelected();
    });
  },

  // 渲染日历（把每天的安排填进格子）
  renderCalendar() {
    const { year, month } = this.data;
    const first = new Date(year, month - 1, 1);
    const lead = first.getDay(); // 0=周日，前置空格数
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstCell = new Date(year, month - 1, 1 - lead);
    const count = Math.ceil((lead + daysInMonth) / 7) * 7;
    const today = this.data.today;
    const cells = [];
    for (let i = 0; i < count; i++) {
      const dt = new Date(firstCell);
      dt.setDate(firstCell.getDate() + i);
      const ds = toStr(dt);
      const foods = this._plans[ds] || [];
      cells.push({
        day: dt.getDate(),
        date: ds,
        inMonth: dt.getMonth() === month - 1,
        isToday: ds === today,
        tags: foods.slice(0, 2),
        more: Math.max(0, foods.length - 2)
      });
    }
    const sel = this.data.selectedDate || today;
    this.setData({ cells, selectedDate: sel }, () => this.renderSelected());
  },

  // 把选中日的安排 + 常用/收藏的选中态同步到视图
  renderSelected() {
    const sel = this.data.selectedDate;
    const arr = (this._plans[sel] || []).slice();
    this.applyDayFoods(arr);
  },

  // 统一更新当天安排与两个区域的选中态
  applyDayFoods(arr) {
    const presetView = PRESET.map(name => ({ name, active: arr.indexOf(name) >= 0 }));
    const customView = this._customAll.map(name => ({ name, active: arr.indexOf(name) >= 0 }));
    this.setData({ dayFoods: arr, presetView, customView });
  },

  prevMonth() {
    let { year, month } = this.data;
    month -= 1;
    if (month < 1) { month = 12; year -= 1; }
    this.setData({ year, month }, () => this.renderCalendar());
  },
  nextMonth() {
    let { year, month } = this.data;
    month += 1;
    if (month > 12) { month = 1; year += 1; }
    this.setData({ year, month }, () => this.renderCalendar());
  },
  backToday() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      selectedDate: todayStr()
    }, () => this.renderCalendar());
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    this.setData({ selectedDate: date }, () => this.renderSelected());
  },

  // 切换某食物在当天的安排（点一下加入 / 再点移除）
  toggleFood(e) {
    if (this._lpGuard) { this._lpGuard = false; return; } // 长按删除后吞掉随之而来的 tap
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    const arr = this.data.dayFoods.slice();
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1); else arr.push(name);
    this.applyDayFoods(arr);
    this.savePlan(this.data.selectedDate, arr);
    this.renderCalendar();
  },

  // 从当天安排里移除（× 按钮）
  removeFood(e) {
    const name = e.currentTarget.dataset.name;
    const arr = this.data.dayFoods.slice();
    const i = arr.indexOf(name);
    if (i >= 0) arr.splice(i, 1);
    this.applyDayFoods(arr);
    this.savePlan(this.data.selectedDate, arr);
    this.renderCalendar();
  },

  // 保存当天安排（upsert）
  async savePlan(date, foods) {
    const dbc = db();
    const id = this._planIds[date];
    try {
      if (id) {
        await dbc.collection('eat_plan').doc(id).update({ data: { foods } });
      } else if (foods.length) {
        const r = await dbc.collection('eat_plan').add({ data: { date, foods, createdAt: serverDate() } });
        this._planIds[date] = r._id;
      }
      this._plans[date] = foods.slice();
    } catch (e) {
      wx.showToast({ title: '保存失败，请确认 eat_plan 集合已创建', icon: 'none' });
    }
  },

  // ---- 我的收藏（自定义食物） ----
  onCustomInput(e) { this.setData({ newCustom: e.detail.value }); },
  toggleAdd() { this.setData({ adding: !this.data.adding, newCustom: '' }); },

  async confirmAddCustom() {
    const name = (this.data.newCustom || '').trim();
    if (!name) { wx.showToast({ title: '请输入食物名称', icon: 'none' }); return; }
    if (this._customAll.indexOf(name) >= 0) {
      // 已在收藏中：直接加入当天（若未加入）
      this._addToDay(name);
      this.setData({ newCustom: '' });
      return;
    }
    const dbc = db();
    try {
      await dbc.collection('eat_custom').add({ data: { name, createdAt: serverDate() } });
      this._customAll.push(name);
      this.setData({ newCustom: '' });
      this._addToDay(name);
      wx.showToast({ title: '已加入收藏', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '保存失败，请确认 eat_custom 集合已创建', icon: 'none' });
    }
  },

  // 把某食物加入当天安排（不重复）
  _addToDay(name) {
    const arr = this.data.dayFoods.slice();
    if (arr.indexOf(name) < 0) {
      arr.push(name);
      this.applyDayFoods(arr);
      this.savePlan(this.data.selectedDate, arr);
      this.renderCalendar();
    }
  },

  // 长按收藏项 → 删除（仅删收藏，不影响已安排的日子）
  onCustomLongPress(e) {
    const name = e.currentTarget.dataset.name;
    this._lpGuard = true;
    setTimeout(() => { this._lpGuard = false; }, 400);
    wx.showModal({
      title: '删除收藏',
      content: '从「我的收藏」删除「' + name + '」？\n（仅删除收藏，已安排的日子不受影响）',
      confirmColor: '#e64340',
      success: (r) => { if (r.confirm) this.delCustom(name); }
    });
  },

  async delCustom(name) {
    const dbc = db();
    try {
      const res = await dbc.collection('eat_custom').where({ name }).get();
      for (const d of res.data) {
        await dbc.collection('eat_custom').doc(d._id).remove();
      }
      this._customAll = this._customAll.filter(x => x !== name);
      this.applyDayFoods(this.data.dayFoods);
      wx.showToast({ title: '已删除', icon: 'none' });
    } catch (e) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  noop() {}
});
