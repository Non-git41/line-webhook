require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

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

app.post('/webhook', verifySignature, async (req, res) => {
  res.status(200).send('OK');

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
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text;

    // พิมพ์ "สมาชิก" จะได้รับ Flex Message
    if (text === 'สมาชิก') {
      await replyFlex(event.replyToken);
    } else {
      await replyMessage(event.replyToken, `รับข้อความแล้ว: ${text}`);
    }
  }

  if (event.type === 'follow') {
    await replyMessage(event.replyToken, 'ขอบคุณที่เพิ่มเพื่อนครับ 🙏');
  }
}

// ส่งข้อความธรรมดา
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

// ส่ง Flex Message
async function replyFlex(replyToken) {
  const flexMessage = {
    type: 'flex',
    altText: 'ข้อมูลสมาชิก', // ข้อความที่แสดงในหน้าแชทแทน flex (กรณีเปิดไม่ได้)
    contents: {
      type: 'bubble', // กล่องเดียว (ถ้าหลายกล่องใช้ carousel)
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#105abe',
        contents: [
          {
            type: 'text',
            text: 'ข้อมูลสมาชิก',
            color: '#ffffff',
            size: 'lg',
            weight: 'bold',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ชื่อ', size: 'sm', color: '#888888', flex: 1 },
              { type: 'text', text: 'สมชาย ใจดี', size: 'sm', flex: 2 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'รหัสสมาชิก', size: 'sm', color: '#888888', flex: 1 },
              { type: 'text', text: '00123', size: 'sm', flex: 2 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'เงินฝาก', size: 'sm', color: '#888888', flex: 1 },
              { type: 'text', text: '50,000 บาท', size: 'sm', color: '#00aa00', flex: 2 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'เงินกู้คงเหลือ', size: 'sm', color: '#888888', flex: 1 },
              { type: 'text', text: '120,000 บาท', size: 'sm', color: '#cc0000', flex: 2 },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#d71678',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียดเพิ่มเติม',
              uri: 'https://www.coopmsds.com', // เปลี่ยนเป็น URL ของสหกรณ์ได้
            },
          },
        ],
      },
    },
  };

  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [flexMessage],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

app.get('/', (req, res) => {
  res.send('LINE Webhook server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
