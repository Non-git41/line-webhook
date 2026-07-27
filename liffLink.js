// Flex Message ปุ่มเชื่อมบัญชีผ่าน LIFF
const LIFF_URL = process.env.LIFF_URL || 'https://line-webhook-r2lr.onrender.com/liff-login';

function liffLinkFlex() {
  return {
    type: 'flex',
    altText: 'เชื่อมบัญชีสหกรณ์',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '🔐 เชื่อมบัญชีสหกรณ์',
            weight: 'bold',
            size: 'lg',
            color: '#105abe',
          },
          {
            type: 'text',
            text: 'กดปุ่มด้านล่างเพื่อเข้าสู่ระบบและผูกบัญชีสหกรณ์กับ LINE ของคุณ',
            wrap: true,
            color: '#666666',
            size: 'sm',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#105abe',
            action: { type: 'uri', label: 'เข้าสู่ระบบ', uri: LIFF_URL },
          },
        ],
      },
    },
  };
}

module.exports = { liffLinkFlex };
