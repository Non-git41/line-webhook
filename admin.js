const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { linkRichMenu } = require('../config/line');
const { clearCache, clearAllCache, cacheSize } = require('../services/cache');

// รายชื่อสมาชิกทั้งหมด
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

// จำนวนที่อยู่ใน cache
router.get('/cache-size', (req, res) => {
  res.json({ size: cacheSize() });
});

// ล้าง cache ทุกคน
router.post('/clear-cache', (req, res) => {
  const count = clearAllCache();
  res.json({ message: `ล้าง cache สำเร็จ ${count} คน` });
});

// ล้าง cache รายคน
router.post('/clear-cache-user', (req, res) => {
  const { lineUserId } = req.body;
  if (!lineUserId) return res.status(400).json({ message: 'ไม่พบ LINE User ID' });

  clearCache(lineUserId);
  res.json({ message: 'ล้าง cache สำเร็จ' });
});

// เปลี่ยน Rich Menu ของสมาชิก
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

module.exports = router;
