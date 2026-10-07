const db = wx.cloud.database();
const COL = 'memo';
const { syncTheme } = require('../../utils/theme');

function pad(n) { return n < 10 ? '0' + n : '' + n; }

// iPhone 风格的相对日期：今天/昨天 显示时间，当年显示 月日，跨年显示 年月日
function fmtListDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return '今天 ' + hm;
  const yest = new Date(now.getTime() - 86400000);
  const isYest = d.getFullYear() === yest.getFullYear() && d.getMonth() === yest.getMonth() && d.getDate() === yest.getDate();
  if (isYest) return '昨天 ' + hm;
  if (d.getFullYear() === now.getFullYear()) return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

Page({
  data: {
    notes: [],
    filtered: [],
    kw: '',
    swipeId: '',
    loading: true
  },

  onShow() {
    syncTheme(this);
    this.loadNotes();
  },

  onPullDownRefresh() {
    this.loadNotes();
    wx.stopPullDownRefresh();
  },

  loadNotes() {
    const self = this;
    this.setData({ loading: true });
    db.collection(COL).orderBy('updatedAt', 'desc').get({
      success(res) {
        const notes = res.data.map(n => {
          const lines = (n.content || '').split('\n');
          const title = (lines[0] || '').trim() || '新建灵感记录';
          const preview = lines.slice(1).join(' ').trim();
          return Object.assign({}, n, {
            title,
            preview,
            dateText: fmtListDate(n.updatedAt)
          });
        });
        self.setData({ notes, loading: false });
        self.applyFilter();
      },
      fail(err) {
        console.error('加载灵感记录失败', err);
        self.setData({ loading: false });
      }
    });
  },

  onSearch(e) {
    this.setData({ kw: e.detail.value });
    this.applyFilter();
  },

  applyFilter() {
    const kw = this.data.kw.trim();
    if (!kw) {
      this.setData({ filtered: this.data.notes });
      return;
    }
    const f = this.data.notes.filter(n =>
      (n.title && n.title.indexOf(kw) >= 0) ||
      (n.preview && n.preview.indexOf(kw) >= 0) ||
      (n.content && n.content.indexOf(kw) >= 0)
    );
    this.setData({ filtered: f });
  },

  openNote(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.swipeId) { this.setData({ swipeId: '' }); return; }
    wx.navigateTo({ url: '/pages/memo/edit?id=' + id });
  },

  newNote() {
    wx.navigateTo({ url: '/pages/memo/edit' });
  },

  touchStart(e) {
    this._sx = e.touches[0].clientX;
  },

  touchEnd(e) {
    if (this._sx == null) return;
    const dx = e.changedTouches[0].clientX - this._sx;
    const id = e.currentTarget.dataset.id;
    if (dx < -40) this.setData({ swipeId: id });
    else if (dx > 40) this.setData({ swipeId: '' });
    this._sx = null;
  },

  closeSwipe() {
    this.setData({ swipeId: '' });
  },

  delNote(e) {
    const id = e.currentTarget.dataset.id;
    const self = this;
    wx.showModal({
      title: '删除灵感记录',
      content: '确定删除这条灵感记录吗？',
      confirmColor: '#e64340',
      success(r) {
        if (r.confirm) {
          db.collection(COL).doc(id).remove({
            success() {
              self.setData({ swipeId: '' });
              self.loadNotes();
            },
            fail(err) { console.error('删除失败', err); }
          });
        }
      }
    });
  }
});
