const { db, serverDate } = require('../../utils/cloud');
const { todayStr, toStr } = require('../../utils/date');
const { syncTheme } = require('../../utils/theme');

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

// 内置心情（不同颜色代表不同情绪）
const BUILTIN = [
  { key: 'happy', label: '开心', color: '#ffd43b', emoji: '😊' },
  { key: 'calm', label: '平静', color: '#4dabf7', emoji: '😌' },
  { key: 'sad', label: '难过', color: '#5c7cfa', emoji: '😢' },
  { key: 'angry', label: '愤怒', color: '#ff6b6b', emoji: '😠' },
  { key: 'anxious', label: '焦虑', color: '#f783ac', emoji: '😰' },
  { key: 'tired', label: '疲惫', color: '#9775fa', emoji: '😴' },
  { key: 'excited', label: '兴奋', color: '#ff922b', emoji: '🤩' },
  { key: 'love', label: '爱了', color: '#f06595', emoji: '🥰' }
];

// 自定义心情可选的颜色板
const PALETTE = [
  '#ff6b6b', '#ff922b', '#ffd43b', '#a9e34b', '#51cf66', '#22b8cf',
  '#4dabf7', '#5c7cfa', '#9775fa', '#f06595', '#f783ac', '#868e96'
];

Page({
  data: {
    weekHeaders: WEEK,
    year: 2026,
    month: 1,
    cells: [],            // 日历格 {day, date, inMonth, isToday, color}
    selectedDate: '',
    today: '',
    builtinMoods: BUILTIN,
    customMoods: [],
    allMoods: BUILTIN,    // 内置 + 自定义
    selectedKey: '',
    selectedLabel: '',
    selectedColor: '',
    note: '',
    showAdd: false,
    newLabel: '',
    newColor: PALETTE[0],
    palette: PALETTE
  },

  onLoad() {
    const now = new Date();
    this._logs = {}; // date -> {_id, moodKey, label, color, note}
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

  // 读取心情记录 + 自定义心情
  async loadData() {
    const dbc = db();
    let logs = [];
    let customs = [];
    try {
      const r1 = await dbc.collection('mood_logs').orderBy('date', 'desc').get();
      logs = r1.data;
    } catch (e) { /* mood_logs 集合未创建时静默忽略 */ }
    try {
      const r2 = await dbc.collection('mood_types').orderBy('createdAt', 'asc').get();
      customs = r2.data.map(m => ({ key: m.key || ('c_' + m._id), label: m.label, color: m.color }));
    } catch (e) { /* mood_types 集合未创建时静默忽略 */ }

    this._logs = {};
    logs.forEach(l => {
      this._logs[l.date] = {
        _id: l._id,
        moodKey: l.moodKey,
        label: l.label,
        color: l.color,
        note: l.note || ''
      };
    });
    this.setData({ customMoods: customs, allMoods: BUILTIN.concat(customs) }, () => {
      this.renderCalendar();
    });
  },

  // 渲染日历（把每天的心情颜色填进格子）
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
      const rec = this._logs[ds];
      cells.push({
        day: dt.getDate(),
        date: ds,
        inMonth: dt.getMonth() === month - 1,
        isToday: ds === today,
        color: rec && rec.moodKey ? rec.color : '' // 有心情则带上颜色
      });
    }

    const sel = this.data.selectedDate || today;
    this.setData({ cells, selectedDate: sel }, () => this.renderSelected());
  },

  // 渲染选中日的心情与备注
  renderSelected() {
    const sel = this.data.selectedDate;
    const rec = this._logs[sel];
    this.setData({
      selectedKey: rec ? rec.moodKey : '',
      selectedLabel: rec ? rec.label : '',
      selectedColor: rec ? rec.color : '',
      note: rec ? rec.note : ''
    });
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

  // 选择心情（立即保存）
  selectMood(e) {
    const key = e.currentTarget.dataset.key;
    const m = (this.data.allMoods || []).find(x => x.key === key);
    if (!m) return;
    this.setData({
      selectedKey: m.key,
      selectedLabel: m.label,
      selectedColor: m.color
    }, () => this.saveLog());
  },

  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  // 保存当天心情 + 备注
  async saveLog() {
    const sel = this.data.selectedDate;
    if (!sel) return;
    const dbc = db();
    const payload = {
      date: sel,
      moodKey: this.data.selectedKey || '',
      label: this.data.selectedLabel || '',
      color: this.data.selectedColor || '',
      note: this.data.note || ''
    };
    try {
      const existing = this._logs[sel];
      if (existing && existing._id) {
        await dbc.collection('mood_logs').doc(existing._id).update({ data: payload });
      } else {
        const r = await dbc.collection('mood_logs').add({
          data: Object.assign({}, payload, { createdAt: serverDate() })
        });
        this._logs[sel] = Object.assign({ _id: r._id }, payload);
      }
      this.renderCalendar();
    } catch (err) {
      wx.showToast({ title: '保存失败，请确认 mood_logs 集合已创建', icon: 'none' });
    }
  },

  // 删除当天记录
  async delLog() {
    const sel = this.data.selectedDate;
    const existing = this._logs[sel];
    if (!existing || !existing._id) return;
    const dbc = db();
    try {
      await dbc.collection('mood_logs').doc(existing._id).remove();
      delete this._logs[sel];
      this.setData({ selectedKey: '', selectedLabel: '', selectedColor: '', note: '' });
      this.renderCalendar();
    } catch (err) { /* 忽略 */ }
  },

  // ---- 自定义心情 ----
  openAddMood() {
    this.setData({ showAdd: true, newLabel: '', newColor: this.data.palette[0] });
  },
  closeAdd() { this.setData({ showAdd: false }); },
  onNewLabel(e) { this.setData({ newLabel: e.detail.value }); },
  pickColor(e) { this.setData({ newColor: e.currentTarget.dataset.color }); },
  noop() {},

  async confirmAddMood() {
    const label = (this.data.newLabel || '').trim();
    if (!label) { wx.showToast({ title: '请输入心情名称', icon: 'none' }); return; }
    const color = this.data.newColor;
    const key = 'c_' + Date.now();
    const dbc = db();
    try {
      await dbc.collection('mood_types').add({ data: { key, label, color, createdAt: serverDate() } });
      const m = { key, label, color };
      const customs = this.data.customMoods.concat(m);
      this.setData({
        customMoods: customs,
        allMoods: BUILTIN.concat(customs),
        showAdd: false
      });
      // 新建后自动选为当天心情并保存
      this.setData({ selectedKey: key, selectedLabel: label, selectedColor: color }, () => this.saveLog());
    } catch (err) {
      wx.showToast({ title: '保存失败，请确认 mood_types 集合已创建', icon: 'none' });
    }
  }
});
