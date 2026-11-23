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

// เสิร์ฟรูป Imagemap ให้ LINE ดึงไปแสดง (LINE ขอรูปมาหลายขนาด เช่น /1040 /700)
router.get('/imagemap/promo/:size', (req, res) => {
  // ส่งไฟล์เดียวกันกลับไปทุกขนาด และบอกชนิดไฟล์เองเพราะ URL ไม่มีนามสกุล
  res.type('png').sendFile(path.join(__dirname, '..', 'imagemap', 'promo.png'));
});

// เสิร์ฟรูป Imagemap ให้ LINE ดึงไปแสดง
router.get('/imagemap/promo1/:size', (req, res) => {
  // เก็บ path เต็มของไฟล์ไว้ log ถ้าหาไม่เจอ จะได้เห็นว่าเซิร์ฟเวอร์หาที่ไหน
  const file = path.join(__dirname, '..', 'promo.png');

  // ใส่ callback เพื่อดักตอนส่งไฟล์ไม่สำเร็จ แทนที่จะปล่อยให้ขึ้น Not Found เฉยๆ
  res.type('png').sendFile(file, (err) => {
    if (err) {
      console.error('[imagemap] ส่งรูปไม่สำเร็จ, path ที่หา:', file);
      res.status(404).send('ไม่พบไฟล์รูป promo.png ที่ root ของโปรเจกต์');
    }
  });
});

module.exports = router;
