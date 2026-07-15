require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const { replyServiceMenu } = require('./flexMessages');

const app = express();



const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const path = require('path');

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

    if (text === 'บริการ') {
      // เพิ่มบรรทัดนี้ เรียกใช้ฟังก์ชั้นจากบริการ
      await replyServiceMenuMenu(event.replyToken);
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
const bcrypt = require('bcrypt');
const mysql  = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

app.post('/api/register', async (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    if (rows.length > 0) {
      return res.status(400).json({ message: 'username นี้ถูกใช้งานแล้ว' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
      [username, hashed, name]
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});
const jwt = require('jsonwebtoken');

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    // ── 1. หา user จาก database ───────────────────
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?', [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบ username นี้' });
    }

    const user = rows[0];

    // ── 2. เทียบ password กับ hash ────────────────
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ── 3. ออก JWT Token ──────────────────────────
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'เข้าสู่ระบบสำเร็จ', token });

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

// API รับ login แล้วผูก LINE userId
app.post('/api/liff-login', async (req, res) => {
  const { username, password, lineUserId } = req.body;

  if (!username || !password || !lineUserId) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
  }

  try {
    // เช็ค username/password
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?', [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบ username นี้' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ผูก LINE userId กับ account
    await db.query(
      'UPDATE users SET line_user_id = ? WHERE id = ?',
      [lineUserId, user.id]
    );

    res.json({ message: 'เชื่อมบัญชีสำเร็จ' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});