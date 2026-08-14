require('dotenv').config();
const express = require('express');

// โหลด route ทุกกลุ่มที่แยกไฟล์ไว้
const pagesRoutes   = require('./routes/pages');
const webhookRoutes = require('./routes/webhook');
const apiRoutes     = require('./routes/api');
const adminRoutes   = require('./routes/admin');

// โหลดตัวตั้งเวลาแจ้งเตือนอัตโนมัติ
const { startScheduler } = require('./services/scheduler');

const app = express();

// เก็บ raw body ไว้ใช้ verify signature ของ LINE
// ต้องเก็บก่อนแปลงเป็น JSON เพราะ verify ต้องใช้ข้อมูลดิบ
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ผูก route แต่ละกลุ่มเข้ากับ path ของมัน
app.use('/', pagesRoutes);          // หน้าเว็บทั้งหมด
app.use('/', webhookRoutes);        // POST /webhook
app.use('/api', apiRoutes);         // /api/login, /api/verify-member ...
app.use('/api/admin', adminRoutes); // /api/admin/members ...

// เริ่มระบบแจ้งเตือนอัตโนมัติ (ทำงานเบื้องหลังตลอดเวลา server เปิดอยู่)
startScheduler();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
