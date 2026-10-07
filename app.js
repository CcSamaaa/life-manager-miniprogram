const { CLOUD_ENV } = require('./utils/config');

App({
  globalData: {
    openid: null,
    env: CLOUD_ENV
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库不支持云开发，请使用 2.2.3 及以上的基础库');
      return;
    }
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true
    });
    this.ensureLogin();
  },

  ensureLogin() {
    const cached = wx.getStorageSync('openid');
    if (cached) {
      this.globalData.openid = cached;
      return;
    }
    wx.cloud.callFunction({ name: 'login' })
      .then(res => {
        const openid = res.result && res.result.openid;
        if (openid) {
          this.globalData.openid = openid;
          wx.setStorageSync('openid', openid);
        }
      })
      .catch(err => console.error('登录失败', err));
  }
});
