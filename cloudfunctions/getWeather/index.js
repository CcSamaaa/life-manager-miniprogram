// 云函数 - 天气代理
// 代理 Open-Meteo 免费天气接口，解决小程序域名白名单问题
// 使用 Node.js 内置 https 模块，无需安装任何第三方依赖
const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const BASE_HOST = 'api.open-meteo.com';
const BASE_PATH = '/v1/forecast';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('解析失败')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
  });
}

exports.main = async (event, context) => {
  const { lat, lon } = event;

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return { err: '缺少经纬度参数' };
  }

  try {
    const url = `https://${BASE_HOST}${BASE_PATH}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    const body = await httpGet(url);

    if (!body || !body.current) {
      return { err: '天气数据异常' };
    }

    const c = body.current;
    return {
      temp: Math.round(c.temperature_2m),
      feels: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      wind: Math.round(c.wind_speed_10m),
      code: c.weather_code
    };
  } catch (e) {
    console.error('getWeather error:', e.message);
    return { err: '获取天气失败: ' + (e.message || '未知错误') };
  }
};
