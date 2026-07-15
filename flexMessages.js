const axios = require('axios');
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function replyServiceMenu(replyToken) {
  const buttons = [
    { label: 'บริการด้านเงินกู้',           emoji: '🤝', action: 'เงินกู้'   },
    { label: 'บริการด้านเงินฝาก',           emoji: '🐷', action: 'เงินฝาก'  },
    { label: 'สวัสดิการสงเคราะห์สมาชิก',   emoji: '💰', action: 'สวัสดิการ' },
    { label: 'ช่องทางการติดต่อ',            emoji: '📞', action: 'ติดต่อ'   },
  ];

  const flexContents = {
    type: 'bubble',
    styles: {
      header: { backgroundColor: '#105abe' },
      body:   { backgroundColor: '#fff0f7' },
      footer: { backgroundColor: '#fff0f7' },
    },
    header: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: 'บริการของสหกรณ์',
          color: '#ffffff',
          size: 'xl',
          weight: 'bold',
          align: 'center',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '14px',
      contents: buttons.map(btn => ({
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#d71678',
        cornerRadius: '30px',
        paddingAll: '8px',
        paddingStart: '10px',
        alignItems: 'center',
        action: { type: 'message', text: btn.action },
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            width: '42px',
            height: '42px',
            backgroundColor: '#ffffff30',
            cornerRadius: '21px',
            justifyContent: 'center',
            alignItems: 'center',
            contents: [
              { type: 'text', text: btn.emoji, size: 'lg', align: 'center', gravity: 'center' },
            ],
          },
          {
            type: 'text',
            text: btn.label,
            color: '#ffffff',
            weight: 'bold',
            gravity: 'center',
            margin: 'md',
            flex: 1,
          },
        ],
      })),
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '10px',
      contents: [
        {
          type: 'text',
          text: 'สหกรณ์ออมทรัพย์ กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ จำกัด',
          color: '#d71678',
          size: 'xs',
          align: 'center',
        },
      ],
    },
  };

  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [{ type: 'flex', altText: 'บริการของสหกรณ์', contents: flexContents }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

module.exports = { replyServiceMenu };
