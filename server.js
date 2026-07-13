require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const { replyServiceMenu } = require('./flexMessages');

const app = express();

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ตรวจสอบ signature ว่า request มาจาก LINE จริง
function verifySignature(req, res, next) {
  const signature = req.headers['x-line-signature'];
  if (!signature) return res.status(401).send('Missing signature');

  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(req.rawBody)
    .digest('base64');

  if (hash !== signature) return res.status(401).send('Invalid signature');

  next();
}

// endpoint หลักที่ LINE จะยิงข้อมูลมา
app.post('/webhook', verifySignature, async (req, res) => {
  res.status(200).send('OK'); // ตอบ 200 ก่อนทันทีเสมอ

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
});

async function handleEvent(event) {
  // ผู้ใช้ส่งข้อความมา
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text.trim();

    if (text === 'บริการ') {
      // เพิ่มบรรทัดนี้ เรียกใช้ฟังก์ชั้นจากบริการ
      await replyServiceMenu(event.replyToken);
    } else {
    await replyMessage(event.replyToken, `รับข้อความแล้ว: ${text}`);
  }
  }
  // ผู้ใช้กดเพิ่มเพื่อน
  if (event.type === 'follow') {
    await replyMessage(event.replyToken, 'ขอบคุณที่เพิ่มเพื่อนครับ 🙏');
  }
}

async function replyMessage(replyToken, text) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [{ type: 'text', text }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

// ใช้เช็คว่า server รันอยู่
app.get('/', (req, res) => {
  res.send('LINE Webhook server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
