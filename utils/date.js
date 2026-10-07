function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function toStr(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayStr() {
  return toStr(new Date());
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

// 以周一为一周起点，返回该周周一的日期字符串
function startOfWeekStr(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=周日
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return toStr(d);
}

// 返回 ISO 周标识，如 2026-W32（以周一为周起点）
function isoWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const oneJan = new Date(monday.getFullYear(), 0, 1);
  const week = Math.ceil((((monday - oneJan) / 86400000) + 1) / 7);
  return monday.getFullYear() + '-W' + week;
}

module.exports = { todayStr, addDays, startOfWeekStr, isoWeekKey, toStr };
