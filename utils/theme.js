// 全局深浅色主题工具
// 说明：深色模式入口已暂时隐藏，此处固定返回 'light'，
// 后续若重新开放，改回读取 storage 即可。

function getTheme() {
  return 'light';
}

// 同步微信原生导航栏颜色（深色或浅色）
function applyNavBar(theme) {
  if (theme === 'dark') {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#15171a',
      backgroundColorTop: '#15171a',
      backgroundColorBottom: '#15171a'
    });
  } else {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#f5f6f8',
      backgroundColorTop: '#f5f6f8',
      backgroundColorBottom: '#f5f6f8'
    });
  }
}

// 页面 onShow 时统一调用：读取主题、写入 data、同步导航栏
// 用法：const { syncTheme } = require('../../utils/theme');
//       onShow() { syncTheme(this); ... }
function syncTheme(page) {
  const theme = getTheme();
  page.setData({ theme });
  applyNavBar(theme);
  return theme;
}

module.exports = { getTheme, applyNavBar, syncTheme };
