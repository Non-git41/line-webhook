require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function setup() {
  try {
    // อ่านไฟล์รูปทั้ง 2 อัน
    const image1 = fs.readFileSync('./richmenu.png');
    const image2 = fs.readFileSync('./richmenu.png');

    // ── Step 1: สร้าง Rich Menu ทั่วไป ────────────────
    console.log('1. สร้าง Rich Menu ทั่วไป...');
    const richMenuBody1 = {
      size: { width: 2500, height: 1686 },
      selected: true,
      name: 'General Menu',
      chatBarText: 'เมนู',
      areas: [
        {
          bounds: { x: 0,    y: 843, width: 833,  height: 843 },
          action: { type: 'message', text: 'เมนู' },
        },
        {
          bounds: { x: 833,  y: 843, width: 834,  height: 843 },
          action: { type: 'uri', uri: 'https://line-webhook-r2lr.onrender.com/verify' },
        },
        {
          bounds: { x: 1667, y: 843, width: 833,  height: 843 },
          action: { type: 'uri', uri: 'https://line-webhook-r2lr.onrender.com/login' },
        },
      ],
    };

    const menu1 = await axios.post(
      'https://api.line.me/v2/bot/richmenu',
      richMenuBody1,
      { headers }
    );
    const menuId1 = menu1.data.richMenuId;
    console.log('   ID (ทั่วไป):', menuId1);

    await axios.post(
      `https://api-data.line.me/v2/bot/richmenu/${menuId1}/content`,
      image1,
      {
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'image/png' },
        maxBodyLength: Infinity,
      }
    );
    console.log('   อัปโหลดรูปเรียบร้อย');

    // ── Step 2: สร้าง Rich Menu สมาชิก ────────────────
    const richMenuBody2 = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'Member Menu',
  chatBarText: 'เมนูสมาชิก',
  areas: [
    // ── แถวบน ──────────────────────────────────────────
    {
      bounds: { x: 0,    y: 0, width: 833,  height: 843 },
      action: { type: 'message', text: 'เกี่ยวกับเรา' },
    },
    {
      bounds: { x: 833,  y: 0, width: 834,  height: 843 },
      action: { type: 'message', text: 'โปรโมชั่น' },
    },
    {
      bounds: { x: 1667, y: 0, width: 833,  height: 843 },
      action: { type: 'message', text: 'นัดหมาย' },
    },
    // ── แถวล่าง ─────────────────────────────────────────
    {
      bounds: { x: 0,    y: 843, width: 833,  height: 843 },
      action: { type: 'message', text: 'สั่งซื้อสินค้า' },
    },
    {
      bounds: { x: 833,  y: 843, width: 834,  height: 843 },
      action: { type: 'message', text: 'บัตรสมาชิก' },
    },
    {
      bounds: { x: 1667, y: 843, width: 833,  height: 843 },
      action: { type: 'message', text: 'ที่อยู่' },
    },
  ],
};

    const menu2 = await axios.post(
      'https://api.line.me/v2/bot/richmenu',
      richMenuBody2,
      { headers }
    );
    const menuId2 = menu2.data.richMenuId;
    console.log('   ID (สมาชิก):', menuId2);

    await axios.post(
      `https://api-data.line.me/v2/bot/richmenu/${menuId2}/content`,
      image2,
      {
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'image/png' },
        maxBodyLength: Infinity,
      }
    );
    console.log('   อัปโหลดรูปเรียบร้อย');

    // ── Step 3: ตั้ง Rich Menu ทั่วไปเป็น default ──────
    console.log('3. ตั้ง Rich Menu ทั่วไปเป็น default...');
    await axios.post(
      `https://api.line.me/v2/bot/user/all/richmenu/${menuId1}`,
      {},
      { headers }
    );

    console.log('\n✅ Rich Menu พร้อมใช้งานแล้วครับ!');
    console.log(`   RICHMENU_GENERAL=${menuId1}`);
    console.log(`   RICHMENU_MEMBER=${menuId2}`);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

setup();