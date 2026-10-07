// 天气模块：通过云函数代理获取天气数据（无需配置域名白名单）
// 城市检索：本地数据库 utils/cities.js

const STORAGE_KEY = 'weather_cities';
const { searchCities } = require('./cities');

// WMO 天气代码 → 文字 + 图标
const WMO = {
  0: ['晴', '☀️'], 1: ['晴间多云', '🌤️'], 2: ['部分多云', '⛅'], 3: ['阴', '☁️'],
  45: ['雾', '🌫️'], 48: ['雾凇', '🌫️'],
  51: ['小毛毛雨', '🌦️'], 53: ['毛毛雨', '🌦️'], 55: ['浓毛毛雨', '🌦️'],
  56: ['冻毛毛雨', '🌧️'], 57: ['冻毛毛雨', '🌧️'],
  61: ['小雨', '🌧️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
  66: ['冻雨', '🌧️'], 67: ['冻雨', '🌧️'],
  71: ['小雪', '🌨️'], 73: ['中雪', '🌨️'], 75: ['大雪', '🌨️'], 77: ['雪粒', '🌨️'],
  80: ['阵雨', '🌦️'], 81: ['阵雨', '🌦️'], 82: ['强阵雨', '⛈️'],
  85: ['阵雪', '🌨️'], 86: ['阵雪', '🌨️'],
  95: ['雷阵雨', '⛈️'], 96: ['雷阵雨伴冰雹', '⛈️'], 99: ['强雷暴冰雹', '⛈️']
};

function wmoInfo(code) {
  const v = WMO[code];
  return v ? { text: v[0], icon: v[1] } : { text: '未知', icon: '🌡️' };
}

/**
 * 通过云函数获取某经纬度的当前天气
 * 云函数代理请求 Open-Meteo，无需域名白名单
 */
function fetchWeather(lat, lon) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getWeather',
      data: { lat, lon },
      success(res) {
        const d = res.result;
        if (!d || d.err) {
          reject(new Error(d ? d.err : '天气数据异常'));
          return;
        }
        const info = wmoInfo(d.code);
        resolve({
          temp: d.temp,
          feels: d.feels,
          humidity: d.humidity,
          wind: d.wind,
          code: d.code,
          text: info.text,
          icon: info.icon
        });
      },
      fail(err) {
        reject(new Error('云函数调用失败：' + (err.errMsg || '未知错误')));
      }
    });
  });
}

/**
 * 本地城市搜索（模糊匹配）
 * @param {string} name - 城市名关键词
 * @returns {Array} 匹配列表 [{name, lat, lon, province}]
 */
function searchCity(name) {
  const results = searchCities(name, 10);
  if (results.length === 0) {
    throw new Error('未找到该城市，请尝试其他名称');
  }
  return results;
}

// 本地存储的城市列表
function getCities() {
  return wx.getStorageSync(STORAGE_KEY) || [];
}
function saveCities(list) {
  wx.setStorageSync(STORAGE_KEY, list);
}

module.exports = { fetchWeather, searchCity, getCities, saveCities, wmoInfo };
