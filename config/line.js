const axios = require('axios');

const CHANNEL_SECRET       = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
};

// ส่งข้อความตอบกลับ ใช้ได้ทั้ง text และ flex
async function reply(replyToken, messages) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    { replyToken, messages },
    { headers }
  );
}

// ส่งข้อความธรรมดา
async function replyText(replyToken, text) {
  await reply(replyToken, [{ type: 'text', text }]);
}

// เปลี่ยน Rich Menu ของ user คนเดียว
async function linkRichMenu(lineUserId, richMenuId) {
  await axios.post(
    `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${richMenuId}`,
    {},
    { headers }
  );
}

module.exports = {
  CHANNEL_SECRET,
  CHANNEL_ACCESS_TOKEN,
  headers,
  reply,
  replyText,
  linkRichMenu,
};
