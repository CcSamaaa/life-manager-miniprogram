const db = wx.cloud.database();
const COL = 'period_logs';
const { getOpenid } = require('../../utils/cloud');
const { todayStr, toStr } = require('../../utils/date');
const { computeStats, dayState, todayStatus, buildHistories, dateDiffDays } = require('../../utils/period');
const { syncTheme } = require('../../utils/theme');

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

const SETTINGS_KEY = 'periodSettings';

Page({
  data: {
    // 日历
    year: 0,
    month: 0,
    monthLabel: '',
    calendar: [],
    // 状态
    statusType: '',     // period / fertile / soon / normal / none
    statusText: '',
    ongoing: false,     // 是否有进行中的经期
    avgCycle: 28,
    avgLength: 5,
    // 数据
    periods: [],
    histories: [],
    // 设置
    settings: { cycleLength: 28, periodLength: 5 },
    // 添加弹窗
    showAdd: false,
    addStart: '',
    addEnd: '',
    // 设置弹窗
    showSetting: false,
    setCycle: '28',
    setLength: '5',
    loading: true
  },

  onLoad() {
    const now = new Date();
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1, addStart: todayStr(), addEnd: todayStr() });
  },

  onShow() {
    syncTheme(this);
    this.load();
  },

  noop() {},

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    // 读取本地设置
    const settings = wx.getStorageSync(SETTINGS_KEY) || { cycleLength: 28, periodLength: 5 };
    this.setData({ settings, setCycle: String(settings.cycleLength), setLength: String(settings.periodLength) });

    // 读取经期记录
    let periods = [];
    try {
      const openid = await getOpenid();
      if (openid) {
        const res = await db.collection(COL).orderBy('start', 'desc').get();
        periods = res.data.map(p => ({
          _id: p._id,
          start: p.start,
          end: p.end || null,
          note: p.note || ''
        }));
      }
    } catch (e) {
      // 集合未创建时忽略，进入空状态
    }

    const stats = computeStats(periods, settings);
    const today = todayStr();
    const st = todayStatus(today, periods, stats);
    let statusType = 'none', statusText = '记录一次经期后即可预测';
    if (st.onPeriod) {
      statusType = 'period';
      statusText = '经期第 ' + st.periodDay + ' 天';
    } else if (st.inFertile) {
      statusType = 'fertile';
      statusText = '易孕期（排卵期）';
    } else if (st.daysToNext != null) {
      if (st.daysToNext === 0) { statusType = 'soon'; statusText = '预计今天来月经'; }
      else if (st.daysToNext > 0) { statusType = 'normal'; statusText = '距离下次经期约 ' + st.daysToNext + ' 天'; }
      else { statusType = 'normal'; statusText = '下次经期已逾期 ' + Math.abs(st.daysToNext) + ' 天'; }
    }

    const ongoing = periods.some(p => !p.end);

    this.setData({
      periods,
      histories: buildHistories(periods).reverse(), // 最近的在前
      avgCycle: stats.avgCycle,
      avgLength: stats.avgLength,
      statusType,
      statusText,
      ongoing,
      loading: false
    });
    this.buildCalendar(stats);
  },

  // ===== 日历 =====
  buildCalendar(statsArg) {
    const stats = statsArg || this._lastStats;
    this._lastStats = stats;
    if (!stats) return;
    const { year, month, periods } = this.data;
    const today = todayStr();
    const first = new Date(year, month - 1, 1);
    const startWeekday = first.getDay(); // 0=周日
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];

    const prevDays = new Date(year, month - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, other: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = year + '-' + pad2(month) + '-' + pad2(d);
      const state = dayState(ds, periods, stats, today);
      cells.push({ day: d, ds, state, isToday: ds === today, other: false });
    }
    while (cells.length % 7 !== 0) cells.push({ day: '', other: true });

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    this.setData({
      calendar: weeks,
      monthLabel: year + '年' + month + '月',
      _stats: stats
    });
  },

  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) { month = 12; year--; }
    this.setData({ year, month }, () => this.buildCalendar(this._lastStats));
  },

  nextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) { month = 1; year++; }
    this.setData({ year, month }, () => this.buildCalendar(this._lastStats));
  },

  tapDay(e) {
    const ds = e.currentTarget.dataset.ds;
    if (!ds) return;
    const { periods } = this.data;
    const stats = this._lastStats;
    const today = todayStr();
    const state = dayState(ds, periods, stats, today);
    let label = ds;
    if (state === 'period') label += ' · 经期';
    else if (state === 'predicted') label += ' · 预测经期';
    else if (state === 'fertile') label += ' · 易孕期';
    else label += ' · 非经期';
    wx.showToast({ title: label, icon: 'none' });
  },

  // ===== 记录操作 =====
  async recordToday() {
    const openid = await getOpenid();
    if (!openid) { wx.showToast({ title: '云环境未配置', icon: 'none' }); return; }
    const today = todayStr();
    // 若今天已在某次经期内，忽略
    const exists = this.data.periods.some(p => {
      const end = p.end || today;
      return today >= p.start && today <= end;
    });
    if (exists) { wx.showToast({ title: '今天已在经期内', icon: 'none' }); return; }
    wx.showLoading({ title: '记录中' });
    try {
      await db.collection(COL).add({ data: { start: today, end: null, note: '' } });
      wx.hideLoading();
      wx.showToast({ title: '已开始', icon: 'success' });
      this.load();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '记录失败，请确认集合已创建', icon: 'none' });
    }
  },

  async endToday() {
    const ongoing = this.data.periods.find(p => !p.end);
    if (!ongoing) return;
    const today = todayStr();
    wx.showLoading({ title: '记录中' });
    try {
      await db.collection(COL).doc(ongoing._id).update({ data: { end: today } });
      wx.hideLoading();
      wx.showToast({ title: '已结束', icon: 'success' });
      this.load();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // ===== 添加历史 =====
  openAdd() {
    this.setData({ showAdd: true, addStart: todayStr(), addEnd: todayStr() });
  },
  closeAdd() { this.setData({ showAdd: false }); },
  onAddStart(e) { this.setData({ addStart: e.detail.value }); },
  onAddEnd(e) { this.setData({ addEnd: e.detail.value }); },
  async confirmAdd() {
    const s = this.data.addStart.trim();
    let e2 = this.data.addEnd.trim();
    if (!s) { wx.showToast({ title: '请选择开始日期', icon: 'none' }); return; }
    if (!e2 || e2 < s) e2 = s; // 结束不早于开始
    if (dateDiffDays(s, e2) > 45) { wx.showToast({ title: '经期过长，请检查', icon: 'none' }); return; }
    const openid = await getOpenid();
    if (!openid) { wx.showToast({ title: '云环境未配置', icon: 'none' }); return; }
    wx.showLoading({ title: '保存中' });
    try {
      await db.collection(COL).add({ data: { start: s, end: e2, note: '' } });
      wx.hideLoading();
      this.setData({ showAdd: false });
      wx.showToast({ title: '已添加', icon: 'success' });
      this.load();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败，请确认集合已创建', icon: 'none' });
    }
  },

  // ===== 删除 =====
  delPeriod(e) {
    const id = e.currentTarget.dataset.id;
    const self = this;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条经期记录吗？',
      confirmColor: '#e64340',
      success(r) {
        if (!r.confirm) return;
        db.collection(COL).doc(id).remove({
          success() { self.load(); },
          fail() { wx.showToast({ title: '删除失败', icon: 'none' }); }
        });
      }
    });
  },

  // ===== 设置 =====
  openSetting() {
    this.setData({ showSetting: true, setCycle: String(this.data.settings.cycleLength), setLength: String(this.data.settings.periodLength) });
  },
  closeSetting() { this.setData({ showSetting: false }); },
  onSetCycle(e) { this.setData({ setCycle: e.detail.value }); },
  onSetLength(e) { this.setData({ setLength: e.detail.value }); },
  saveSetting() {
    const cycleLength = Math.max(15, Math.min(60, parseInt(this.data.setCycle, 10) || 28));
    const periodLength = Math.max(1, Math.min(15, parseInt(this.data.setLength, 10) || 5));
    const settings = { cycleLength, periodLength };
    wx.setStorageSync(SETTINGS_KEY, settings);
    this.setData({ showSetting: false, settings });
    wx.showToast({ title: '已保存', icon: 'success' });
    this.load();
  }
});
