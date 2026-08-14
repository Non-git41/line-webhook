// route กลุ่มนี้ทั้งหมดใช้สำหรับเจ้าของระบบจัดการเบื้องหลัง (ไม่ใช่สมาชิกทั่วไป)
const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { linkRichMenu } = require('../config/line');
const { clearCache, clearAllCache, cacheSize } = require('../services/cache');
const { checkLoanReminders } = require('../services/scheduler');

// ดึงรายชื่อสมาชิกทั้งหมด พร้อมสถานะว่าเชื่อม LINE แล้วหรือยัง
router.get('/members', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT member_id, name, line_user_id FROM users ORDER BY member_id'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// ดูจำนวนที่อยู่ใน cache ตอนนี้
router.get('/cache-size', (req, res) => {
  res.json({ size: cacheSize() });
});

// ล้าง cache ของทุกคนพร้อมกัน
router.post('/clear-cache', (req, res) => {
  const count = clearAllCache();
  res.json({ message: `ล้าง cache สำเร็จ ${count} คน` });
});

// ล้าง cache ของสมาชิกคนเดียว
router.post('/clear-cache-user', (req, res) => {
  const { lineUserId } = req.body;
  if (!lineUserId) return res.status(400).json({ message: 'ไม่พบ LINE User ID' });

  clearCache(lineUserId);
  res.json({ message: 'ล้าง cache สำเร็จ' });
});

// เปลี่ยน Rich Menu ของสมาชิกคนใดคนหนึ่ง (ทั่วไป / สมาชิก)
router.post('/set-richmenu', async (req, res) => {
  const { lineUserId, type } = req.body;
  if (!lineUserId) return res.status(400).json({ message: 'ไม่พบ LINE User ID' });

  const menuId =
    type === 'member' ? process.env.RICHMENU_MEMBER : process.env.RICHMENU_GENERAL;

  try {
    await linkRichMenu(lineUserId, menuId);
    res.json({ message: 'เปลี่ยน Rich Menu สำเร็จ' });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'เปลี่ยน Rich Menu ไม่สำเร็จ' });
  }
});

// สั่งให้เช็คและส่งแจ้งเตือนเงินกู้ทันที (ใช้ทดสอบ ไม่ต้องรอถึง 09:00)
router.get('/test-loan-reminder', async (req, res) => {
  await checkLoanReminders();
  res.send('รันเช็คแจ้งเตือนเงินกู้เรียบร้อย ดู log ใน Render');
});

module.exports = router;
