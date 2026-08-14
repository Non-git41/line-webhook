const axios = require('axios');

// ดึงค่า secret และ token จาก .env มาเก็บไว้ใช้ทั้งไฟล์
const CHANNEL_SECRET       = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// header มาตรฐานที่ต้องแนบไปทุกครั้งที่คุยกับ LINE API
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
};

// ส่งข้อความตอบกลับ (ใช้ตอบทันทีหลัง user พิมพ์มา ต้องมี replyToken)
async function reply(replyToken, messages) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    { replyToken, messages },
    { headers }
  );
}

// ส่งข้อความธรรมดาแบบ reply
async function replyText(replyToken, text) {
  await reply(replyToken, [{ type: 'text', text }]);
}

// ส่งข้อความหา user โดยที่ user ไม่ต้องพิมพ์มาก่อน (ใช้สำหรับแจ้งเตือนอัตโนมัติ)
// ต่างจาก reply ตรงที่ใช้ lineUserId แทน replyToken
async function push(lineUserId, messages) {
  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    { to: lineUserId, messages },
    { headers }
  );
}

// ส่งข้อความธรรมดาแบบ push (ทางลัด เรียกใช้บ่อย)
async function pushText(lineUserId, text) {
  await push(lineUserId, [{ type: 'text', text }]);
}

// เปลี่ยน Rich Menu ของ user คนเดียว
async function linkRichMenu(lineUserId, richMenuId) {
  await axios.post(
    `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${richMenuId}`,
    {},
    { headers }
  );
}

// ส่งออกฟังก์ชันทั้งหมดให้ไฟล์อื่นเรียกใช้ได้
module.exports = {
  CHANNEL_SECRET,
  CHANNEL_ACCESS_TOKEN,
  headers,
  reply,
  replyText,
  push,
  pushText,
  linkRichMenu,
};
