const app = getApp();
const { EXERCISES, GROUP_LIST, GROUP_COLOR, BY_ID } = require('../../utils/exercises.js');
const { TEMPLATES } = require('../../utils/training-templates.js');
const { CARDIO_TYPES, TYPE_MAP, calcCardioKcal, fmtCardioDuration } = require('../../utils/cardio.js');
const { loadProfile } = require('../../utils/profile');
const { applyNavBar } = require('../../utils/theme');

// 预计算模板统计，避免 WXML 中做 reduce
const TEMPLATES_VIEW = TEMPLATES.map(t => ({
  ...t,
  dayCount: t.days.length,
  exCount: t.days.reduce((s, d) => s + d.exercises.length, 0)
}));

// 判断一个模板是否是新版扁平结构（无 days，只有 exercises）
function isFlatPlan(plan) {
  return Array.isArray(plan.exercises) && !Array.isArray(plan.days);
}

// 云开发错误识别与提示
function isCollectionMissing(err) {
  const msg = (err && err.errMsg) || '';
  return msg.includes('collection not exists') || (err && err.errCode === -502005);
}
function showCloudErr(title, err) {
  console.error(title, err);
  const msg = (err && err.errMsg) || '';
  if (isCollectionMissing(err)) {
    wx.showToast({ title: '请先在云控制台创建对应集合', icon: 'none', duration: 3000 });
  } else {
    wx.showToast({ title: title + '：' + (msg || '未知错误'), icon: 'none', duration: 2500 });
  }
}

// 统计动作数量与训练日数（兼容新旧模板）
function planStats(plan) {
  if (isFlatPlan(plan)) {
    return { dayCount: 1, exCount: plan.exercises.length };
  }
  const days = plan.days || [];
  return {
    dayCount: days.length,
    exCount: days.reduce((s, d) => s + (d.exercises || []).length, 0)
  };
}

