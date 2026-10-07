# 每日习惯打卡小程序 — 项目骨架概览

> 生成日期：2026-08-08 ｜ 架构：微信小程序 + 云开发（CloudBase）

## 已完成内容
按前期对齐的需求，生成了一套**可直接在微信开发者工具中运行**的小程序骨架。

### 文件结构
```
app.json / app.js / app.wxss        全局配置、云初始化、全局样式
project.config.json / sitemap.json  项目配置
utils/
  config.js   云环境 ID、订阅模板 ID（占位，需替换）
  cloud.js    openid 获取 + 数据库封装
  date.js     日期 / 自然周计算
  seed.js     10 个起步习惯（首次打开预置）
  stats.js    连续打卡天数 / 连续达标周数计算
cloudfunctions/
  login/          获取 openid（云函数）
  sendReminder/   订阅消息定时推送（参考实现）
components/
  habit-item/     习惯卡片（今天页 / 我的页复用）
pages/
  today/    今天首页：打卡、取消、种子预置、打卡时请求订阅授权
  habits/   习惯管理：增 / 删 / 改（emoji、每日/每周、每周次数）
  mine/     我的·历史：各习惯连续天数 / 连续达标周数
```

### 关键设计
- **多用户隔离**：云开发数据库默认「仅创建者可读写」，每个微信用户自动获得 `openid`，家人朋友扫码即用、互不可见，无需登录系统。
- **频次模型**：`daily`（当天有记录=完成）/ `weekly`（自然周内记录数 ≥ N = 达标）。
- **连续统计**：每日习惯算连续打卡天数；每周习惯算连续达标周数（近 12 周回溯）。
- **订阅提醒**：打卡时借 `wx.requestSubscribeMessage` 顺带请求一次性订阅授权（微信限制：授权一次发一条，发完需再授权）。

## 你接下来要做的（联调前置）
1. 注册**个人小程序账号**，拿到 AppID，替换 `project.config.json` 里的 `touristappid`。
2. 微信开发者工具中**开通云开发**，把环境 ID 填进 `utils/config.js` 的 `CLOUD_ENV`。
3. 云开发控制台**创建集合** `habits`、`checkins`，权限设为「仅创建者可读写」。
4. 右键 `cloudfunctions/login` → **上传并部署**（云端安装 wx-server-sdk）。
5. 在「功能 → 订阅消息」申请一次性订阅模板，把模板 ID 填进 `REMINDER_TMPL_ID`。
6. 真机预览：首次打开会自动写入 10 个起步习惯。

## 已知限制 / 后续可加
- 当前为骨架，**未做**真实服务器推送（需给 `sendReminder` 配定时器触发器并记录授权状态）。
- 未做数据导出 / 换设备迁移（可后续加云函数导出 JSON）。
- UI 为原生简洁风，未引入组件库；后续可上 TDesign 或做沉浸式视觉。
