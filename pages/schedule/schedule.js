const { db, serverDate } = require('../../utils/cloud');
const { todayStr, toStr } = require('../../utils/date');
const { syncTheme } = require('../../utils/theme');

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    weekHeaders: WEEK,
    year: 2026,
    month: 1,
    cells: [],          // 日历格 {day, date, inMonth, isToday, hasTodo, done, total}
    selectedDate: '',
    selectedTodos: [],   // 选中日待办 {_id, text, done}
    todoInput: '',
    today: ''
  },

  onLoad() {
    const now = new Date();
    this._all = [];
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: todayStr()
    });
    this.loadTodos();
  },

  onShow() {
    syncTheme(this);
    // 从其它入口（今天页）改动待办后回到本页时刷新
    this.loadTodos();
  },

  // 读取全部待办，构建按日期的统计
  async loadTodos() {
    const dbc = db();
    let all = [];
    try {
      const res = await dbc.collection('todos').orderBy('createdAt', 'asc').get();
      all = res.data.map(t => ({ _id: t._id, text: t.text, done: !!t.done, date: t.date || '' }));
    } catch (e) {
      // todos 集合未创建时静默忽略
    }
    this._all = all;
    this.renderCalendar();
  },

  // 根据当前年月 + 待办统计渲染日历
  renderCalendar() {
    const { year, month } = this.data;
    const all = this._all || [];

    const countMap = {};
    all.forEach(t => {
      if (!t.date) return;
      if (!countMap[t.date]) countMap[t.date] = { total: 0, done: 0 };
      countMap[t.date].total += 1;
      if (t.done) countMap[t.date].done += 1;
    });

    const first = new Date(year, month - 1, 1);
    const lead = first.getDay(); // 0=周日，前置空格数
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstCell = new Date(year, month - 1, 1 - lead);
    const count = Math.ceil((lead + daysInMonth) / 7) * 7;

    const cells = [];
    const today = this.data.today;
    for (let i = 0; i < count; i++) {
      const dt = new Date(firstCell);
      dt.setDate(firstCell.getDate() + i);
      const ds = toStr(dt);
      const info = countMap[ds];
      cells.push({
        day: dt.getDate(),
        date: ds,
        inMonth: dt.getMonth() === month - 1,
        isToday: ds === today,
        hasTodo: !!info,
        done: info ? info.done : 0,
        total: info ? info.total : 0
      });
    }

    // 默认选中今天（首次）或保持当前选中
    const sel = this.data.selectedDate || today;
    this.setData({ cells, selectedDate: sel }, () => this.renderSelected());
  },

  // 渲染选中日的待办列表
  renderSelected() {
    const sel = this.data.selectedDate;
    const list = (this._all || [])
      .filter(t => t.date === sel)
      .map(t => ({ _id: t._id, text: t.text, done: t.done }));
    this.setData({ selectedTodos: list });
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

  onInput(e) { this.setData({ todoInput: e.detail.value }); },

  async addTodo() {
    const text = (this.data.todoInput || '').trim();
    if (!text) return;
    const date = this.data.selectedDate;
    const dbc = db();
    try {
      const res = await dbc.collection('todos').add({
        data: { text, done: false, date, createdAt: serverDate() }
      });
      this._all = (this._all || []).concat({ _id: res._id, text, done: false, date });
      this.setData({ todoInput: '' });
      this.renderCalendar();
    } catch (e) {
      wx.showToast({ title: '保存失败，请确认 todos 集合已创建', icon: 'none' });
    }
  },

  async toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this._all || []).find(t => t._id === id);
    if (!item) return;
    const dbc = db();
    try {
      await dbc.collection('todos').doc(id).update({ data: { done: !item.done } });
      item.done = !item.done;
      this.renderCalendar();
    } catch (err) { /* 忽略 */ }
  },

  async delTodo(e) {
    const id = e.currentTarget.dataset.id;
    const dbc = db();
    try {
      await dbc.collection('todos').doc(id).remove();
      this._all = (this._all || []).filter(t => t._id !== id);
      this.renderCalendar();
    } catch (err) { /* 忽略 */ }
  }
});
