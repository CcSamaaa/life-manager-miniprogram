const { getOpenid, db, serverDate } = require('../../utils/cloud');
const { SEED_HABITS } = require('../../utils/seed');
const { todayStr, startOfWeekStr } = require('../../utils/date');
const { REMINDER_TMPL_ID } = require('../../utils/config');
const { getAlmanac } = require('../../utils/almanac');
const { fetchWeather, searchCity, getCities, saveCities } = require('../../utils/weather');
const { loadProfile } = require('../../utils/profile');
const { getTheme } = require('../../utils/theme');
const { pickGreeting } = require('../../utils/greetings');
const { calcBMR, estimateTrainingCalories, analyzeBalance, dailyActivityFromBMR, ACTIVITY_LABELS } = require('../../utils/calorie');

// 今日各模块的默认顺序（数值越小越靠上），持久化在本地
const CARD_KEYS = ['habit', 'weather', 'almanac', 'calorie', 'todo'];
const CARD_ORDER_KEY = 'todayCardOrder';
function buildOrder(saved) {
  const map = {};
  CARD_KEYS.forEach((k, i) => { map[k] = i; });
  if (saved && typeof saved === 'object') {
    CARD_KEYS.forEach(k => { if (k in saved) map[k] = saved[k]; });
  }
  // 归一化为 0..n 唯一递增，避免冲突
  const sorted = CARD_KEYS.slice().sort((a, b) => map[a] - map[b]);
  sorted.forEach((k, i) => { map[k] = i; });
  return map;
}

