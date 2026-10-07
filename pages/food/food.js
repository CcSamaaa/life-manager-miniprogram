const db = wx.cloud.database();
const COL = 'food_log';
const { syncTheme } = require('../../utils/theme');

function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

Page({
  data: {
    logs: [],
    loading: false,
    result: null, // { foods, total, mock, fileID }
    preview: '', // 当前图片本地临时路径
    saving: false
  },

  onShow() {
    syncTheme(this);
    this.loadLogs();
  },

  loadLogs() {
    const self = this;
    db.collection(COL).orderBy('createdAt', 'desc').get({
      success(res) {
        const logs = res.data.map((l) => ({
          _id: l._id,
          total: l.total,
          foods: l.foods || [],
          foodNames: (l.foods || []).map((f) => f.name).join('、'),
          fileID: l.fileID,
          dateText: fmtDate(l.createdAt)
        }));
        const ids = logs.map((l) => l.fileID).filter(Boolean);
        if (ids.length === 0) {
          self.setData({ logs });
          return;
        }
        wx.cloud.getTempFileURL({
          fileList: ids,
          success(t) {
            const map = {};
            (t.fileList || []).forEach((f) => { map[f.fileID] = f.tempFileURL; });
            logs.forEach((l) => { l.img = map[l.fileID] || ''; });
            self.setData({ logs });
          },
          fail() { self.setData({ logs }); }
        });
      },
      fail() {}
    });
  },

  chooseImage() {
    const self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const temp = res.tempFiles[0].tempFilePath;
        self.setData({ preview: temp, result: null, loading: true });
        self.uploadAndRecognize(temp);
      }
    });
  },

  uploadAndRecognize(tempPath) {
    const self = this;
    const m = tempPath.match(/\.(\w+)$/);
    const ext = m ? m[1] : 'jpg';
    const cloudPath = `food/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success(up) {
        wx.cloud.callFunction({
          name: 'aiFood',
          data: { fileID: up.fileID },
          success(r) {
            const d = r.result || {};
            if (!d.ok) {
              self.setData({ loading: false });
              wx.showToast({ title: d.msg || '识别失败', icon: 'none' });
              return;
            }
            self.setData({
              loading: false,
              result: { foods: d.foods, total: d.total, mock: d.mock, fileID: up.fileID }
            });
          },
          fail(err) {
            self.setData({ loading: false });
            const msg = (err && err.errMsg) || '调用失败';
            wx.showToast({ title: msg.length > 20 ? '调用失败' : msg, icon: 'none' });
            console.error('[aiFood] 调用失败:', JSON.stringify(err));
          }
        });
      },
      fail() {
        self.setData({ loading: false });
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },

  saveResult() {
    const r = this.data.result;
    if (!r) return;
    const self = this;
    self.setData({ saving: true });
    db.collection(COL).add({
      data: {
        fileID: r.fileID,
        foods: r.foods,
        total: r.total,
        createdAt: db.serverDate()
      },
      success() {
        self.setData({ saving: false, result: null, preview: '' });
        wx.showToast({ title: '已保存', icon: 'success' });
        self.loadLogs();
      },
      fail() {
        self.setData({ saving: false });
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  discard() {
    this.setData({ result: null, preview: '' });
  },

  viewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ urls: [url], current: url });
  },

  delLog(e) {
    const id = e.currentTarget.dataset.id;
    const self = this;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条记录吗？',
      confirmColor: '#e64340',
      success(r) {
        if (r.confirm) {
          db.collection(COL).doc(id).remove({
            success() { self.loadLogs(); },
            fail() { wx.showToast({ title: '删除失败', icon: 'none' }); }
          });
        }
      }
    });
  }
});
