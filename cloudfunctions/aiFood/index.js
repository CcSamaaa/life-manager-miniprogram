const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 多模态视觉模型调用（OpenAI 兼容接口，可替换为通义/智谱/混元等）
// 依赖：在云函数目录执行  npm install axios
let axios = null;
try { axios = require('axios'); } catch (e) { axios = null; }

// 在「云开发控制台 → 云函数 → aiFood → 配置 → 环境变量」中设置：
//   AI_API_KEY  = 你的模型 API Key
//   AI_API_URL  = 接口地址（默认 OpenAI，可改国内兼容地址）
//   AI_MODEL    = 模型名（如 gpt-4o-mini / qwen-vl-max 等）
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'glm-4v';

exports.main = async (event) => {
  const { fileID } = event;
  if (!fileID) return { ok: false, msg: '缺少图片 fileID' };

  // 1. 换取临时访问地址（模型需要可访问的图片 URL）
  let url = '';
  try {
    const r = await cloud.getTempFileURL({ fileList: [fileID] });
    url = r.fileList && r.fileList[0] && r.fileList[0].tempFileURL;
  } catch (e) {
    return { ok: false, msg: '获取图片地址失败：' + e.message };
  }
  if (!url) return { ok: false, msg: '图片地址为空' };

  // 2. 未配置 API Key（或缺少 axios）时返回示例数据，方便先跑通 UI
  if (!AI_API_KEY || !axios) {
    return mockResult();
  }

  // 3. 调用多模态模型，要求以 JSON 返回食物与热量
  const prompt =
    '请识别这张食物图片中包含的食物。仅以 JSON 返回，不要任何多余文字。' +
    '格式：{"foods":[{"name":"食物名(中文)","weight":估算克数(整数),"calories":估算千卡(整数)}],"total":总千卡(整数)}。' +
    '若图中无法判断具体食物，请基于可见内容给出最合理的估算；若完全无关，foods 返回空数组、total 为 0。';

  try {
    const resp = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url } }
            ]
          }
        ],
        temperature: 0.2
      },
      { headers: { Authorization: 'Bearer ' + AI_API_KEY, 'Content-Type': 'application/json' } }
    );

    let content = resp.data.choices[0].message.content;
    // 智谱等国产模型可能不返回纯 JSON，尝试从文本中提取
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const foods = Array.isArray(data.foods) ? data.foods : [];
    const total = Number(data.total) || foods.reduce((s, f) => s + (Number(f.calories) || 0), 0);
    return { ok: true, mock: false, foods, total };
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.error && e.response.data.error.message) || e.message;
    return { ok: false, msg: 'AI 识别失败：' + msg };
  }
};

// 未配置密钥时的演示数据（带 mock 标记，前端会提示）
function mockResult() {
  return {
    ok: true,
    mock: true,
    foods: [
      { name: '白米饭', weight: 150, calories: 174 },
      { name: '番茄炒蛋', weight: 120, calories: 132 },
      { name: '清炒西兰花', weight: 80, calories: 28 }
    ],
    total: 334
  };
}
