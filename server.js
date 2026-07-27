require('dotenv').config();
const express = require('express');

const pagesRoutes   = require('./routes/pages');
const webhookRoutes = require('./routes/webhook');
const apiRoutes     = require('./routes/api');
const adminRoutes   = require('./routes/admin');

const app = express();

// เก็บ raw body ไว้ใช้ verify signature ของ LINE
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use('/', pagesRoutes);          // หน้าเว็บทั้งหมด
app.use('/', webhookRoutes);        // POST /webhook
app.use('/api', apiRoutes);         // /api/login, /api/verify-member ...
app.use('/api/admin', adminRoutes); // /api/admin/members ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
