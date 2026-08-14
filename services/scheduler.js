// ไฟล์นี้ทำหน้าที่ "นาฬิกาปลุก" ของระบบ
// เช็คทุกวันว่ามีสมาชิกคนไหนใกล้ถึงกำหนดชำระเงินกู้บ้าง แล้วส่งแจ้งเตือนอัตโนมัติ
// ใช้ payment_day (วันที่ของเดือน) แทน due_date ตรงๆ เพื่อให้แจ้งเตือนซ้ำได้ทุกเดือนโดยไม่ต้องแก้มือ
const cron = require('node-cron');
const db = require('../config/db');
const { push } = require('../config/line');
const { loanReminderFlex } = require('../messages/loanReminder');

// จำนวนวันล่วงหน้าที่จะแจ้งเตือนก่อนถึงกำหนด (แก้ตัวเลขนี้ได้ตามต้องการ)
const REMIND_BEFORE_DAYS = 3;

// คำนวณ due_date ของ "เดือนนี้" จาก payment_day
// เช่น payment_day = 5 วันนี้เดือน 8 ปี 2569 → คืนค่า 2026-08-05
// ถ้า payment_day เกินจำนวนวันในเดือนนั้น (เช่น 31 แต่เดือนก.พ.มี 28 วัน) จะปรับเป็นวันสุดท้ายของเดือนให้อัตโนมัติ
function getDueDateThisMonth(paymentDay) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // หาจำนวนวันสูงสุดของเดือนนี้ ป้องกัน payment_day เกินจริง (เช่น 31 ก.พ. ไม่มีจริง)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(paymentDay, lastDayOfMonth);

  return new Date(year, month, safeDay);
}

// คำนวณจำนวนวันที่เหลือถึง due_date (ปัดเป็นจำนวนเต็มวัน ไม่นับเวลา)
function daysUntil(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// แปลงวันที่เป็นรูปแบบ 'YYYY-MM' ใช้เก็บว่าแจ้งเตือนของเดือนไหนไปแล้ว
function currentYearMonth() {
  return new Date().toISOString().slice(0, 7); // เช่น '2026-08'
}

// ฟังก์ชันหลัก: ไล่เช็คเงินกู้ทุกตัวที่ใกล้ครบกำหนด แล้วส่งแจ้งเตือน
async function checkLoanReminders() {
  console.log('[scheduler] เริ่มเช็คเงินกู้ใกล้ครบกำหนด...');

  try {
    // ดึงเงินกู้ทุกตัวที่ยังมียอดค้าง พร้อมข้อมูลสมาชิกที่เชื่อม LINE แล้ว
    // คำนวณ due_date และเช็คว่าแจ้งเตือนเดือนนี้ไปหรือยังในโค้ด JS แทน SQL (อ่านง่ายกว่า)
    const [loans] = await db.query(
      `SELECT loans.*, users.name, users.line_user_id
       FROM loans
       JOIN users ON loans.member_id = users.member_id
       WHERE users.line_user_id IS NOT NULL
         AND loans.remaining > 0`
    );

    const thisMonth = currentYearMonth();
    let sentCount = 0;

    // วนเช็คทีละสัญญากู้
    for (const loan of loans) {
      // คำนวณวันครบกำหนดของเดือนนี้จาก payment_day
      const dueDate = getDueDateThisMonth(loan.payment_day);
      const daysLeft = daysUntil(dueDate);

      // เช็คเงื่อนไข: เหลือพอดี REMIND_BEFORE_DAYS วัน และยังไม่เคยแจ้งเตือนเดือนนี้
      const alreadyNotified = loan.last_notified_date === thisMonth;

      if (daysLeft === REMIND_BEFORE_DAYS && !alreadyNotified) {
        try {
          // แนบ due_date ที่คำนวณได้เข้าไปใน object เพื่อส่งให้ Flex Message ใช้แสดงผล
          const loanWithDate = { ...loan, due_date: dueDate };

          // สร้างและส่ง Flex Message แจ้งเตือนแบบ push (ไม่ต้องรอ user พิมพ์มาก่อน)
          const flex = loanReminderFlex(loan.name, loanWithDate);
          await push(loan.line_user_id, [flex]);

          // บันทึกว่าแจ้งเตือนของเดือนนี้ไปแล้ว กันส่งซ้ำถ้ารัน cron ซ้ำวันเดียวกัน
          await db.query(
            'UPDATE loans SET last_notified_date = ? WHERE id = ?',
            [thisMonth, loan.id]
          );

          sentCount++;
          console.log(`[scheduler] แจ้งเตือนสำเร็จ: ${loan.name} (${loan.loan_no})`);
        } catch (err) {
          // ถ้าส่งไม่สำเร็จรายใดรายหนึ่ง ให้ log แล้วไปต่อรายถัดไป ไม่หยุดทั้งหมด
          console.error(`[scheduler] ส่งแจ้งเตือนไม่สำเร็จ (${loan.loan_no}):`, err.message);
        }
      }
    }

    console.log(`[scheduler] เช็คครบแล้ว ส่งแจ้งเตือนทั้งหมด ${sentCount} รายการ`);
  } catch (err) {
    console.error('[scheduler] เกิดข้อผิดพลาดตอนเช็คเงินกู้:', err.message);
  }
}

// ตั้งเวลาให้รันทุกวัน เวลา 09:00 น. (เวลาไทย)
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
