const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { reply, replyText } = require('../config/line');
const { verifySignature } = require('../middlewares/auth');
const { getCache, setCache } = require('../services/cache');

const { serviceMenuFlex } = require('../messages/serviceMenu');
const { liffLinkFlex }    = require('../messages/liffLink');
const { userInfoFlex }    = require('../messages/userInfo');

router.post('/webhook', verifySignature, async (req, res) => {
  res.status(200).send('OK'); // ตอบ 200 ก่อนเสมอ กัน LINE retry

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error('Webhook error:', err.message);
    }
  }
});

async function handleEvent(event) {
  const lineUserId = event.source.userId;

  // ผู้ใช้เพิ่มเพื่อน
  if (event.type === 'follow') {
    await replyText(
      event.replyToken,
      'ยินดีต้อนรับครับ 🙏\nพิมพ์ "เชื่อมบัญชี" เพื่อผูกบัญชีสหกรณ์กับ LINE'
    );
    return;
  }

  // ผู้ใช้ส่งข้อความ
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text.trim();

    switch (text) {
      case 'เมนู':
        await reply(event.replyToken, [serviceMenuFlex()]);
        break;

      case 'เชื่อมบัญชี':
        await reply(event.replyToken, [liffLinkFlex()]);
        break;

      case 'ข้อมูลของฉัน':
      case 'บัตรสมาชิก':
        await sendUserInfo(event.replyToken, lineUserId);
        break;

      default:
        await replyText(event.replyToken, 'พิมพ์ "เมนู" เพื่อดูบริการของสหกรณ์ครับ');
    }
  }
}

// ดึงข้อมูลสมาชิก + เงินฝาก + เงินกู้ (ใช้ cache ก่อน ถ้าไม่มีค่อย query)
async function sendUserInfo(replyToken, lineUserId) {
  let data = getCache(lineUserId);

  if (data) {
    console.log('ใช้ข้อมูลจาก cache');
  } else {
    console.log('ดึงข้อมูลจาก database');

    const [userRows] = await db.query(
      'SELECT * FROM users WHERE line_user_id = ?',
      [lineUserId]
    );

    if (userRows.length === 0) {
      await replyText(
        replyToken,
        'ยังไม่ได้เชื่อมบัญชีครับ\nพิมพ์ "เชื่อมบัญชี" เพื่อผูกบัญชีสหกรณ์ก่อน'
      );
      return;
    }

    const user = userRows[0];

    // ดึงเงินฝากและเงินกู้พร้อมกัน
    const [savingRows] = await db.query(
      'SELECT * FROM savings WHERE member_id = ? LIMIT 1',
      [user.member_id]
    );
    const [loanRows] = await db.query(
      'SELECT * FROM loans WHERE member_id = ? LIMIT 1',
      [user.member_id]
    );

    data = {
      user,
      saving: savingRows[0] || null,
      loan: loanRows[0] || null,
    };
    setCache(lineUserId, data);
  }

  await reply(replyToken, [userInfoFlex(data.user, data.saving, data.loan)]);
}

module.exports = router;