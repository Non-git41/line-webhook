// ไฟล์นี้ทำหน้าที่ "นาฬิกาปลุก" ของระบบ
// เช็คทุกวันว่ามีสมาชิกคนไหนใกล้ถึงกำหนดชำระเงินกู้บ้าง แล้วส่งแจ้งเตือนอัตโนมัติ
const cron = require('node-cron');
const db = require('../config/db');
const { push } = require('../config/line');
const { loanReminderFlex } = require('../messages/loanReminder');

// จำนวนวันล่วงหน้าที่จะแจ้งเตือนก่อนถึงกำหนด (แก้ตัวเลขนี้ได้ตามต้องการ)
const REMIND_BEFORE_DAYS = 3;

// ฟังก์ชันหลัก: ไล่เช็คเงินกู้ทุกตัวที่ใกล้ครบกำหนด แล้วส่งแจ้งเตือน
async function checkLoanReminders() {
  console.log('[scheduler] เริ่มเช็คเงินกู้ใกล้ครบกำหนด...');

  try {
    // ดึงเงินกู้ที่ครบกำหนดในอีก REMIND_BEFORE_DAYS วัน
    // และยังไม่เคยแจ้งเตือนสำหรับวันครบกำหนดนี้ (last_notified_date ไม่ตรงกับ due_date)
    // JOIN กับตาราง users เพื่อเอาชื่อและ line_user_id มาด้วย
    const [loans] = await db.query(
      `SELECT loans.*, users.name, users.line_user_id
       FROM loans
       JOIN users ON loans.member_id = users.member_id
       WHERE DATEDIFF(loans.due_date, CURDATE()) = ?
         AND users.line_user_id IS NOT NULL
         AND (loans.last_notified_date IS NULL OR loans.last_notified_date != loans.due_date)`,
      [REMIND_BEFORE_DAYS]
    );

    console.log(`[scheduler] พบ ${loans.length} รายการที่ต้องแจ้งเตือน`);

    // วนส่งแจ้งเตือนทีละคน
    for (const loan of loans) {
      try {
        // สร้าง Flex Message แจ้งเตือน แล้วส่งแบบ push (ไม่ต้องรอ user พิมพ์มาก่อน)
        const flex = loanReminderFlex(loan.name, loan);
        await push(loan.line_user_id, [flex]);

        // อัปเดตว่าแจ้งเตือนงวดนี้ไปแล้ว กันส่งซ้ำถ้ารัน cron ซ้ำวันเดียวกัน
        await db.query(
          'UPDATE loans SET last_notified_date = ? WHERE id = ?',
          [loan.due_date, loan.id]
        );

        console.log(`[scheduler] แจ้งเตือนสำเร็จ: ${loan.name} (${loan.loan_no})`);
      } catch (err) {
        // ถ้าส่งไม่สำเร็จรายใดรายหนึ่ง ให้ log แล้วไปต่อรายถัดไป ไม่หยุดทั้งหมด
        console.error(`[scheduler] ส่งแจ้งเตือนไม่สำเร็จ (${loan.loan_no}):`, err.message);
      }
    }
  } catch (err) {
    console.error('[scheduler] เกิดข้อผิดพลาดตอนเช็คเงินกู้:', err.message);
  }
}

// ตั้งเวลาให้รันทุกวัน เวลา 09:00 น. (เวลาไทย)
// รูปแบบ cron: นาที ชั่วโมง วัน เดือน วันในสัปดาห์
function startScheduler() {
  cron.schedule(
    '0 9 * * *',
    () => {
      checkLoanReminders();
    },
    { timezone: 'Asia/Bangkok' }
  );

  console.log('[scheduler] ตั้งเวลาแจ้งเตือนเงินกู้ทุกวัน 09:00 น. เรียบร้อย');
}

// ส่งออกทั้งฟังก์ชันเริ่ม scheduler และฟังก์ชันเช็ค (เผื่อเรียกทดสอบเองผ่าน route)
module.exports = { startScheduler, checkLoanReminders };
