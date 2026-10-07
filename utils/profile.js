// 用户资料读写（集合 profiles，openid 自动隔离）
const { getOpenid, db, serverDate } = require('./cloud');

// 读取当前用户资料（若有）
async function loadProfile() {
  const openid = await getOpenid();
  if (!openid) return null;
  const dbc = db();
  const res = await dbc.collection('profiles').limit(1).get();
  return res.data && res.data[0] ? res.data[0] : null;
}

// 保存资料（首次 add，之后 set）
async function saveProfile(data) {
  const openid = await getOpenid();
  if (!openid) return null;
  const dbc = db();
  const existing = await loadProfile();
  const payload = { ...data, updatedAt: serverDate() };
  if (existing && existing._id) {
    await dbc.collection('profiles').doc(existing._id).set({ data: payload });
    return existing._id;
  }
  const r = await dbc.collection('profiles').add({ data: payload });
  return r._id;
}

module.exports = { loadProfile, saveProfile };
