const { CLOUD_ENV } = require('./config');

// 获取当前用户 openid（带本地缓存，云函数仅首次调用）
function getOpenid() {
  return new Promise((resolve) => {
    const cached = wx.getStorageSync('openid');
    if (cached) return resolve(cached);
    wx.cloud.callFunction({ name: 'login' })
      .then(res => {
        const openid = res.result && res.result.openid;
        if (openid) {
          wx.setStorageSync('openid', openid);
          resolve(openid);
        } else {
          resolve(null);
        }
      })
      .catch(() => resolve(null));
  });
}

function db() {
  return wx.cloud.database();
}

function serverDate() {
  return db().serverDate();
}

module.exports = { getOpenid, db, serverDate, CLOUD_ENV };
