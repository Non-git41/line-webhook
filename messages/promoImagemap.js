// ไฟล์นี้เก็บข้อความ Imagemap โปรโมชั่น (รูปเดียว กดแล้วเปิดลิงก์)
// ทำเป็นฟังก์ชันเหมือนไฟล์อื่นใน messages/ เพื่อเรียกใช้จากที่ไหนก็ได้
function promoImagemap() {
  return {
    type: 'imagemap',
    // LINE จะเรียกรูปจาก baseUrl + /1040, /700, /460 ... ตามขนาดหน้าจอ
    baseUrl: 'https://line-webhook-r2lr.onrender.com/imagemap/promo',
    // ข้อความที่แสดงในรายการแชทและแจ้งเตือน (ก่อนเปิดดูรูป)
    altText: '📢 โปรโมชั่นสหกรณ์ 📢',
    // ขนาดอ้างอิงของรูป ใช้กำหนดพิกัดพื้นที่กด (ไม่ใช่ขนาดจริง)
    baseSize: { width: 1040, height: 1040 },
    actions: [
      {
        type: 'uri', // กดแล้วเปิดลิงก์
        linkUri: 'https://www.coopmsds.com',
        // พื้นที่กดคลุมทั้งรูป (กดตรงไหนก็เปิดลิงก์)
        area: { x: 0, y: 0, width: 1040, height: 1040 },
      },
    ],
  };
}

// ส่งออกให้ไฟล์อื่นเรียกใช้ได้
module.exports = { promoImagemap };