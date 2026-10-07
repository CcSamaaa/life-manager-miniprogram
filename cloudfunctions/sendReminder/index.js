const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 由云开发「定时器触发器」调用：给已授权且今天未打卡的用户推送订阅消息
// 注意：需在 config.json 中配置定时触发器（如每天 20:00），
//       且前端需在用户操作（打卡）时用 wx.requestSubscribeMessage 拿到授权。
exports.main = async (event) => {
  const TmplId = process.env.REMINDER_TMPL_ID || 'your-subscribe-template-id';

  // 这里仅给出发送单条订阅消息的标准写法，完整逻辑需结合你的授权记录表实现：
  // const result = await cloud.openapi.subscribeMessage.send({
  //   touser: OPENID,
  //   templateId: TmplId,
  //   page: 'pages/today/today',
  //   data: {
  //     thing1: { value: '喝水 2000ml' }, // 习惯名称
  //     time2: { value: '20:00' }         // 提醒时间
  //     // 其余字段需与你申请的模板关键词一一对应
  //   }
  // });

  return {
    todo: '实现前请先记录用户授权状态，再按模板字段发送；当前为骨架参考。',
    templateId: TmplId
  };
};
