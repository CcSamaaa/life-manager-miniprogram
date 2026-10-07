const app = getApp();
const { EXERCISES, GROUP_COLOR, BY_ID } = require('../../utils/exercises.js');
const { applyNavBar } = require('../../utils/theme');

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

function calcSet(s) {
  const w = parseFloat(s.weight) || 0;
  const r = parseInt(s.reps, 10) || 0;
  return w * r;
}

Page({
  data: {
    planId: '',
    planName: '',
    dayName: '',
    title: '',
    exercises: [],
    groupColor: GROUP_COLOR,
    finished: false,
    summary: null,
    difficulty: 'normal', // easy | normal | hard
    notes: '',
    showNotesInput: false,

    // 顶部统计
    totalSets: 0,
    totalDoneSets: 0,
    currentVolume: 0,
    targetVolume: 0,

    // 计时器
    timerSec: 0,
    timerText: '00:00:00',
    running: true,

    // 休息倒计时
    rest: { show: false, sec: 0, label: '' },

    // 动作选择器
    exPicker: { show: false, kw: '', list: EXERCISES },

    startTime: 0
  },

  onLoad(query) {
    this.planId = query.planId;
    this.dayIndex = parseInt(query.dayIndex || '0', 10);
    this._timer = null;
    this._restTimer = null;
    this.loadPlan();
  },

  onShow() {
    applyNavBar('dark');
    if (!this._timer && this.data.running) this.startTimer();
  },

  onHide() {
    this.stopTimer();
  },

  onUnload() {
    this.stopTimer();
    if (this._restTimer) clearInterval(this._restTimer);
  },

  startTimer() {
    this.stopTimer();
    this._timer = setInterval(() => {
      const sec = Math.floor((Date.now() - this.data.startTime) / 1000);
      this.setData({ timerSec: sec, timerText: fmtDuration(sec) });
    }, 1000);
  },

  stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  toggleTimer() {
    const running = !this.data.running;
    this.setData({ running });
    if (running) this.startTimer();
    else this.stopTimer();
  },

  loadPlan() {
    const db = wx.cloud.database();
    db.collection('training_plans').doc(this.planId).get()
      .then((res) => {
        const plan = res.data;
        let sourceExercises = [];
        let dayName = '';

        if (Array.isArray(plan.exercises)) {
          sourceExercises = plan.exercises;
        } else if (Array.isArray(plan.days)) {
          const day = plan.days[this.dayIndex] || plan.days[0];
          if (!day) { wx.showToast({ title: '计划数据异常', icon: 'none' }); return; }
          sourceExercises = day.exercises || [];
          dayName = day.name || '';
        }

        if (!sourceExercises.length) {
          wx.showToast({ title: '模板没有动作', icon: 'none' });
          return;
        }

        const startTime = Date.now();
        const exercises = sourceExercises.map((ex) => {
          const meta = BY_ID[ex.exId] || {};
          let sets = [];
          if (Array.isArray(ex.sets) && ex.sets.length) {
            sets = ex.sets.map((s) => ({
              weight: String(s.weight || ''),
              reps: String(s.reps || ex.reps || ''),
              done: false,
              doneAt: 0,
              elapsed: 0,
              elapsedText: ''
            }));
          } else if (typeof ex.sets === 'number' && ex.sets > 0) {
            sets = Array.from({ length: ex.sets }, () => ({
              weight: '', reps: String(ex.reps || ''), done: false, doneAt: 0, elapsed: 0, elapsedText: ''
            }));
          } else {
            sets = [{ weight: '', reps: String(ex.reps || ''), done: false, doneAt: 0, elapsed: 0, elapsedText: '' }];
          }
          return {
            exId: ex.exId,
            exName: ex.exName || meta.name || ex.exId,
            group: ex.group || meta.group || '',
            reps: String(ex.reps || ''),
            rest: parseInt(ex.rest, 10) || 60,
            lastText: '',
            setsData: sets
          };
        });

        this.setData({
          planName: plan.name,
          dayName,
          title: plan.name + (dayName ? ' · ' + dayName : ''),
          exercises,
          startTime,
          timerText: '00:00:00',
          running: true
        });
        this.startTimer();
        this.loadLast(exercises);
        this.updateComputed();
      })
      .catch(() => { wx.showToast({ title: '加载失败', icon: 'none' }); });
  },

  // 统一计算：容量、组数、完成状态、格式化时间
  updateComputed() {
    let totalSets = 0;
    let totalDoneSets = 0;
    let currentVolume = 0;
    let targetVolume = 0;

    const exercises = this.data.exercises.map((ex) => {
      let exCurrentVol = 0;
      let exTargetVol = 0;
      let exDoneSets = 0;

      const setsData = ex.setsData.map((s) => {
        const vol = calcSet(s);
        exTargetVol += vol;
        if (s.done) {
          exCurrentVol += vol;
          exDoneSets++;
        }
        return Object.assign({}, s, {
          elapsedText: s.done && s.elapsed > 0 ? fmtDuration(s.elapsed) : ''
        });
      });

      totalSets += setsData.length;
      totalDoneSets += exDoneSets;
      currentVolume += exCurrentVol;
      targetVolume += exTargetVol;

      return Object.assign({}, ex, {
        setsData,
        currentVol: exCurrentVol,
        targetVol: exTargetVol,
        doneSets: exDoneSets
      });
    });

    this.setData({
      exercises,
      totalSets,
      totalDoneSets,
      currentVolume: Math.round(currentVolume),
      targetVolume: Math.round(targetVolume)
    });
  },

  loadLast(exercises) {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) return;
    const db = wx.cloud.database();
    db.collection('training_logs').orderBy('createdAt', 'desc').limit(100).get()
      .then((res) => {
        const logs = res.data || [];
        const lastMap = {};
        logs.forEach((log) => {
          (log.entries || []).forEach((en) => {
            if (!lastMap[en.exId]) lastMap[en.exId] = en;
          });
        });
        const ex = exercises.map((e) => {
          const last = lastMap[e.exId];
          let lastText = '';
          if (last) {
            let best = 0, bestRep = '', totalVol = 0;
            (last.sets || []).forEach((s) => {
              const w = parseFloat(s.weight) || 0;
              const r = parseInt(s.reps, 10) || 0;
              totalVol += w * r;
              if (w > best) { best = w; bestRep = s.reps; }
            });
            if (best > 0) lastText = `上次 ${best}kg × ${bestRep || '?'}`;
            if (totalVol > 0) lastText += ` · 容量 ${Math.round(totalVol)}`;
          }
          return Object.assign({}, e, { lastText });
        });
        this.setData({ exercises: ex });
        this.updateComputed();
      })
      .catch(() => {});
  },

  // 标题编辑
  onTitle(e) {
    this.setData({ title: e.detail.value });
  },

  // 备注
  onNotes(e) {
    this.setData({ notes: e.detail.value });
  },
  toggleNotes() {
    this.setData({ showNotesInput: !this.data.showNotesInput });
  },

  // 难度
  setDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.v });
  },

  // 重量/次数输入
  onWeight(e) {
    const { ei, si } = e.currentTarget.dataset;
    this.setData({ ['exercises[' + ei + '].setsData[' + si + '].weight']: e.detail.value });
    this.updateComputed();
  },
  onReps(e) {
    const { ei, si } = e.currentTarget.dataset;
    this.setData({ ['exercises[' + ei + '].setsData[' + si + '].reps']: e.detail.value });
    this.updateComputed();
  },

  // 完成 / 取消完成一组
  toggleDone(e) {
    const { ei, si } = e.currentTarget.dataset;
    const ex = this.data.exercises[ei];
    const sd = ex.setsData[si];
    const done = !sd.done;
    const now = Date.now();
    let elapsed = 0;

    if (done) {
      let lastDone = this.data.startTime;
      for (let i = si - 1; i >= 0; i--) {
        if (ex.setsData[i].doneAt) { lastDone = ex.setsData[i].doneAt; break; }
      }
      elapsed = Math.max(0, Math.round((now - lastDone) / 1000));
      this.startRest(ex.rest, ex.exName);
    }

    this.setData({
      ['exercises[' + ei + '].setsData[' + si + '].done']: done,
      ['exercises[' + ei + '].setsData[' + si + '].doneAt']: done ? now : 0,
      ['exercises[' + ei + '].setsData[' + si + '].elapsed']: elapsed
    }, () => {
      this.updateComputed();
    });
  },

  // 新增一组
  addSet(e) {
    const ei = e.currentTarget.dataset.ei;
    const ex = this.data.exercises[ei];
    const last = ex.setsData[ex.setsData.length - 1] || { weight: '', reps: ex.reps || '' };
    const sets = ex.setsData.slice().concat([{
      weight: last.weight,
      reps: last.reps || ex.reps || '',
      done: false,
      doneAt: 0,
      elapsed: 0,
      elapsedText: ''
    }]);
    this.setData({ ['exercises[' + ei + '].setsData']: sets }, () => this.updateComputed());
  },

  // 删除一组（至少保留一组）
  removeSet(e) {
    const { ei, si } = e.currentTarget.dataset;
    const ex = this.data.exercises[ei];
    if (ex.setsData.length <= 1) return;
    const sets = ex.setsData.slice();
    sets.splice(si, 1);
    this.setData({ ['exercises[' + ei + '].setsData']: sets }, () => this.updateComputed());
  },

  // 组间休息
  startRest(sec, label) {
    if (!sec || sec <= 0) return;
    this.setData({ rest: { show: true, sec, total: sec, label } }, () => {
      this.initRestCanvas();
    });
    if (this._restTimer) clearInterval(this._restTimer);
    this._restTimer = setInterval(() => {
      const cur = this.data.rest.sec - 1;
      if (cur <= 0) {
        clearInterval(this._restTimer);
        this._restTimer = null;
        this.setData({ 'rest.show': false });
        if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
      } else {
        this.setData({ 'rest.sec': cur });
        this.drawRestRing();
      }
    }, 1000);
  },

  // 初始化环形 canvas（仅首次查询节点并缓存）
  initRestCanvas() {
    if (this._restCtx) { this.drawRestRing(); return; }
    const q = wx.createSelectorQuery().in(this);
    q.select('#restRing').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      let dpr = 2;
      try {
        dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2;
      } catch (e) { /* keep default */ }
      const w = res[0].width;
      const h = res[0].height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      this._restCanvas = canvas;
      this._restCtx = ctx;
      this._restSize = w;
      this.drawRestRing();
    });
  },

  // 绘制环形进度（剩余时间比例）
  drawRestRing() {
    const ctx = this._restCtx;
    if (!ctx) return;
    const size = this._restSize;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 9;
    const total = this.data.rest.total || 1;
    const sec = this.data.rest.sec;
    const ratio = Math.max(0, Math.min(1, sec / total));
    ctx.clearRect(0, 0, size, size);
    // 背景轨道
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#48484a';
    ctx.lineWidth = 7;
    ctx.stroke();
    // 进度弧（顶部起顺时针，表示剩余时间）
    if (ratio > 0) {
      ctx.beginPath();
      const start = -Math.PI / 2;
      ctx.arc(cx, cy, r, start, start + Math.PI * 2 * ratio);
      ctx.strokeStyle = '#4cd964';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  },
  skipRest() {
    if (this._restTimer) { clearInterval(this._restTimer); this._restTimer = null; }
    this.setData({ 'rest.show': false });
  },

  // 动作选择器（加动作）
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
      lastText: '',
      setsData: [{ weight: '', reps: '10', done: false, doneAt: 0, elapsed: 0, elapsedText: '' }]
    };
    const exercises = this.data.exercises.concat([ex]);
    this.setData({ exercises, 'exPicker.show': false }, () => this.updateComputed());
  },

  // 结束训练
  finish() {
    let volume = 0;
    let setCount = 0;
    let exerciseCount = 0;
    const entries = this.data.exercises.map((ex) => {
      const sets = ex.setsData
        .filter((s) => parseFloat(s.weight) > 0 && s.reps)
        .map((s) => ({
          weight: parseFloat(s.weight) || 0,
          reps: s.reps || '',
          done: !!s.done,
          elapsed: s.elapsed || 0
        }));
      sets.forEach((s) => { volume += s.weight * (parseInt(s.reps, 10) || 0); });
      setCount += sets.length;
      if (sets.length) exerciseCount++;
      return { exId: ex.exId, exName: ex.exName, group: ex.group, sets };
    });

    if (!setCount) {
      wx.showToast({ title: '请至少完成一组', icon: 'none' });
      return;
    }

    this.doFinish(entries, volume, setCount, exerciseCount);
  },

  doFinish(entries, volume, setCount, exerciseCount) {
    const openid = app.globalData && app.globalData.openid;
    if (!openid) { wx.showToast({ title: '登录中…', icon: 'none' }); return; }
    const db = wx.cloud.database();
    const date = Date.now();
    const duration = Math.round((date - this.data.startTime) / 1000);
    const title = (this.data.title || this.data.planName || '训练').trim();

    db.collection('training_logs').add({
      data: {
        planId: this.planId,
        planName: this.data.planName,
        dayName: this.data.dayName,
        title,
        date,
        createdAt: date,
        duration,
        volume,
        difficulty: this.data.difficulty,
        notes: this.data.notes,
        entries
      }
    }).then(() => {
      const prs = entries.map((en) => {
        let best = 0;
        (en.sets || []).forEach((s) => { const w = parseFloat(s.weight) || 0; if (w > best) best = w; });
        return best > 0 ? { exName: en.exName, weight: best } : null;
      }).filter(Boolean).sort((a, b) => b.weight - a.weight).slice(0, 3);

      this.stopTimer();
      this.setData({
        finished: true,
        summary: {
          volume: Math.round(volume),
          setCount,
          exerciseCount,
          duration,
          durationText: fmtDuration(duration),
          prs
        }
      });
      wx.showToast({ title: '训练完成', icon: 'success' });
    }).catch(() => { wx.showToast({ title: '保存失败', icon: 'none' }); });
  },

  back() {
    wx.navigateBack();
  },

  minimize() {
    wx.showToast({ title: '已最小化', icon: 'none' });
  },

  noop() {}
});
