const FEATURE_ORDER_KEY = 'featureOrder';
const FEATURE_HIDDEN_KEY = 'featureHidden';
const { getTheme } = require('../../utils/theme');
const SERVICES = require('../../utils/services');

const COLS = 3; // 每行卡片数（与 WXSS 31% 宽度 + 1% 间距一致）
const LONG_PRESS_MS = 400;   // 长按进入调整态的时长
const MOVE_CANCEL_PX = 10;   // 长按判定期间移动超过该值则视为滚动，取消长按

const FEATURES = [
  { key: 'habit', icon: '✅', name: '习惯打卡', desc: '每日打卡 · 连续记录', path: '/pages/habits/habits' },
  { key: 'bill', icon: '🧾', name: '记账', desc: '收支明细 · 月度汇总', path: '/pages/bill/bill' },
  // { key: 'bazi', icon: '☯️', name: '八字', desc: '四柱排盘 · 五行参考', path: '/pages/bazi/bazi' }, // AUDIT-HIDDEN 占卜类，过审后取消注释恢复
  // { key: 'liuyao', icon: '🎲', name: '六爻', desc: '三骰成卦 · 纳甲断卦', path: '/pages/liuyao/liuyao' }, // AUDIT-HIDDEN 占卜类，过审后取消注释恢复
  { key: 'training', icon: '🏋️', name: '训练规划', desc: '计划模板 · 训练记录', path: '/pages/training/training' },
  { key: 'memo', icon: '🪄', name: '灵感记录', desc: '随时记录 · 云端同步', path: '/pages/memo/memo' },
  { key: 'food', icon: '🍱', name: '食物热量', desc: '拍照识别 · AI 算热量', path: '/pages/food/food' },
  { key: 'whattoeat', icon: '🍽️', name: '今天吃什么', desc: '日历规划 · 想吃就记', path: '/pages/whattoeat/whattoeat' },
  { key: 'period', icon: '🌸', name: '经期记录', desc: '周期预测 · 日历记录', path: '/pages/period/period' },
  // { key: 'tarot', icon: '🔮', name: '塔罗', desc: '选牌阵 · 抽牌解签', path: '/pages/tarot/tarot' }, // AUDIT-HIDDEN 占卜类，过审后取消注释恢复
  // { key: 'sign', icon: '🎴', name: '每日一签', desc: '选签筒 · 今日运势', path: '/pages/sign/sign' }, // AUDIT-HIDDEN 占卜类，过审后取消注释恢复
  { key: 'schedule', icon: '🗓️', name: '日程安排', desc: '日历排程 · 到期提醒', path: '/pages/schedule/schedule' },
  { key: 'emotion', icon: '🎨', name: '情绪日记', desc: '记录每天的心情色彩', path: '/pages/emotion/emotion' },
  { key: 'cainiao', icon: '📦', name: '菜鸟驿站', desc: '跳转查件 · 取件码', miniapp: 'cainiao' },
  { key: 'transit', icon: '🚇', name: '地铁乘车码', desc: '跳转乘车码小程序', miniapp: 'transit' },
  { key: 'map', icon: '🗺️', name: '腾讯地图', desc: '跳转地图查位置', miniapp: 'map' }
];

// 由本地保存的顺序数组构建 { key: 序号 } 映射，缺省按默认数组顺序
function buildOrderMap(savedArr) {
  const keys = FEATURES.map(f => f.key);
  const map = {};
  keys.forEach((k, i) => { map[k] = i; });
  if (Array.isArray(savedArr)) {
    savedArr.forEach((k, i) => { if (k in map) map[k] = i; });
  }
  const sorted = keys.slice().sort((a, b) => map[a] - map[b]);
  sorted.forEach((k, i) => { map[k] = i; });
  return map;
}

