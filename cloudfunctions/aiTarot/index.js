const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 与 aiFood 完全同源：OpenAI 兼容文本接口，通过环境变量配置厂商/密钥/模型
// 依赖：在云函数目录执行  npm install axios
let axios = null;
try { axios = require('axios'); } catch (e) { axios = null; }

// 在「云开发控制台 → 云函数 → aiTarot → 配置 → 环境变量」中设置（与 aiFood 共用同一套）：
//   AI_API_KEY  = 你的模型 API Key
//   AI_API_URL  = 接口地址（默认 OpenAI，可改国内兼容地址）
//   AI_MODEL    = 模型名（如 gpt-4o-mini / glm-4 / qwen-turbo 等文本模型）
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'glm-4v';

// 占卜师人设（系统提示），每次请求自动前置，客户端无需关心
const SYSTEM_PROMPT =
  '你是一位温柔而敏锐的塔罗占卜师，擅长把牌面与提问者的处境结合起来做有温度的解读。\n' +
  '规则：\n' +
  '- 解读要具体，紧扣用户的问题、牌阵各个位置的含义，以及每张牌的正位/逆位牌义，避免空泛套话。\n' +
  '- 语气温暖、像在对话，而不是机械罗列牌义。\n' +
  '- 遇到抉择类问题，给出不同角度的参考，不要替用户做决定。\n' +
  '- 文末用一两句话收束，并自然带出"塔罗是映照内心的镜子，结果仅供娱乐与自我觉察参考"。\n' +
  '- 使用简体中文，分段清晰、易读。';

exports.main = async (event) => {
  // messages: 对话历史（不含系统消息），形如 [{ role:'user', content }, { role:'assistant', content }, ...]
  const messages = event.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, msg: '缺少对话内容' };
  }

  // 未配置密钥（或缺少 axios）时返回本地模拟解读，方便先跑通 UI
  if (!AI_API_KEY || !axios) {
    return mockReply(messages);
  }

  try {
    const resp = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
        temperature: 0.8
      },
      { headers: { Authorization: 'Bearer ' + AI_API_KEY, 'Content-Type': 'application/json' } }
    );

    const content = resp.data.choices[0].message.content;
    return { ok: true, mock: false, answer: content };
  } catch (e) {
    const msg =
      (e.response && e.response.data && e.response.data.error && e.response.data.error.message) ||
      e.message;
    return { ok: false, msg: 'AI 解读失败：' + msg };
  }
};

// 未配置密钥时的模拟解读：尽量结合用户问题与牌面，给出有结构、可阅读的参考文字
function mockReply(messages) {
  const lastUser = messages.filter((m) => m.role === 'user').pop();
  const text = (lastUser && lastUser.content) || '';

  // 解析首条结构化内容里的「抽牌结果」
  // firstPrompt 格式：1. 位置「指引」：圣杯首牌（正位）\n   牌义：...
  const cardLines = [];
  const re = /(\d+)\.\s*位置「(.+?)」：(.+?)（(正位|逆位)）/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    cardLines.push(`${m[2]}抽到 ${m[3]}（${m[4]}）`);
  }

  let head = '（演示模式：未配置 AI_API_KEY，以下为本地生成的参考解读，配置密钥后即为真实 AI 解读）\n\n';
  if (cardLines.length > 0) {
    head += '本次牌面：' + cardLines.join('；') + '。\n\n';
  } else if (text) {
    head += '你的问题里藏着此刻最在意的事，牌面正试图为你映照出答案。\n\n';
  }

  const tail =
    '牌与牌之间彼此呼应，建议结合你当下的真实处境去体会其中的提醒。' +
    '塔罗是映照内心的镜子，结果仅供娱乐与自我觉察参考。';

  return { ok: true, mock: true, answer: head + tail };
}
