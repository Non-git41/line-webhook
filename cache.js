// เก็บข้อมูลสมาชิกไว้ในหน่วยความจำ ลดการ query database
const userCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 นาที

function getCache(lineUserId) {
  const cached = userCache[lineUserId];
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    delete userCache[lineUserId];
    return null;
  }
  return cached.data;
}

function setCache(lineUserId, data) {
  userCache[lineUserId] = { data, timestamp: Date.now() };
}

function clearCache(lineUserId) {
  delete userCache[lineUserId];
}

function clearAllCache() {
  const count = Object.keys(userCache).length;
  Object.keys(userCache).forEach((key) => delete userCache[key]);
  return count;
}

function cacheSize() {
  return Object.keys(userCache).length;
}

module.exports = { getCache, setCache, clearCache, clearAllCache, cacheSize };
