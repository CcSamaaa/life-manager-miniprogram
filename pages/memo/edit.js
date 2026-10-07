const db = wx.cloud.database();
const COL = 'memo';
const { syncTheme } = require('../../utils/theme');

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function fmtFull(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

Page({
  data: {
    id: '',
    content: '',
    dateText: '',
    canDelete: false,
    statusBar: 20
  },
  _timer: null,
  _creating: false,

  onShow() {
    syncTheme(this);
  },

  onLoad(q) {
    const info = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync());
    const statusBar = info.statusBarHeight || 20;
    const id = q.id || '';
    this.setData({ id, canDelete: !!id, statusBar });
    if (id) {
      this.loadOne(id);
    } else {
      this.setData({ dateText: fmtFull(Date.now()) });
    }
  },

  loadOne(id) {
    const self = this;
    db.collection(COL).doc(id).get({
      success(res) {
        self.setData({
          content: res.data.content || '',
          dateText: fmtFull(res.data.updatedAt || Date.now())
        });
      },
      fail(err) {
        console.error('加载灵感记录失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  onInput(e) {
    const v = e.detail.value;
    this.setData({ content: v, dateText: fmtFull(Date.now()) });
    this.scheduleSave(v);
  },

  scheduleSave(v) {
    const self = this;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => self.save(v), 800);
  },

  // 直接保存（带防重复创建）
  save(content, cb) {
    const c = (content === undefined || content === null) ? this.data.content : content;
    const self = this;
    const stamp = db.serverDate();
    if (!this.data.id) {
      if (this._creating) { cb && cb(); return; }
      if (!c || !c.trim()) { cb && cb(); return; }
      this._creating = true;
      db.collection(COL).add({
        data: { content: c, createdAt: stamp, updatedAt: stamp },
        success(res) {
          self._creating = false;
          self.setData({ id: res._id, canDelete: true });
          cb && cb();
        },
        fail(err) { self._creating = false; console.error('保存失败', err); cb && cb(); }
      });
    } else {
      db.collection(COL).doc(this.data.id).update({
        data: { content: c, updatedAt: stamp },
        success() { cb && cb(); },
        fail(err) { console.error('更新失败', err); cb && cb(); }
      });
    }
  },

  // 立即落盘（清掉待执行的防抖）
  flush(cb) {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this.save(this.data.content, cb);
  },

  back() {
    const c = this.data.content;
    if (!c || !c.trim()) {
      if (this.data.id) db.collection(COL).doc(this.data.id).remove({});
      wx.navigateBack();
      return;
    }
    this.flush(() => wx.navigateBack());
  },

  onDelete() {
    if (!this.data.id) { wx.navigateBack(); return; }
    const self = this;
    wx.showModal({
      title: '删除灵感记录',
      content: '确定删除这条灵感记录吗？',
      confirmColor: '#e64340',
      success(r) {
        if (r.confirm) {
          db.collection(COL).doc(self.data.id).remove({
            success() { wx.navigateBack(); },
            fail(err) { console.error(err); wx.showToast({ title: '删除失败', icon: 'none' }); }
          });
        }
      }
    });
  },

  onUnload() {
    if (this._creating) return; // 创建中，交给异步请求完成
    const c = this.data.content;
    if (!c || !c.trim()) {
      if (this.data.id) db.collection(COL).doc(this.data.id).remove({});
      return;
    }
    this.flush();
  }
});
