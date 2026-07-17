require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');


const { replyServiceMenu } = require('./flexMessages');

const app = express();



const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const path = require('path');

// หน้า สมัคร
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'verify.html'));
});

// หน้า login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// หน้า dashboard (ตัวอย่าง)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

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
    const lineUserId = event.source.userId; // ดึง userId จาก LINE

    if (text === 'เมนู') {
      // เพิ่มบรรทัดนี้ เรียกใช้ฟังก์ชั้นจากบริการ
      await replyServiceMenu(event.replyToken);

      } else if (text === 'ข้อมูลของฉัน') {
      await replyUserInfo(event.replyToken, lineUserId);

      } else if (text === 'เชื่อมบัญชี') {
      await replyLiffLink(event.replyToken);


    } else {
    await replyMessage(event.replyToken, `รับข้อความแล้ว: ${text}`);
  }
  }
  // ผู้ใช้กดเพิ่มเพื่อน
  if (event.type === 'follow') {
    await replyMessage(event.replyToken, 'ยินดีต้อนรับครับ 🙏\nพิมพ์ "เชื่อมบัญชี" เพื่อผูกบัญชีสหกรณ์กับ LINE');
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
const bcrypt = require('bcrypt');
const mysql  = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // เพิ่มบรรทัดนี้
});

const jwt = require('jsonwebtoken');

// ── API เช็คสมาชิกและสร้างรหัสผ่าน ─────────────────
app.post('/api/verify-member', async (req, res) => {
  const { member_id, national_id } = req.body;

  if (!member_id || !national_id) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    // เช็คเลขสมาชิก + เลขบัตรประชาชน
    const [rows] = await db.query(
      'SELECT * FROM users WHERE member_id = ? AND national_id = ?',
      [member_id, national_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบข้อมูลสมาชิก กรุณาตรวจสอบอีกครั้ง' });
    }

    // สร้างรหัสผ่านแบบสุ่ม 5 ตัว มีแค่ตัวเลข
    const newPassword = Math.floor(10000 + Math.random() * 90000).toString();
    const hashed = await bcrypt.hash(newPassword, 10);

    // บันทึกรหัสผ่านลง database
    await db.query(
      'UPDATE users SET password = ? WHERE member_id = ?',
      [hashed, member_id]
    );

    res.json({
      message: 'ยืนยันตัวตนสำเร็จ',
      name: rows[0].name,
      member_id: rows[0].member_id,
      password: newPassword, // ส่งรหัสผ่านจริงกลับไปให้แสดงหน้าเว็บ
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});

// ── API Login ด้วยเลขสมาชิก + รหัสผ่าน ─────────────
app.post('/api/login', async (req, res) => {
  const { member_id, password } = req.body;

  if (!member_id || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE member_id = ?', [member_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบเลขสมาชิกนี้' });
    }

    const user = rows[0];

    // ยังไม่เคย activate
    if (!user.password) {
      return res.status(401).json({ message: 'กรุณายืนยันตัวตนก่อนเข้าสู่ระบบ' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { member_id: user.member_id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'เข้าสู่ระบบสำเร็จ', token, name: user.name });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});
// ── Middleware ตรวจสอบ Token ──────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // ต้องส่ง header มาแบบ "Bearer token..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บข้อมูล user ไว้ใช้ใน route ถัดไป
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}
// ── ส่งลิงก์ LIFF ให้ไป login ──────────────────────
async function replyLiffLink(replyToken) {
  const flex = {
    type: 'flex',
    altText: 'เชื่อมบัญชีสหกรณ์',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '🔐 เชื่อมบัญชีสหกรณ์',
            weight: 'bold',
            size: 'lg',
            color: '#105abe',
          },
          {
            type: 'text',
            text: 'กดปุ่มด้านล่างเพื่อเข้าสู่ระบบและผูกบัญชีสหกรณ์กับ LINE ของคุณ',
            wrap: true,
            color: '#666666',
            size: 'sm',
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
            color: '#105abe',
            action: {
              type: 'uri',
              label: 'เข้าสู่ระบบ',
              uri: 'https://liff.line.me/2010712742-XW9bs8So',
            },
          },
        ],
      },
    },
  };

  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    { replyToken, messages: [flex] },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

