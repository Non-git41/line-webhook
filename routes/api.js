const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const db = require('../config/db');
const { linkRichMenu } = require('../config/line');
const { authMiddleware } = require('../middlewares/auth');

// ── ยืนยันตัวตนสมาชิก แล้วสร้างรหัสผ่านให้ ───────────────
router.post('/verify-member', async (req, res) => {
  const { member_id, national_id } = req.body;

  if (!member_id || !national_id) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE member_id = ? AND national_id = ?',
      [member_id, national_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบข้อมูลสมาชิก กรุณาตรวจสอบอีกครั้ง' });
    }

    // สุ่มรหัสผ่าน 5 หลัก เฉพาะตัวเลข
    const newPassword = Math.floor(10000 + Math.random() * 90000).toString();
    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password = ? WHERE member_id = ?', [
      hashed,
      member_id,
    ]);

    res.json({
      message: 'ยืนยันตัวตนสำเร็จ',
      name: rows[0].name,
      member_id: rows[0].member_id,
      password: newPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});

// ── ตรวจสอบ member_id + password (ใช้ร่วมกันทั้ง 2 API) ──
async function checkCredentials(member_id, password) {
  const [rows] = await db.query('SELECT * FROM users WHERE member_id = ?', [
    member_id,
  ]);

  if (rows.length === 0) {
    return { error: 'ไม่พบเลขสมาชิกนี้' };
  }

  const user = rows[0];

  if (!user.password) {
    return { error: 'กรุณายืนยันตัวตนก่อนเข้าสู่ระบบ' };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return { error: 'รหัสผ่านไม่ถูกต้อง' };
  }

  return { user };
}

// ── Login ผ่านเบราว์เซอร์ ────────────────────────────────
router.post('/login', async (req, res) => {
  const { member_id, password } = req.body;

  if (!member_id || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const { user, error } = await checkCredentials(member_id, password);
    if (error) return res.status(401).json({ message: error });

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

// ── Login ผ่าน LIFF แล้วผูก LINE userId ──────────────────
router.post('/liff-login', async (req, res) => {
  const { member_id, password, lineUserId } = req.body;

  if (!member_id || !password || !lineUserId) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
  }

  try {
    // LINE นี้ผูกกับสมาชิกคนอื่นอยู่แล้วหรือไม่
    const [existing] = await db.query(
      'SELECT member_id FROM users WHERE line_user_id = ?',
      [lineUserId]
    );

    if (existing.length > 0 && existing[0].member_id !== member_id) {
      return res.status(400).json({
        message: `LINE นี้เชื่อมกับบัญชีสมาชิก ${existing[0].member_id} อยู่แล้ว กรุณาติดต่อเจ้าหน้าที่`,
      });
    }

    const { user, error } = await checkCredentials(member_id, password);
    if (error) return res.status(401).json({ message: error });

    await db.query('UPDATE users SET line_user_id = ? WHERE member_id = ?', [
      lineUserId,
      member_id,
    ]);

    // เปลี่ยนเป็น Rich Menu สมาชิก
    await linkRichMenu(lineUserId, process.env.RICHMENU_MEMBER);

    res.json({ message: 'เชื่อมบัญชีสำเร็จ', name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});

// ── route ที่ต้อง login ก่อนถึงเข้าได้ ───────────────────
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'ดึงข้อมูลสำเร็จ', user: req.user });
});

module.exports = router;