Page({
  data: {
    today: '',
    loading: true,
    // 自定义排序
    editing: false,
    cardOrder: { habit: 0, weather: 1, almanac: 2, calorie: 3, todo: 4 },
    // 习惯打卡（内容由「功能-习惯打卡」管理）
    habitOpen: true,
    habits: [],
    habitTotal: 0,
    habitRemaining: 0,
    // 天气
    weatherOpen: false,
    weatherCities: [],
    weatherHint: '',
    // 黄历
    almanacOpen: false,
    almanac: null,
    // 热量计算
    calorieOpen: false,
    hasProfile: false,
    bmr: 0,
    dailyActivity: 0,
    activityLabel: '轻度',
    intake: 0,
    burned: 0,
    totalBurned: 0,
    intakePercent: 0,
    balance: null,
    // 待办事项
    todoOpen: true,
    todos: [],
    todoInput: '',
    todoTotal: 0,
    todoRemaining: 0,
    // 问候语 + 主题
    theme: 'light',
    nickname: '',
    greeting: '你好',
    todayDate: '',
    dailyGreeting: { text: '', color: '#9aa0a6', emoji: '' }
  },

  onShow() {
    const theme = getTheme();
    this.setData({
      cardOrder: buildOrder(wx.getStorageSync(CARD_ORDER_KEY)),
      theme
    });
    this.applyNavBar(theme);
    this.refreshGreeting();
    this.loadData();
  },

  // 同步导航栏颜色
  applyNavBar(theme) {
    if (theme === 'dark') {
      wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#15171a', backgroundColorTop: '#15171a', backgroundColorBottom: '#15171a' });
    } else {
      wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#f5f6f8', backgroundColorTop: '#f5f6f8', backgroundColorBottom: '#f5f6f8' });
    }
  },

  // 根据时段生成问候语，并读取用户昵称、今日日期与随机问候语
  async refreshGreeting() {
    const h = new Date().getHours();
    let greeting = '你好';
    if (h >= 5 && h < 11) greeting = '早上好';
    else if (h >= 11 && h < 13) greeting = '中午好';
    else if (h >= 13 && h < 18) greeting = '下午好';
    else if (h >= 18 && h < 23) greeting = '晚上好';
    else greeting = '深夜好';

    const now = new Date();
    const todayDate = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();

    let nickname = '';
    try {
      const p = await loadProfile();
      if (p) { nickname = p.name || ''; }
    } catch (e) { /* 忽略 */ }

    this.setData({
      greeting,
      todayDate,
      dailyGreeting: pickGreeting(),
      nickname
    });
  },

  onPullDownRefresh() {
    Promise.all([this.loadData(), this.refreshWeather()]).then(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    const openid = await getOpenid();
    if (!openid) {
      wx.showToast({ title: '云环境未配置', icon: 'none' });
      this.setData({ loading: false });
      return;
    }

    await this.ensureSeed();

    const dbc = db();
    const today = todayStr();
    const weekStart = startOfWeekStr(today);

    const habitsRes = await dbc.collection('habits').orderBy('order', 'asc').get();
    const habits = habitsRes.data;

    const todayRes = await dbc.collection('checkins').where({ date: today }).get();
    const doneTodaySet = new Set(todayRes.data.map(c => c.habitId));

    const weekRes = await dbc.collection('checkins')
      .where({ date: dbc.command.gte(weekStart) })
      .get();
    const weekCount = {};
    weekRes.data.forEach(c => {
      weekCount[c.habitId] = (weekCount[c.habitId] || 0) + 1;
    });

    const list = habits.map(h => ({
      ...h,
      doneToday: doneTodaySet.has(h._id),
      weeklyDone: h.targetType === 'weekly' ? (weekCount[h._id] || 0) : 0
    }));

    const now = new Date();
    const almanac = getAlmanac(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // ===== 热量计算 =====
    let calState = {
      hasProfile: false, bmr: 0, intake: 0, burned: 0,
      totalBurned: 0, intakePercent: 0, balance: null
    };
    try {
      calState = await this.loadCalorie(dbc, now);
    } catch (e) {
      console.error('[热量计算] 加载失败（可能 profiles 集合未创建）：', e);
    }

    // ===== 待办事项（仅显示今日，或旧版无日期的待办）=====
    let todos = [];
    try {
      const tRes = await dbc.collection('todos').orderBy('createdAt', 'asc').get();
      todos = tRes.data
        .filter(t => !t.date || t.date === today)
        .map(t => ({ _id: t._id, text: t.text, done: !!t.done }));
    } catch (e) { /* 集合未创建时忽略 */ }
    const todoTotal = todos.length;
    const todoRemaining = todos.filter(t => !t.done).length;

    this.setData({
      habits: list,
      habitTotal: list.length,
      habitRemaining: list.filter(h => !h.doneToday).length,
      today,
      almanac,
      ...calState,
      todos,
      todoTotal,
      todoRemaining,
      loading: false
    });
  },

  // 读取资料 + 今日摄入 + 今日训练消耗，计算净平衡
  async loadCalorie(dbc, now) {
    const profile = await loadProfile();
    const complete = !!(profile && profile.gender && profile.age && profile.height && profile.weight);
    if (!complete) {
      return { hasProfile: false, bmr: 0, intake: 0, burned: 0, totalBurned: 0, intakePercent: 0, balance: null };
    }

    const bmr = calcBMR({
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      weight: profile.weight
    });

    // 活动系数 → 日常活动消耗（不含已记录的训练）
    const activity = profile.activity || 'light';
    const activityLabel = ACTIVITY_LABELS[activity] || '轻度';
    const dailyActivity = dailyActivityFromBMR(bmr, activity);

    // 今日时间范围
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const startTs = start.getTime();
    const endTs = end.getTime();
    const cmd = dbc.command;

    // 今日食物摄入（food_log.createdAt 为服务端时间）
    let intake = 0;
    try {
      const fRes = await dbc.collection('food_log')
        .where({ createdAt: cmd.gte(start).and(cmd.lt(end)) })
        .get();
      intake = fRes.data.reduce((s, f) => s + (f.total || 0), 0);
    } catch (e) { /* 集合未创建时忽略 */ }

    // 今日训练消耗（training_logs.date 为时间戳）
    // 优先使用记录里精确的 kcal（有氧记录会带），力量记录 fallback 到 MET 估算
    let burned = 0;
    try {
      const tRes = await dbc.collection('training_logs')
        .where({ date: cmd.gte(startTs).and(cmd.lt(endTs)) })
        .get();
      burned = tRes.data.reduce((s, t) => {
        if (typeof t.kcal === 'number') return s + t.kcal;
        return s + estimateTrainingCalories({
          duration: t.duration,
          volume: t.volume,
          weight: profile.weight
        });
      }, 0);
    } catch (e) { /* 集合未创建时忽略 */ }

    const bal = analyzeBalance({ intake, burned, bmr, dailyActivity });
    const intakePercent = bal.totalBurned > 0 ? Math.min(100, Math.round(bal.intake / bal.totalBurned * 100)) : 0;

    return {
      hasProfile: true,
      bmr,
      dailyActivity: bal.dailyActivity,
      activityLabel,
      intake: bal.intake,
      burned: bal.burned,
      totalBurned: bal.totalBurned,
      intakePercent,
      balance: bal
    };
  },

  async ensureSeed() {
    const dbc = db();
    const countRes = await dbc.collection('habits').count();
    if (countRes.total === 0) {
      const tasks = SEED_HABITS.map((h, i) => dbc.collection('habits').add({
        data: { ...h, order: i, createdAt: serverDate() }
      }));
      await Promise.all(tasks);
    }
  },

  // ===== 自定义排序 =====
  toggleEdit() {
    this.setData({ editing: !this.data.editing });
  },
  // 上移/下移某个卡片（与相邻卡片交换顺序值）
  moveCard(e) {
    const key = e.currentTarget.dataset.key;
    const dir = e.currentTarget.dataset.dir; // up / down
    const map = { ...this.data.cardOrder };
    const cur = map[key];
    let neighbor = null;
    for (const k in map) {
      if (k === key) continue;
      if (dir === 'up' && map[k] === cur - 1) neighbor = k;
      if (dir === 'down' && map[k] === cur + 1) neighbor = k;
    }
    if (!neighbor) return;
    map[key] = map[neighbor];
    map[neighbor] = cur;
    wx.setStorageSync(CARD_ORDER_KEY, map);
    this.setData({ cardOrder: map });
  },

  // ===== 展开/收起 =====
  toggleHabit() { if (this.data.editing) return; this.setData({ habitOpen: !this.data.habitOpen }); },
  toggleAlmanac() { if (this.data.editing) return; this.setData({ almanacOpen: !this.data.almanacOpen }); },
  toggleCalorie() { if (this.data.editing) return; this.setData({ calorieOpen: !this.data.calorieOpen }); },
  toggleTodo() { if (this.data.editing) return; this.setData({ todoOpen: !this.data.todoOpen }); },
  goMine() { wx.switchTab({ url: '/pages/mine/mine' }); },
  goFood() { wx.navigateTo({ url: '/pages/food/food' }); },
  goTraining() { wx.navigateTo({ url: '/pages/training/training' }); },
  goSign() { wx.navigateTo({ url: '/pages/sign/sign' }); },
  toggleWeather() {
    const open = !this.data.weatherOpen;
    this.setData({ weatherOpen: open });
    if (open) this.initWeather();
  },

  // ===== 习惯打卡 =====
  async onHabitTap(e) {
    const id = e.detail.id;
    const habit = this.data.habits.find(h => h._id === id);
    if (!habit) return;
    const today = todayStr();
    const dbc = db();
    if (habit.doneToday) {
      await dbc.collection('checkins').where({ habitId: id, date: today }).remove();
      this.updateHabit(id, { doneToday: false, weeklyDone: Math.max(0, habit.weeklyDone - 1) });
    } else {
      await dbc.collection('checkins').add({
        data: { habitId: id, date: today, createdAt: serverDate() }
      });
      this.updateHabit(id, { doneToday: true, weeklyDone: habit.weeklyDone + 1 });
      this.requestReminder();
      wx.vibrateShort({ type: 'light' });
    }
  },
  updateHabit(id, patch) {
    const habits = this.data.habits.map(h => h._id === id ? { ...h, ...patch } : h);
    this.setData({ habits });
  },
  goHabits() {
    wx.navigateTo({ url: '/pages/habits/habits' });
  },
  requestReminder() {
    if (!REMINDER_TMPL_ID || REMINDER_TMPL_ID === 'your-subscribe-template-id') return;
    wx.requestSubscribeMessage({
      tmplIds: [REMINDER_TMPL_ID],
      success() {}, fail() {}
    });
  },

  // ===== 天气 =====
  async initWeather() {
    let cities = getCities();
    // 若没有“当前位置”，尝试定位（AUDIT-HIDDEN 自动定位已关闭，过审后取消下面注释恢复）
    // if (!cities.some(c => c.isLoc)) {
    //   try {
    //     const loc = await this.getLocation();
    //     cities.unshift({ key: 'loc', name: '当前位置', lat: loc.lat, lon: loc.lon, isLoc: true });
    //     saveCities(cities);
    //   } catch (e) {
    //     // 定位失败不影响手动添加
    //   }
    // }
    this.setData({ weatherCities: cities.map(c => ({ ...c, loading: true })) });
    this.refreshWeather();
  },

  // getLocation() { // AUDIT-HIDDEN 自动定位方法，过审后取消注释恢复
  //   return new Promise((resolve, reject) => {
  //     wx.getLocation({
  //       type: 'wgs84',
  //       success: res => resolve({ lat: res.latitude, lon: res.longitude }),
  //       fail: reject
  //     });
  //   });
  // },

  async refreshWeather() {
    const cities = this.data.weatherCities;
    if (cities.length === 0) {
      this.setData({ weatherHint: '点下方「+ 添加城市」开始查看天气' });
      return;
    }
    this.setData({ weatherHint: '' });
    const tasks = cities.map(async (c, i) => {
      try {
        const w = await fetchWeather(c.lat, c.lon);
        this.setData({ [`weatherCities[${i}].loading`]: false, [`weatherCities[${i}]`]: { ...c, ...w, loading: false } });
      } catch (e) {
        this.setData({ [`weatherCities[${i}].loading`]: false, [`weatherCities[${i}].err`]: e.message || '获取失败' });
      }
    });
    await Promise.all(tasks);
  },

  addCity() {
    wx.showModal({
      title: '添加城市',
      editable: true,
      placeholderText: '输入城市名，如：北京 / 上海 / 成都',
      success: async (r) => {
        if (!r.confirm) return;
        const name = (r.content || '').trim();
        if (!name) return;
        wx.showLoading({ title: '检索中' });
        try {
          const results = searchCity(name);
          // 只有一个结果时直接添加
          if (results.length === 1) {
            this._addCityFromResult(results[0]);
            return;
          }
          // 多个结果 → 让用户选择
          wx.hideLoading();
          const itemList = results.map(c => c.name + (c.province ? '（' + c.province + '）' : ''));
          wx.showActionSheet({
            itemList,
            success: (res) => {
              this._addCityFromResult(results[res.tapIndex]);
            }
          });
        } catch (e) {
          wx.showToast({ title: e.message || '未找到该城市', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  _addCityFromResult(city) {
    const cities = getCities();
    // 避免重复添加
    if (cities.some(c => c.name === city.name && c.province === city.province)) {
      wx.showToast({ title: '该城市已存在', icon: 'none' });
      return;
    }
    cities.push({
      key: 'c' + Date.now(),
      name: city.name + (city.province ? '·' + city.province : ''),
      lat: city.lat,
      lon: city.lon,
      isLoc: false
    });
    saveCities(cities);
    this.setData({ weatherCities: cities.map(c => ({ ...c, loading: true })) });
    this.refreshWeather();
  },

  removeCity(e) {
    const key = e.currentTarget.dataset.key;
    let cities = getCities().filter(c => c.key !== key);
    saveCities(cities);
    this.setData({ weatherCities: this.data.weatherCities.filter(c => c.key !== key) });
  },

  // ===== 待办事项 =====
  onTodoInput(e) { this.setData({ todoInput: e.detail.value }); },
  async addTodo() {
    const text = (this.data.todoInput || '').trim();
    if (!text) return;
    const dbc = db();
    try {
      await dbc.collection('todos').add({ data: { text, done: false, date: todayStr(), createdAt: serverDate() } });
      this.setData({ todoInput: '' });
      const tRes = await dbc.collection('todos').orderBy('createdAt', 'asc').get();
      const todos = tRes.data.map(t => ({ _id: t._id, text: t.text, done: !!t.done }));
      this.setData({ todos, todoTotal: todos.length, todoRemaining: todos.filter(t => !t.done).length });
    } catch (e) {
      wx.showToast({ title: '保存失败，请确认 todos 集合已创建', icon: 'none' });
    }
  },
  async toggleTodoItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.todos.find(t => t._id === id);
    if (!item) return;
    const dbc = db();
    try {
      await dbc.collection('todos').doc(id).update({ data: { done: !item.done } });
      const todos = this.data.todos.map(t => t._id === id ? { ...t, done: !t.done } : t);
      this.setData({ todos, todoRemaining: todos.filter(t => !t.done).length });
    } catch (e) { /* 忽略 */ }
  },
  async delTodoItem(e) {
    const id = e.currentTarget.dataset.id;
    const dbc = db();
    try {
      await dbc.collection('todos').doc(id).remove();
      const todos = this.data.todos.filter(t => t._id !== id);
      this.setData({ todos, todoTotal: todos.length, todoRemaining: todos.filter(t => !t.done).length });
    } catch (e) { /* 忽略 */ }
  }
});
