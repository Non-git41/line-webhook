// Flex Message แสดงข้อมูลสมาชิก
function row(label, value, valueColor = '#111111', bold = false) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#555555', size: 'sm', flex: 1 },
      {
        type: 'text',
        text: value,
        color: valueColor,
        size: 'sm',
        flex: 2,
        align: 'end',
        ...(bold && { weight: 'bold' }),
      },
    ],
  };
}

function userInfoFlex(user) {
  return {
    type: 'flex',
    altText: 'ข้อมูลสมาชิก',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'ข้อมูลสมาชิก',
            weight: 'bold',
            color: '#105abe',
            size: 'sm',
          },
          {
            type: 'text',
            text: user.name,
            weight: 'bold',
            size: 'xxl',
            margin: 'md',
            wrap: true,
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              row('เลขสมาชิก', user.member_id),
              row('สมัครเมื่อ', new Date(user.created_at).toLocaleDateString('th-TH')),
            ],
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [row('สถานะ', 'สมาชิกปกติ', '#105abe', true)],
          },
        ],
      },
    },
  };
}

module.exports = { userInfoFlex };
