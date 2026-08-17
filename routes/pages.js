const express = require('express');
const path = require('path');
const router = express.Router();

// ไฟล์ .html อยู่ที่ root ของโปรเจกต์ (ถอยขึ้นมา 1 ระดับจาก routes/)
const page = (file) => (req, res) =>
  res.sendFile(path.join(__dirname, '..', file));

router.get('/verify',     page('verify.html'));      // หน้ายืนยันตัวตน
router.get('/login',      page('login.html'));       // หน้า login ผ่านเบราว์เซอร์
router.get('/liff-login', page('login.html'));       // หน้า login ผ่าน LINE (LIFF)
router.get('/dashboard',  page('dashboard.html'));   // หน้า dashboard
router.get('/admin',      page('admin.html'));       // หน้า admin

// route สำหรับ cron-job.org ปลุก server โดยเฉพาะ ตอบสั้นที่สุด
router.get('/ping', (req, res) => res.send('OK'));

module.exports = router;