Page({
  data: {
    tab: 'record',               // 动作库 / 记录

    // 动作库
    groups: GROUP_LIST,
    groupColor: GROUP_COLOR,
    libFiltered: EXERCISES,
    libKw: '',
    libGroup: '',

    // 记录
    records: [],
    prs: [],
    recordView: 'calendar',      // 'list' | 'calendar'

    // 日历
    calYear: 0,
    calMonth: 0,
    calWeeks: [],                // 6 行 × 7 列
    calToday: '',                // 'YYYY-MM-DD'
    calMonthStats: { days: 0, totalVolume: 0, planned: 0 },
    _touchStartX: 0,

    // 日历日详情 / 安排（schedules 为数组，支持多个力量/有氧安排）
    calDay: { show: false, date: '', schedules: [], logs: [] },

    // 计划选择弹窗
    planPicker: { show: false, list: [], selPlan: null, showDays: false },

    // 我的模板 / 计划（用于 picker）
    myPlans: [],

    // DIY 模板编辑器：新版扁平结构 { name, exercises: [...] }
    editor: { show: false, name: '我的模板', exercises: [] },
    exPicker: { show: false, kw: '', list: EXERCISES },

    // 有氧添加/记录弹窗
    cardioTypes: CARDIO_TYPES,
    selectedCardio: CARDIO_TYPES[0],
    cardioPicker: {
      show: false,
      typeKey: 'run',
      speed: '',
      grade: '',
      timeMin: '',
      distance: '',
      kcal: 0,
      weight: 60
    }
  },

  onShow() {
    applyNavBar('dark');
    this.loadMyPlans();
    this.loadLogs();
    if (!this.data.calWeeks.length) {
      this.initCalendar();
    }
  },

  noop() {},

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  // ---------------- 动作库 ----------------
  onLibKw(e) {
    this.setData({ libKw: e.detail.value });
    this.filterLib();
  },
  onLibGroup(e) {
    const g = e.currentTarget.dataset.g;
    this.setData({ libGroup: this.data.libGroup === g ? '' : g });
    this.filterLib();
  },
  filterLib() {
    const kw = this.data.libKw.trim().toLowerCase();
    const g = this.data.libGroup;
    const list = EXERCISES.filter((ex) =>
      (!g || ex.group === g) &&
      (!kw || ex.name.toLowerCase().includes(kw) || ex.group.includes(kw) || ex.equip.includes(kw))
    );
    this.setData({ libFiltered: list });
  },

  // ---------------- 我的模板 / 计划 ----------------
  loadMyPlans() {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) { setTimeout(() => this.loadMyPlans(), 600); return; }
    const db = wx.cloud.database();
    db.collection('training_plans')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
      .then((res) => {
        const myPlans = (res.data || []).map((d) => {
          const stats = planStats(d);
          return {
            _id: d._id,
            name: d.name,
            type: d.type || 'plan',
            days: d.days || null,
            exercises: d.exercises || null,
            dayCount: stats.dayCount,
            exCount: stats.exCount,
            createdAt: d.createdAt
          };
        });
        this.setData({ myPlans });
      })
      .catch(() => {});
  },

  // 读取/写入已删除的预设模板 id 列表（本地存储）
  getDeletedPresets() {
    try { return wx.getStorageSync('trainingDeletedPresets') || []; }
    catch (e) { return []; }
  },
  setDeletedPresets(arr) {
    wx.setStorageSync('trainingDeletedPresets', arr);
  },

  // 删除条目：用户模板走云库删除；内置预设只记入本地删除列表
  deleteEntry(e) {
    const idx = e.currentTarget.dataset.idx;
    const list = this.data.planPicker.list;
    const item = list[idx];
    if (!item) return;
    wx.showModal({
      title: '删除模板', content: '确定删除该模板吗？',
      success: (r) => {
        if (!r.confirm) return;
        if (item.source === 'mine' && item._id) {
          const db = wx.cloud.database();
          db.collection('training_plans').doc(item._id).remove()
            .then(() => { wx.showToast({ title: '已删除', icon: 'none' }); this.loadMyPlans(); })
            .catch(() => {});
        } else {
          // 内置预设：记入本地删除列表，刷新弹窗列表
          const deleted = this.getDeletedPresets();
          if (item.id && !deleted.includes(item.id)) {
            deleted.push(item.id);
            this.setDeletedPresets(deleted);
          }
          const newList = list.filter((_, i) => i !== idx);
          this.setData({ 'planPicker.list': newList });
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  // ---------------- 记录 ----------------
  loadLogs() {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) { setTimeout(() => this.loadLogs(), 600); return; }
    const db = wx.cloud.database();
    db.collection('training_logs')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
      .then((res) => {
        const data = res.data || [];
        const records = data.map((d) => {
          const isCardio = d.type === 'cardio';
          return {
            _id: d._id,
            isCardio,
            planName: d.planName,
            dayName: d.dayName,
            title: d.title || d.planName,
            cardioName: isCardio ? (TYPE_MAP[d.cardioType] || {}).name : '',
            dateText: this.fmtDate(d.date),
            volume: d.volume || 0,
            duration: d.duration || 0,
            durationText: isCardio ? fmtCardioDuration(d.duration / 60) : '',
            kcal: d.kcal || 0,
            setCount: isCardio ? 0 : (d.entries || []).reduce((s, en) => s + (en.sets || []).length, 0)
          };
        });
        this.setData({ records });
        this.computePRs(data);
      })
      .catch(() => {});
  },

  computePRs(logs) {
    const map = {};
    logs.forEach((log) => {
      if (log.type === 'cardio') return;
      (log.entries || []).forEach((en) => {
        (en.sets || []).forEach((s) => {
          const w = parseFloat(s.weight);
          if (!w || w <= 0) return;
          if (!map[en.exId] || w > map[en.exId].weight) {
            map[en.exId] = {
              exId: en.exId, exName: en.exName, group: en.group,
              weight: w, reps: s.reps, date: log.date
            };
          }
        });
      });
    });
    const prs = Object.values(map).sort((a, b) => b.weight - a.weight).slice(0, 12);
    this.setData({ prs });
  },

  fmtDate(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}-${p(d.getDate())}`;
  },

  // ---- 记录子视图切换 ----
  switchRecordView(e) {
    this.setData({ recordView: e.currentTarget.dataset.v });
    if (e.currentTarget.dataset.v === 'calendar' && !this.data.calWeeks.length) {
      this.initCalendar();
    }
  },

  // ---- 日历 ----
  initCalendar() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const p = (n) => String(n).padStart(2, '0');
    this.setData({
      calYear: y,
      calMonth: m,
      calToday: `${y}-${p(m + 1)}-${p(now.getDate())}`
    });
    this.buildCalendar(y, m);
  },

  buildCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay(); // 0=日
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const p = (n) => String(n).padStart(2, '0');
    const cells = [];
    // 上月尾部
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const pm = month - 1 < 0 ? 12 : month;
      const py = month - 1 < 0 ? year - 1 : year;
      cells.push({ d, mm: `${py}-${p(pm)}-${p(d)}`, isCurrent: false });
    }
    // 本月
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ d, mm: `${year}-${p(month + 1)}-${p(d)}`, isCurrent: true });
    }
    // 下月头部
    const remain = 42 - cells.length;
    for (let d = 1; d <= remain; d++) {
      const nm = month + 1 > 11 ? 1 : month + 2;
      const ny = month + 1 > 11 ? year + 1 : year;
      cells.push({ d, mm: `${ny}-${p(nm)}-${p(d)}`, isCurrent: false });
    }

    // 分成 6 行
    const weeks = [];
    for (let r = 0; r < 6; r++) {
      weeks.push(cells.slice(r * 7, r * 7 + 7));
    }

    this.setData({ calWeeks: weeks });
    this.loadMonthData(year, month);
  },

  loadMonthData(year, month) {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) return;
    const p = (n) => String(n).padStart(2, '0');
    const ym = `${year}-${p(month + 1)}`;
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();
    const db = wx.cloud.database();
    const cmd = db.command;

    Promise.all([
      db.collection('training_logs')
        .where({ createdAt: cmd.gte(start).and(cmd.lte(end)) })
        .orderBy('createdAt', 'desc').limit(200).get(),
      db.collection('training_schedule')
        .where({ date: cmd.gte(`${ym}-01`).and(cmd.lte(`${ym}-31`)) })
        .limit(200).get()
    ]).then(([logRes, schRes]) => {
      const logs = logRes.data || [];
      const schs = schRes.data || [];

      // 日志按日期归档
      const logMap = {};
      let totalVolume = 0;
      let trainedDays = 0;
      logs.forEach((log) => {
        const d = new Date(log.date || log.createdAt);
        const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        if (!logMap[key]) { logMap[key] = []; trainedDays++; }
        const vol = log.volume || 0;
        totalVolume += vol;
        logMap[key].push({
          _id: log._id,
          type: log.type || 'plan',
          planName: log.planName,
          dayName: log.dayName,
          title: log.title || log.planName,
          cardioType: log.cardioType,
          volume: vol,
          duration: log.duration,
          kcal: log.kcal || 0,
          exNames: log.type === 'cardio'
            ? [((TYPE_MAP[log.cardioType] || {}).name || '有氧')]
            : (log.entries || []).map((e) => e.exName).filter(Boolean),
          entryCount: (log.entries || []).length
        });
      });

      // 安排按日期归档（同一天支持多条，用数组）
      const schMap = {};
      schs.forEach((s) => {
        const item = Object.assign({}, s, { _type: s.type || 'plan' });
        (schMap[s.date] = schMap[s.date] || []).push(item);
      });

      const weeks = this.data.calWeeks.map((row) =>
        row.map((cell) => {
          const dayLogs = logMap[cell.mm] || null;
          const daySchs = schMap[cell.mm] || [];
          const done = !!dayLogs;
          const plannedList = daySchs.filter((s) => !done || dayLogs.every((l) => l._id !== s._id));
          // 简化：有安排且当天没有练过同一条，即视为待练
          const planned = plannedList.length > 0;
          return Object.assign({}, cell, {
            logs: dayLogs,
            hasLog: done,
            dayVol: done ? dayLogs.reduce((s, l) => s + l.volume, 0) : 0,
            dayKcal: done ? dayLogs.reduce((s, l) => s + (l.kcal || 0), 0) : 0,
            dayExNames: done ? dayLogs.flatMap((l) => l.exNames).slice(0, 3) : [],
            schedules: daySchs,
            hasSchedule: planned,
            schPlanName: planned ? (plannedList[0].planName || plannedList[0].name || '安排') : ''
          });
        })
      );

      this.setData({
        calWeeks: weeks,
        calMonthStats: { days: trainedDays, totalVolume, planned: Object.keys(schMap).length }
      });
    }).catch(() => {});
  },

  prevMonth() {
    let { calYear, calMonth } = this.data;
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    this.setData({ calYear, calMonth });
    this.buildCalendar(calYear, calMonth);
  },

  nextMonth() {
    let { calYear, calMonth } = this.data;
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    this.setData({ calYear, calMonth });
    this.buildCalendar(calYear, calMonth);
  },

  goToday() {
    this.initCalendar();
  },

  // 触摸滑动切换月份
  onTouchStart(e) {
    this._touchStartX = e.touches[0].clientX;
  },
  onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - this._touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0) this.nextMonth();
      else this.prevMonth();
    }
  },

  // 点击某天 → 打开当日安排面板
  tapDay(e) {
    const { mm, isCurrent } = e.currentTarget.dataset;
    if (!isCurrent) return; // 只允许点本月日期
    const cell = this.data.calWeeks.flat().find((c) => c.mm === mm);
    if (!cell) return;

    this.setData({
      calDay: {
        show: true,
        date: mm,
        schedules: cell.schedules || [],
        logs: cell.logs || []
      }
    });
  },

  closeCalDay() {
    this.setData({ 'calDay.show': false });
  },

  // 开始已安排的训练
  startScheduled(e) {
    const { planid, day } = e.currentTarget.dataset;
    const url = day !== undefined
      ? `/pages/training/session?planId=${planid}&dayIndex=${day}`
      : `/pages/training/session?planId=${planid}`;
    wx.navigateTo({ url });
  },

  // 取消当日安排（现在按 _id 删除单条，支持多条安排）
  cancelSchedule(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.showModal({
      title: '取消安排', content: '确定取消这条安排吗？',
      success: (r) => {
        if (!r.confirm) return;
        const db = wx.cloud.database();
        db.collection('training_schedule').doc(id).remove()
          .then(() => {
            wx.showToast({ title: '已取消', icon: 'none' });
            const schedules = this.data.calDay.schedules.filter((s) => s._id !== id);
            this.setData({ 'calDay.schedules': schedules });
            this.buildCalendar(this.data.calYear, this.data.calMonth);
          })
          .catch(() => {});
      }
    });
  },

  // ---- 安排当日训练：选择计划 / 有氧 ----
  openPlanPicker() {
    const mine = this.data.myPlans.map((p) => Object.assign({}, p, { source: 'mine' }));
    const deleted = this.getDeletedPresets();
    const presets = TEMPLATES_VIEW
      .filter((t) => !deleted.includes(t.id))
      .map((t) => Object.assign({}, t, { source: 'preset' }));
    this.setData({
      'planPicker.show': true,
      'planPicker.list': mine.concat(presets),
      'planPicker.selPlan': null,
      'planPicker.showDays': false
    });
  },
  closePlanPicker() {
    this.setData({ 'planPicker.show': false });
  },

  pickPlan(e) {
    const idx = e.currentTarget.dataset.idx;
    const plan = this.data.planPicker.list[idx];
    // 新版扁平模板或只有一天的旧模板：直接安排
    if (isFlatPlan(plan) || !plan.days || plan.days.length <= 1) {
      this.doSchedule(plan, 0);
    } else {
      this.setData({ 'planPicker.selPlan': plan, 'planPicker.showDays': true });
    }
  },

  pickPlanDay(e) {
    const dayIndex = e.currentTarget.dataset.day;
    this.doSchedule(this.data.planPicker.selPlan, dayIndex);
  },

  doSchedule(plan, dayIndex) {
    const date = this.data.calDay.date;
    if (!date) { wx.showToast({ title: '日期无效', icon: 'none' }); return; }
    const dayName = isFlatPlan(plan) ? '' : (plan.days[dayIndex] || { name: '' }).name;
    const openid = app.globalData && app.globalData.openid;
    if (!openid) { wx.showToast({ title: '登录中…', icon: 'none' }); return; }
    const db = wx.cloud.database();

    const finalize = (planId, planName) => {
      if (!planId) { wx.showToast({ title: '模板ID无效', icon: 'none' }); return; }
      db.collection('training_schedule').add({
        data: { type: 'plan', date, planId, dayIndex, planName, dayName, createdAt: new Date().getTime() }
      }).then((res) => {
        wx.showToast({ title: '已安排', icon: 'success' });
        const newSch = { _id: res._id, type: 'plan', date, planId, dayIndex, planName, dayName };
        const schedules = this.data.calDay.schedules.concat([newSch]);
        this.setData({ 'planPicker.show': false, 'calDay.schedules': schedules });
        this.buildCalendar(this.data.calYear, this.data.calMonth);
      }).catch((err) => showCloudErr('安排失败', err));
    };

    if (plan.source === 'preset') {
      // 预设模板：先存为实例，再安排
      const days = plan.days.map((d) => ({
        name: d.name,
        exercises: d.exercises.map((ex) => {
          const meta = BY_ID[ex.exId] || {};
          return {
            exId: ex.exId, exName: meta.name || ex.exId, group: meta.group || '',
            sets: ex.sets, reps: ex.reps, rest: ex.rest
          };
        })
      }));
      db.collection('training_plans').add({
        data: { name: plan.name, type: 'preset', days, createdAt: new Date().getTime() }
      }).then((res) => {
        finalize(res._id, plan.name);
        this.loadMyPlans();
      }).catch((err) => showCloudErr('保存预设失败', err));
    } else {
      if (!plan._id) { wx.showToast({ title: '模板无效', icon: 'none' }); return; }
      finalize(plan._id, plan.name);
    }
  },

  // ---------------- 有氧添加 / 记录 ----------------
  openCardioPicker() {
    loadProfile().then((profile) => {
      const weight = (profile && profile.weight) || 60;
      this.setData({
        selectedCardio: TYPE_MAP.run,
        cardioPicker: {
          show: true,
          typeKey: 'run',
          speed: '',
          grade: '',
          timeMin: '',
          distance: '',
          kcal: 0,
          weight
        }
      });
    }).catch(() => {
      this.setData({
        selectedCardio: TYPE_MAP.run,
        cardioPicker: { show: true, typeKey: 'run', speed: '', grade: '', timeMin: '', distance: '', kcal: 0, weight: 60 }
      });
    });
  },
  closeCardioPicker() {
    this.setData({ 'cardioPicker.show': false });
  },
  onCardioType(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      'cardioPicker.typeKey': key,
      selectedCardio: TYPE_MAP[key] || CARDIO_TYPES[0]
    }, () => this.updateCardioKcal());
  },
  onCardioField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['cardioPicker.' + field]: e.detail.value }, () => this.updateCardioKcal());
  },
  updateCardioKcal() {
    const cp = this.data.cardioPicker;
    const kcal = calcCardioKcal({
      type: cp.typeKey,
      speed: cp.speed,
      grade: cp.grade,
      timeMin: cp.timeMin,
      weight: cp.weight
    });
    this.setData({ 'cardioPicker.kcal': kcal });
  },
  saveCardio() {
    const cp = this.data.cardioPicker;
    const timeMin = parseFloat(cp.timeMin) || 0;
    if (timeMin <= 0) { wx.showToast({ title: '请输入运动时长', icon: 'none' }); return; }
    const typeInfo = TYPE_MAP[cp.typeKey] || CARDIO_TYPES[0];
    const kcal = cp.kcal || calcCardioKcal({
      type: cp.typeKey, speed: cp.speed, grade: cp.grade, timeMin, weight: cp.weight
    });
    const date = this.data.calDay.date;
    if (!date) { wx.showToast({ title: '日期无效', icon: 'none' }); return; }
    const openid = app.globalData && app.globalData.openid;
    if (!openid) { wx.showToast({ title: '登录中…', icon: 'none' }); return; }
    const db = wx.cloud.database();
    const now = new Date().getTime();
    const logData = {
      type: 'cardio',
      title: typeInfo.name,
      cardioType: cp.typeKey,
      date: now,
      createdAt: now,
      duration: Math.round(timeMin * 60),
      kcal,
      cardio: {
        speed: cp.speed,
        grade: cp.grade,
        timeMin,
        distance: cp.distance
      }
    };
    db.collection('training_logs').add({ data: logData })
      .then((logRes) => {
        // 同时加入当日安排，方便当日面板统一查看
        return db.collection('training_schedule').add({
          data: {
            type: 'cardio',
            date,
            logId: logRes._id,
            name: typeInfo.name,
            cardioType: cp.typeKey,
            timeMin,
            kcal,
            createdAt: now
          }
        }).then((schRes) => ({ logRes, schRes }));
      })
      .then(({ logRes, schRes }) => {
        wx.showToast({ title: '已记录 ' + kcal + ' kcal', icon: 'none' });
        const newSch = {
          _id: schRes._id, type: 'cardio', date,
          logId: logRes._id, name: typeInfo.name, cardioType: cp.typeKey, timeMin, kcal
        };
        const schedules = this.data.calDay.schedules.concat([newSch]);
        this.setData({ 'cardioPicker.show': false, 'calDay.schedules': schedules });
        this.loadLogs();
        this.buildCalendar(this.data.calYear, this.data.calMonth);
      })
      .catch((err) => showCloudErr('保存失败', err));
  },

  // ---------------- DIY 模板编辑器：新版扁平结构 ----------------
  openEditor() {
    this.setData({
      editor: { show: true, name: '我的模板', exercises: [] },
      exPicker: { show: false, kw: '', list: EXERCISES }
    });
  },
  closeEditor() {
    this.setData({ 'editor.show': false });
  },
  onPlanName(e) {
    this.setData({ 'editor.name': e.detail.value });
  },

  // 打开动作选择器
  openExPicker() {
    this.setData({ exPicker: { show: true, kw: '', list: EXERCISES } });
  },
  closeExPicker() {
    this.setData({ 'exPicker.show': false });
  },
  onPickKw(e) {
    const kw = e.detail.value;
    const list = EXERCISES.filter((ex) =>
      !kw || ex.name.includes(kw) || ex.group.includes(kw) || ex.equip.includes(kw)
    );
    this.setData({ 'exPicker.kw': kw, 'exPicker.list': list });
  },
  // 选择动作后自动收起动作栏并加入模板
  addExercise(e) {
    const exid = e.currentTarget.dataset.exid;
    const meta = BY_ID[exid];
    if (!meta) return;
    const ex = {
      exId: exid,
      exName: meta.name,
      group: meta.group,
      reps: '10',
      rest: 60,
      sets: [{ weight: '', reps: '10' }]
    };
    const exercises = this.data.editor.exercises.concat([ex]);
    this.setData({ 'editor.exercises': exercises, 'exPicker.show': false });
  },
  removeExercise(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.editor.exercises.slice();
    exercises.splice(i, 1);
    this.setData({ 'editor.exercises': exercises });
  },

  // 动作级字段：目标次数、组间休息
  onExField(e) {
    const { i, field } = e.currentTarget.dataset;
    this.setData({ ['editor.exercises[' + i + '].' + field]: e.detail.value });
  },

  // 组操作
  addSet(e) {
    const i = e.currentTarget.dataset.i;
    const ex = this.data.editor.exercises[i];
    const sets = ex.sets.slice().concat([{ weight: ex.sets[ex.sets.length - 1]?.weight || '', reps: ex.reps || '10' }]);
    this.setData({ ['editor.exercises[' + i + '].sets']: sets });
  },
  removeSet(e) {
    const { i, si } = e.currentTarget.dataset;
    const ex = this.data.editor.exercises[i];
    if (ex.sets.length <= 1) return;
    const sets = ex.sets.slice();
    sets.splice(si, 1);
    this.setData({ ['editor.exercises[' + i + '].sets']: sets });
  },
  onSetField(e) {
    const { i, si, field } = e.currentTarget.dataset;
    this.setData({ ['editor.exercises[' + i + '].sets[' + si + '].' + field]: e.detail.value });
  },

  saveTemplate() {
    const ed = this.data.editor;
    const name = (ed.name || '').trim() || '我的模板';
    if (!ed.exercises.length) { wx.showToast({ title: '请至少添加一个动作', icon: 'none' }); return; }
    const openid = app.globalData && app.globalData.openid;
    if (!openid) { wx.showToast({ title: '登录中…', icon: 'none' }); return; }
    const db = wx.cloud.database();
    db.collection('training_plans').add({
      data: { name, type: 'template', exercises: ed.exercises, createdAt: new Date().getTime() }
    }).then(() => {
      wx.showToast({ title: '模板已保存', icon: 'success' });
      this.setData({ 'editor.show': false });
      this.loadMyPlans();
    }).catch((err) => showCloudErr('保存模板失败', err));
  }
});
