const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { CHANNEL_SECRET } = require('../config/line');

// ตรวจสอบว่า request มาจาก LINE จริง
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

// ตรวจสอบ JWT Token สำหรับ route ที่ต้อง login ก่อน
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

module.exports = { verifySignature, authMiddleware };
