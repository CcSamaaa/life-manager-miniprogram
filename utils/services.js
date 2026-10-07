// 外部小程序跳转配置
// 说明：菜鸟驿站（阿里系）、地铁乘车码（微信卡包硬件能力）都无法接入本小程序内部，
// 只能用「跳转打开对方官方小程序」的方式。
//
// ⚠️ 必须填写真实 AppID，否则点开只会提示「尚未配置」：
//   1) 在微信里搜索对应小程序 → 进入 → 右上角「...」→「关于...」→ 点小程序名字 → 复制 AppID
//   2) 把 AppID 填到下面对应位置
//   3) 同时写进 app.json 的 navigateToMiniProgramAppIdList（否则正式版会报“不在白名单”）
module.exports = {
  cainiao: {
    name: '菜鸟裹裹',
    appId: '',          // ← 填入菜鸟裹裹小程序的 AppID
    path: ''            // 留空进首页；如需指定页可填，如 'pages/index/index'
  },
  transit: {
    name: '腾讯乘车码',
    appId: 'wxbcad394bacd51cfb',   // 参考值（非官方公开，请以微信内复制为准）
    path: ''
  },
  map: {
    name: '腾讯地图+',
    appId: 'wx7643d5f831302ab0',   // 腾讯地图+ 官方小程序 AppID（已核实）
    path: ''                       // 留空进首页；路线页可填 pages/multiScheme/multiScheme?endLoc={...}
  }
};