// ── ดึงข้อมูลสมาชิกแสดงเป็น Flex Message ───────────
async function replyUserInfo(replyToken, lineUserId) {
  try {
    // หา user จาก line_user_id
    const [rows] = await db.query(
      'SELECT * FROM users WHERE line_user_id = ?', [lineUserId]
    );

    // ยังไม่ได้เชื่อมบัญชี
    if (rows.length === 0) {
      await replyMessage(replyToken,
        'ยังไม่ได้เชื่อมบัญชีครับ\nพิมพ์ "เชื่อมบัญชี" เพื่อผูกบัญชีสหกรณ์ก่อน'
      );
      return;
    }

    const user = rows[0];

    // สร้าง Flex Message แบบ Receipt
    const flex = {
      type: 'flex',
      altText: 'ข้อมูลสมาชิก',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            // หัวข้อ
            {
              type: 'text',
              text: 'ข้อมูลสมาชิก',
              weight: 'bold',
              color: '#105abe',
              size: 'sm',
            },
            {
              type: 'text',
              text: user.name,
              weight: 'bold',
              size: 'xxl',
              margin: 'md',
            },
            {
              type: 'separator',
              margin: 'md',
            },
            // รายละเอียด
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: 'เลขสมาชิก', color: '#555555', size: 'sm', flex: 1 },
                    { type: 'text', text: user.member_id, color: '#111111', size: 'sm', flex: 2, align: 'end' },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: 'สมัครเมื่อ', color: '#555555', size: 'sm', flex: 1 },
                    {
                      type: 'text',
                      text: new Date(user.created_at).toLocaleDateString('th-TH'),
                      color: '#111111',
                      size: 'sm',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                },
              ],
            },
            {
              type: 'separator',
              margin: 'md',
            },
            // footer ข้อมูล
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'สถานะ', color: '#555555', size: 'sm', flex: 1 },
                { type: 'text', text: 'สมาชิกปกติ', color: '#105abe', size: 'sm', flex: 2, align: 'end', weight: 'bold' },
              ],
            },
          ],
        },
      },
    };

    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      { replyToken, messages: [flex] },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

  } catch (err) {
    console.error(err);
    await replyMessage(replyToken, 'เกิดข้อผิดพลาดครับ');
  }
}
// ── ตัวอย่าง route ที่ต้อง login ก่อนถึงเข้าได้ ────────
app.get('/api/profile', authMiddleware, async (req, res) => {
  res.json({
    message: 'ดึงข้อมูลสำเร็จ',
    user: req.user
  });
});
// ใช้เช็คว่า server รันอยู่
app.get('/', (req, res) => {
  res.send('LINE Webhook server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// หน้า LIFF Login
app.get('/liff-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'liff-login.html'));
});

// API รับ login แล้วผูก member_id
app.post('/api/liff-login', async (req, res) => {
  const { member_id, password, lineUserId } = req.body;

  if (!member_id || !password || !lineUserId) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
  }

  try {
    // ── เช็คว่า line_user_id นี้ผูกกับสมาชิกคนอื่นอยู่แล้วไหม ──
    const [existing] = await db.query(
      'SELECT member_id, name FROM users WHERE line_user_id = ?',
      [lineUserId]
    );

    if (existing.length > 0 && existing[0].member_id !== member_id) {
      return res.status(400).json({ 
        message: `LINE นี้เชื่อมกับบัญชีสมาชิก ${existing[0].member_id} อยู่แล้ว กรุณาติดต่อเจ้าหน้าที่` 
      });
    }

    // ── เช็ค member_id + password ──────────────────────
    const [rows] = await db.query(
      'SELECT * FROM users WHERE member_id = ?', [member_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบเลขสมาชิกนี้' });
    }

    const user = rows[0];

    if (!user.password) {
      return res.status(401).json({ message: 'กรุณายืนยันตัวตนก่อนเข้าสู่ระบบ' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ── ผูก LINE userId กับบัญชีสมาชิก ────────────────
    await db.query(
      'UPDATE users SET line_user_id = ? WHERE member_id = ?',
      [lineUserId, member_id]
    );

    res.json({ message: 'เชื่อมบัญชีสำเร็จ', name: user.name });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});