Page({
  data: {
    visibleList: [],
    hiddenList: [],
    editing: false,
    adjusting: false,    // 长按进入的调整态
    lockScroll: false,   // 调整态锁定纵向滚动
    dragKey: null,
    absLayout: false,    // 可见区是否启用绝对定位（用于拖拽）
    gridHeight: 0
  },

  // 非 data 的缓存
  grid: null,
  dragStarted: false,
  orderArr: [],
  _pressTimer: null,
  _adjusting: false,
  _moved: false,
  _startX: 0,
  _startY: 0,
  _offsetX: 0,
  _offsetY: 0,

  onShow() {
    const theme = getTheme();
    this.applyNavBar(theme);
    this._adjusting = false;
    this.setData({ editing: false, dragKey: null, absLayout: false, lockScroll: false, adjusting: false, theme });
    this.rebuild();
  },

  onReady() {
    // 首屏渲染完成后测量网格几何，供编辑态拖拽使用
    this.queryRects();
  },

  rebuild() {
    const theme = getTheme();
    const savedOrder = wx.getStorageSync(FEATURE_ORDER_KEY);
    const savedHidden = wx.getStorageSync(FEATURE_HIDDEN_KEY);
    const orderMap = buildOrderMap(savedOrder);
    const hiddenMap = {};
    (Array.isArray(savedHidden) ? savedHidden : []).forEach(k => { hiddenMap[k] = true; });

    let all = FEATURES.map(f => ({
      ...f,
      hidden: !!hiddenMap[f.key],
      order: orderMap[f.key]
    }));
    all.sort((a, b) => a.order - b.order);

    const visible = all.filter(f => !f.hidden);
    const hidden = all.filter(f => f.hidden);
    if (this.grid) this.layoutList(visible);
    this.setData({
      visibleList: visible,
      hiddenList: hidden,
      theme,
      gridHeight: this.calcHeight(visible.length)
    });
  },

  // 根据列表顺序，计算每个卡片在网格中的 translate 坐标（绝对定位，避免 order 重排闪烁）
  layoutList(list) {
    const g = this.grid;
    const drag = this.dragKey;
    list.forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      if (g) {
        item.tx = g.startLeft + col * g.stepX;
        item.ty = g.startTop + row * g.stepY;
      } else {
        item.tx = 0;
        item.ty = 0;
      }
      item.scale = (item.key === drag) ? 1.06 : 1;
    });
    return list;
  },

  calcHeight(n) {
    if (!this.grid) return 0;
    const rows = Math.ceil(n / COLS);
    return this.grid.startTop * 2 + (rows - 1) * this.grid.stepY + this.grid.cellH;
  },

  applyNavBar(theme) {
    if (theme === 'dark') {
      wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#15171a', backgroundColorTop: '#15171a', backgroundColorBottom: '#15171a' });
    } else {
      wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#f5f6f8', backgroundColorTop: '#f5f6f8', backgroundColorBottom: '#f5f6f8' });
    }
  },

  toggleEdit() {
    const next = !this.data.editing;
    if (next) {
      this.setData({ editing: true, dragKey: null, absLayout: false, lockScroll: false, adjusting: false });
      this.rebuild();
      setTimeout(() => this._measure(), 60);
    } else {
      this.setData({ editing: false, dragKey: null, absLayout: false, lockScroll: false, adjusting: false });
      this.rebuild();
    }
  },

  _measure() {
    const q = this.createSelectorQuery();
    q.select('.grid').boundingClientRect();
    q.selectAll('.grid .cell').boundingClientRect();
    q.exec((res) => {
      const gridRect = res && res[0];
      const rects = (res && res[1]) || [];
      if (!gridRect || !rects.length) return;
      const r0 = rects[0];
      const cellW = r0.width, cellH = r0.height;
      const startLeft = r0.left - gridRect.left;
      const startTop = r0.top - gridRect.top;
      const r1 = rects[1] || r0;
      const stepX = r1.left - r0.left || (cellW + 10);
      const r3 = rects[3] || r0;
      const stepY = rects.length > 3 ? (r3.top - r0.top) : (cellH + 10);
      this.grid = {
        cellW, cellH, startLeft, startTop, stepX, stepY,
        gridLeft: gridRect.left, gridTop: gridRect.top
      };
      const list = this.data.visibleList.map(it => ({ ...it }));
      this.layoutList(list);
      const patch = { visibleList: list, gridHeight: this.calcHeight(list.length) };
      // 进入编辑态后测得几何，再切绝对定位（避免卡片重叠）
      if (this.data.editing) patch.absLayout = true;
      this.setData(patch);
    });
  },

  // 兼容旧调用名
  queryRects() { this._measure(); },

  // 按下卡片：启动长按计时；期间大幅移动则视为滚动，取消长按
  onHandleStart(e) {
    if (!this.data.editing || !this.grid) return;
    const key = e.currentTarget.dataset.key;
    const t = e.touches[0];
    this._pressKey = key;
    this._startX = t.clientX;
    this._startY = t.clientY;
    this._moved = false;
    if (this._pressTimer) { clearTimeout(this._pressTimer); this._pressTimer = null; }
    this._pressTimer = setTimeout(() => {
      if (!this._moved) this.enterAdjust(key);
    }, LONG_PRESS_MS);
  },

  // 进入调整态：锁定纵向滚动，记录偏移，轻微震动反馈
  enterAdjust(key) {
    if (!this.grid) return;
    this._adjusting = true;
    this.dragStarted = false;
    this.dragKey = key;
    this.orderArr = this.data.visibleList.map(it => it.key);
    const g = this.grid;
    const card = this.data.visibleList.find(it => it.key === key);
    if (!card) return;
    this._offsetX = (this._startX - g.gridLeft) - (card.tx + g.cellW / 2);
    this._offsetY = (this._startY - g.gridTop) - (card.ty + g.cellH / 2);
    try { wx.vibrateShort({ type: 'light' }); } catch (err) {}
    this.setData({ adjusting: true, lockScroll: true, dragKey: key });
  },

  onDragMove(e) {
    if (!this.data.editing) return;
    if (!this._adjusting) {
      // 未进入调整态：判断是否在滚动；大幅移动则取消长按
      const t = e.touches[0];
      if (Math.abs(t.clientX - this._startX) > MOVE_CANCEL_PX ||
          Math.abs(t.clientY - this._startY) > MOVE_CANCEL_PX) {
        this._moved = true;
        if (this._pressTimer) { clearTimeout(this._pressTimer); this._pressTimer = null; }
      }
      return;
    }

    // 调整态：被拖卡片跟随手指，其余卡片平滑让位
    const g = this.grid;
    const t = e.touches[0];
    const x = t.clientX, y = t.clientY;
    this.dragStarted = true;

    const centerX = (x - g.gridLeft) - this._offsetX;
    const centerY = (y - g.gridTop) - this._offsetY;
    const dragTx = centerX - g.cellW / 2;
    const dragTy = centerY - g.cellH / 2;

    const fx = x - g.gridLeft;
    const fy = y - g.gridTop;
    const n = this.orderArr.length;
    const rows = Math.ceil(n / COLS);
    let col = Math.round((fx - g.startLeft - g.cellW / 2) / g.stepX);
    let row = Math.round((fy - g.startTop - g.cellH / 2) / g.stepY);
    col = Math.max(0, Math.min(COLS - 1, col));
    row = Math.max(0, Math.min(rows - 1, row));
    const targetIndex = Math.max(0, Math.min(n - 1, row * COLS + col));
    const targetKey = this.orderArr[targetIndex];

    const byKey = {};
    this.data.visibleList.forEach(it => { byKey[it.key] = it; });

    if (targetKey && targetKey !== this.dragKey) {
      const i = this.orderArr.indexOf(this.dragKey);
      const j = targetIndex;
      const tmp = this.orderArr[i];
      this.orderArr[i] = this.orderArr[j];
      this.orderArr[j] = tmp;
      const newList = this.orderArr.map(k => ({ ...byKey[k] }));
      this.layoutList(newList);
      const dragItem = newList.find(it => it.key === this.dragKey);
      dragItem.tx = dragTx;
      dragItem.ty = dragTy;
      this.setData({ visibleList: newList });
    } else {
      const list = this.data.visibleList.map(it => ({ ...it }));
      const dragItem = list.find(it => it.key === this.dragKey);
      dragItem.tx = dragTx;
      dragItem.ty = dragTy;
      this.setData({ visibleList: list });
    }
  },

  // 结束触摸：若处于调整态则落库并解锁滚动
  onDragEnd() {
    if (this._pressTimer) { clearTimeout(this._pressTimer); this._pressTimer = null; }
    if (this._adjusting) {
      if (this.dragStarted) wx.setStorageSync(FEATURE_ORDER_KEY, this.orderArr);
      this._adjusting = false;
      this.dragStarted = false;
      this.dragKey = null;
      const list = this.data.visibleList.map(it => ({ ...it }));
      this.layoutList(list);
      this.setData({ visibleList: list, dragKey: null, adjusting: false, lockScroll: false });
    }
    this._moved = false;
  },

  // 隐藏 / 显示某个功能卡片
  toggleHidden(e) {
    const key = e.currentTarget.dataset.key;
    const arr = wx.getStorageSync(FEATURE_HIDDEN_KEY);
    let h = Array.isArray(arr) ? arr.slice() : [];
    const idx = h.indexOf(key);
    if (idx >= 0) h.splice(idx, 1); else h.push(key);
    wx.setStorageSync(FEATURE_HIDDEN_KEY, h);
    this.rebuild();
  },

  go(e) {
    if (this.data.editing) return; // 编辑态不跳转
    const ds = e.currentTarget.dataset;
    if (ds.miniapp) { this.openMiniProgram(ds.miniapp); return; }
    wx.navigateTo({ url: ds.path });
  },

  openMiniProgram(key) {
    const cfg = SERVICES[key];
    if (!cfg || !cfg.appId) {
      wx.showModal({
        title: '尚未配置',
        content: '请在 utils/services.js 填入「' + (cfg ? cfg.name : '该服务') + '」的 AppID，并在 app.json 的 navigateToMiniProgramAppIdList 中声明后，即可一键跳转。',
        showCancel: false
      });
      return;
    }
    wx.navigateToMiniProgram({
      appId: cfg.appId,
      path: cfg.path || '',
      fail: () => wx.showToast({ title: '跳转失败', icon: 'none' })
    });
  }
});
